import {
  ONLINE_PROTOCOL_VERSION,
  canonicalCommitmentPayload,
  validateRoomCreateRequest,
  validateRoomJoinRequest,
} from '@greedy-sweeper/online-protocol';
import { BOARD_CONFIG } from '@greedy-sweeper/game-core/config/game-config';
import { createChallengeBoard } from '@greedy-sweeper/game-core/challenge/board';
import { createChallengeDescriptor } from '@greedy-sweeper/game-core/challenge/contracts';
import { applyAction } from '@greedy-sweeper/game-core/engine/transition';
import {
  createGreedInitialState,
  createInitialState,
} from '@greedy-sweeper/game-core/model/factories';

const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

export class RoomDurableObject {
  constructor(state) {
    this.state = state;
    this.sockets = new Set();
  }

  initialize() {
    this.state.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS room_metadata (id INTEGER PRIMARY KEY, room_code TEXT NOT NULL, ruleset TEXT NOT NULL, lifecycle TEXT NOT NULL, creator_digest TEXT NOT NULL, invitee_digest TEXT)',
    );
    this.state.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS room_match (id INTEGER PRIMARY KEY, opening_player TEXT NOT NULL, commitment TEXT NOT NULL)',
    );
    this.state.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS room_authority (id INTEGER PRIMARY KEY, sequence INTEGER NOT NULL, descriptor_json TEXT NOT NULL, state_json TEXT NOT NULL, commands_json TEXT NOT NULL)',
    );
  }

  async fetch(request) {
    this.initialize();
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/foundation')
      return json({ status: 'foundation', storage: 'sqlite' });
    if (request.method === 'POST' && url.pathname === '/setup') return this.setup(request);
    if (request.method === 'GET' && url.pathname === '/inspect') return this.inspect();
    if (request.method === 'POST' && url.pathname === '/join') return this.join(request);
    if (url.pathname === '/socket') return this.socket(request);
    return new Response('Not found', { status: 404 });
  }

  async setup(request) {
    const { roomCode, ruleset, creatorDigest } = await request.json();
    const existing = Array.from(this.state.storage.sql.exec('SELECT id FROM room_metadata'))[0];
    if (existing) return json({ error: { code: 'online_room_exists' } }, 409);
    this.state.storage.sql.exec(
      "INSERT INTO room_metadata (id, room_code, ruleset, lifecycle, creator_digest) VALUES (1, ?, ?, 'setup', ?)",
      roomCode,
      ruleset,
      creatorDigest,
    );
    return json({ roomCode, ruleset, lifecycle: 'setup' }, 201);
  }

  inspect() {
    const room = Array.from(
      this.state.storage.sql.exec(
        'SELECT room_code, ruleset, lifecycle FROM room_metadata WHERE id = 1',
      ),
    )[0];
    const match = Array.from(
      this.state.storage.sql.exec('SELECT opening_player, commitment FROM room_match WHERE id = 1'),
    )[0];
    return room
      ? json({
          roomCode: room.room_code,
          ruleset: room.ruleset,
          lifecycle: room.lifecycle,
          ...(match ? { openingPlayer: match.opening_player, commitment: match.commitment } : {}),
        })
      : json({ error: { code: 'online_room_not_found' } }, 404);
  }

  async join(request) {
    const { inviteeDigest } = await request.json();
    const room = Array.from(
      this.state.storage.sql.exec('SELECT ruleset, invitee_digest FROM room_metadata WHERE id = 1'),
    )[0];
    if (!room) return json({ error: { code: 'online_room_not_found' } }, 404);
    if (room.invitee_digest) return json({ error: { code: 'online_room_full' } }, 409);
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    const salt = createSecret();
    const openingPlayer = crypto.getRandomValues(new Uint8Array(1))[0] % 2 ? 'creator' : 'invitee';
    const commitment = await digest(
      canonicalCommitmentPayload({ ruleset: room.ruleset, seed, salt, openingPlayer }),
    );
    this.state.storage.sql.exec(
      "UPDATE room_metadata SET invitee_digest = ?, lifecycle = 'active' WHERE id = 1",
      inviteeDigest,
    );
    this.state.storage.sql.exec(
      'INSERT INTO room_match (id, opening_player, commitment) VALUES (1, ?, ?)',
      openingPlayer,
      commitment,
    );
    const descriptor = createChallengeDescriptor({
      seed,
      board: BOARD_CONFIG,
      rulesVersion: room.ruleset === 'greed-v2' ? '2' : '1',
      mode: room.ruleset === 'greed-v2' ? 'greed' : 'standard',
    });
    const board = createChallengeBoard(descriptor).value.board;
    const state =
      room.ruleset === 'greed-v2' ? createGreedInitialState(board) : createInitialState(board);
    state.currentPlayer = openingPlayer === 'creator' ? 'human' : 'ai';
    this.state.storage.sql.exec(
      'INSERT INTO room_authority (id, sequence, descriptor_json, state_json, commands_json) VALUES (1, 0, ?, ?, ?)',
      JSON.stringify(descriptor),
      JSON.stringify(state),
      '[]',
    );
    await this.state.storage.put('terminal-proof', { seed, salt });
    return json({ ruleset: room.ruleset, lifecycle: 'active', openingPlayer, commitment });
  }

  async socket(request) {
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Expected WebSocket', { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    server.addEventListener('message', (event) => {
      void this.handleSocketMessage(server, event);
    });
    return new Response(null, { status: 101, webSocket: client });
  }

  async authenticateSocket(socket, event) {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return closeProtocol(socket, 'online_malformed');
    }
    if (
      message?.version !== ONLINE_PROTOCOL_VERSION ||
      message?.type !== 'authenticate' ||
      typeof message?.payload?.seatToken !== 'string'
    )
      return closeProtocol(socket, 'online_malformed');
    const digestValue = await digest(message.payload.seatToken);
    const room = Array.from(
      this.state.storage.sql.exec(
        'SELECT ruleset, lifecycle, creator_digest, invitee_digest FROM room_metadata WHERE id = 1',
      ),
    )[0];
    const match = Array.from(
      this.state.storage.sql.exec('SELECT opening_player, commitment FROM room_match WHERE id = 1'),
    )[0];
    const authority = Array.from(
      this.state.storage.sql.exec('SELECT sequence, state_json FROM room_authority WHERE id = 1'),
    )[0];
    const seat =
      digestValue === room?.creator_digest
        ? 'creator'
        : digestValue === room?.invitee_digest
          ? 'invitee'
          : null;
    if (!seat) return closeProtocol(socket, 'online_unauthorized_seat');
    socket.serializeAttachment({ seat });
    this.sockets.add(socket);
    socket.addEventListener('close', () => this.sockets.delete(socket));
    socket.send(JSON.stringify(envelope('authenticated', { seat })));
    socket.send(
      JSON.stringify(
        envelope('snapshot', {
          snapshot: {
            ...(authority
              ? projectState(JSON.parse(authority.state_json), authority.sequence)
              : {}),
            ruleset: room.ruleset,
            lifecycle: room.lifecycle,
            openingPlayer: match?.opening_player ?? null,
            commitment: match?.commitment ?? null,
          },
        }),
      ),
    );
  }

  async handleSocketMessage(socket, event) {
    if (!socket.deserializeAttachment()) return this.authenticateSocket(socket, event);
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return closeProtocol(socket, 'online_malformed');
    }
    if (message?.version !== ONLINE_PROTOCOL_VERSION || message?.type !== 'submit_command')
      return closeProtocol(socket, 'online_malformed');
    const result = await this.acceptCommand(socket.deserializeAttachment().seat, message.payload);
    if (result.error)
      return socket.send(
        JSON.stringify(
          envelope('command_rejected', {
            commandId: message.payload?.commandId ?? 'invalid',
            sequence: message.payload?.sequence ?? -1,
            error: result.error,
          }),
        ),
      );
    const snapshot = JSON.stringify(
      envelope('snapshot', { snapshot: projectState(result.state, result.sequence) }),
    );
    for (const peer of this.sockets) peer.send(snapshot);
    socket.send(JSON.stringify(envelope('command_accepted', result.accepted)));
    if (result.state.gameOver) {
      const proof = await this.state.storage.get('terminal-proof');
      const match = Array.from(
        this.state.storage.sql.exec(
          'SELECT commitment, opening_player FROM room_match WHERE id = 1',
        ),
      )[0];
      for (const peer of this.sockets) {
        peer.send(JSON.stringify(envelope('match_terminal', { result: 'complete' })));
        peer.send(
          JSON.stringify(
            envelope('terminal_proof', {
              seed: String(proof.seed),
              salt: proof.salt,
              commitment: match.commitment,
              openingPlayer: match.opening_player,
            }),
          ),
        );
      }
    }
  }

  async acceptCommand(seat, command) {
    return this.state.storage.transaction(async () => {
      const row = Array.from(
        this.state.storage.sql.exec(
          'SELECT sequence, descriptor_json, state_json, commands_json FROM room_authority WHERE id = 1',
        ),
      )[0];
      if (!row) return { error: 'online_room_not_ready' };
      const commands = JSON.parse(row.commands_json);
      const duplicate = commands.find((item) => item.commandId === command?.commandId);
      if (duplicate)
        return { accepted: duplicate, state: JSON.parse(row.state_json), sequence: row.sequence };
      if (!Number.isInteger(command?.sequence) || command.sequence !== row.sequence)
        return { error: 'online_stale_sequence' };
      const state = JSON.parse(row.state_json);
      const player = seat === 'creator' ? 'human' : 'ai';
      if (state.currentPlayer !== player || command.action?.player !== player)
        return { error: 'online_wrong_turn' };
      const descriptor = JSON.parse(row.descriptor_json);
      const transition = applyAction(
        state,
        command.action,
        descriptor.board,
        undefined,
        descriptor,
      );
      if (transition.result.type !== 'applied') return { error: 'online_command_rejected' };
      const accepted = {
        commandId: command.commandId,
        sequence: row.sequence,
        action: command.action,
      };
      commands.push(accepted);
      this.state.storage.sql.exec(
        'UPDATE room_authority SET sequence = ?, state_json = ?, commands_json = ? WHERE id = 1',
        row.sequence + 1,
        JSON.stringify(transition.state),
        JSON.stringify(commands),
      );
      return { accepted, state: transition.state, sequence: row.sequence + 1 };
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health')
      return json({ status: 'ok', onlineProtocol: ONLINE_PROTOCOL_VERSION });
    if (request.method === 'POST' && url.pathname === '/v1/rooms') {
      const input = validateRoomCreateRequest(await request.json());
      if (!input.ok) return json({ error: input.error }, 400);
      const roomCode = createRoomCode();
      const seatToken = createSeatToken();
      const stub = env.ROOM.get(env.ROOM.idFromName(roomCode));
      const setup = await stub.fetch('https://room.internal/setup', {
        method: 'POST',
        body: JSON.stringify({
          roomCode,
          ruleset: input.value.ruleset,
          creatorDigest: await digest(seatToken),
        }),
      });
      if (!setup.ok) return setup;
      return json({ roomCode, seatToken, ruleset: input.value.ruleset }, 201);
    }
    const match = url.pathname.match(/^\/v1\/rooms\/([A-Z2-9]{8})(?:\/(join|socket))?$/);
    if (!match) return new Response('Not found', { status: 404 });
    const stub = env.ROOM.get(env.ROOM.idFromName(match[1]));
    if (!match[2] && request.method === 'GET') return stub.fetch('https://room.internal/inspect');
    if (match[2] && request.method === 'POST') {
      const joined = validateRoomJoinRequest(await request.json());
      if (!joined.ok) return json({ error: joined.error }, 400);
      const seatToken = createSeatToken();
      const response = await stub.fetch('https://room.internal/join', {
        method: 'POST',
        body: JSON.stringify({ inviteeDigest: await digest(seatToken) }),
      });
      if (!response.ok) return response;
      return json({ ...(await response.json()), seatToken }, 201);
    }
    if (match[2] === 'socket' && request.method === 'GET')
      return stub.fetch(new Request('https://room.internal/socket', request));
    return new Response('Not found', { status: 404 });
  },
};

function createRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join('');
}

function createSeatToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function createSecret() {
  return createSeatToken();
}

async function digest(value) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function json(value, status = 200) {
  return Response.json(value, { status });
}

function envelope(type, payload) {
  return { version: ONLINE_PROTOCOL_VERSION, type, payload };
}

function closeProtocol(socket, code) {
  socket.send(JSON.stringify(envelope('protocol_error', { error: code })));
  socket.close(1008, code);
}

function projectState(state, sequence) {
  return {
    sequence,
    humanScore: state.humanScore,
    aiScore: state.aiScore,
    gameOver: state.gameOver,
    currentSeat: state.currentPlayer === 'human' ? 'creator' : 'invitee',
    board: state.board.flatMap((row, rowIndex) =>
      row.map((cell, column) => ({
        row: rowIndex,
        column,
        state: cell.isRevealed ? 'revealed' : cell.isFlagged ? 'flagged' : 'hidden',
        ...(cell.isRevealed ? { neighborMines: cell.neighborMines } : {}),
      })),
    ),
  };
}
