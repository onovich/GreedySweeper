import {
  ONLINE_PROTOCOL_VERSION,
  ONLINE_MESSAGE_MAX_BYTES,
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
const RECONNECT_GRACE_MS = 120_000;
const SETUP_EXPIRY_MS = 600_000;
const INACTIVITY_EXPIRY_MS = 600_000;
const TERMINAL_RETENTION_MS = 3_600_000;
const COMMAND_LIMIT = 30;
const COMMAND_WINDOW_MS = 10_000;
const sourceBuckets = new Map();

export class RoomDurableObject {
  constructor(state) {
    this.state = state;
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
    this.state.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS room_sessions (seat TEXT PRIMARY KEY, session_epoch INTEGER NOT NULL, connected_at INTEGER NOT NULL)',
    );
    this.state.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS room_seats (seat TEXT PRIMARY KEY, session_epoch INTEGER NOT NULL, connected_at INTEGER, reconnect_expires_at INTEGER)',
    );
    this.state.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS room_lifecycle (id INTEGER PRIMARY KEY, state TEXT NOT NULL, next_deadline_at INTEGER, setup_expires_at INTEGER, inactive_expires_at INTEGER, terminal_delete_at INTEGER)',
    );
    this.state.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS room_command_limits (seat TEXT PRIMARY KEY, window_started_at INTEGER NOT NULL, count INTEGER NOT NULL)',
    );
    this.state.storage.sql.exec(
      'INSERT OR IGNORE INTO room_seats (seat, session_epoch, connected_at) SELECT seat, session_epoch, connected_at FROM room_sessions',
    );
    this.state.storage.sql.exec(
      'INSERT OR IGNORE INTO room_lifecycle (id, state) SELECT id, lifecycle FROM room_metadata',
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
    const deadline = Date.now() + SETUP_EXPIRY_MS;
    this.state.storage.sql.exec(
      'INSERT INTO room_lifecycle (id, state, next_deadline_at, setup_expires_at) VALUES (1, ?, ?, ?)',
      'setup',
      deadline,
      deadline,
    );
    await this.state.storage.setAlarm(deadline);
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
    await this.setLifecycleDeadline('active', Date.now() + INACTIVITY_EXPIRY_MS);
    return json({ ruleset: room.ruleset, lifecycle: 'active', openingPlayer, commitment });
  }

  async socket(request) {
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Expected WebSocket', { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async authenticateSocket(socket, data) {
    let message;
    try {
      message = JSON.parse(messageText(data));
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
    const session = await this.state.storage.transaction(async () => {
      this.state.storage.sql.exec(
        'INSERT INTO room_seats (seat, session_epoch, connected_at, reconnect_expires_at) VALUES (?, 1, ?, NULL) ON CONFLICT(seat) DO UPDATE SET session_epoch = session_epoch + 1, connected_at = excluded.connected_at, reconnect_expires_at = NULL',
        seat,
        Date.now(),
      );
      return Array.from(
        this.state.storage.sql.exec('SELECT session_epoch FROM room_seats WHERE seat = ?', seat),
      )[0];
    });
    const attachment = {
      seat,
      sessionEpoch: session.session_epoch,
      protocolVersion: ONLINE_PROTOCOL_VERSION,
    };
    socket.serializeAttachment(attachment);
    for (const peer of this.connectedSockets()) {
      if (peer === socket) continue;
      const peerAttachment = peer.deserializeAttachment();
      if (peerAttachment?.seat === seat) peer.close(1008, 'seat_replaced');
    }
    const resumed = await this.resumeIfReclaimed();
    socket.send(JSON.stringify(envelope('authenticated', { seat })));
    socket.send(
      JSON.stringify(
        envelope('snapshot', {
          snapshot: {
            ...(authority
              ? projectState(JSON.parse(authority.state_json), authority.sequence)
              : {}),
            ruleset: room.ruleset,
            lifecycle: resumed ? 'active' : room.lifecycle,
            openingPlayer: match?.opening_player ?? null,
            commitment: match?.commitment ?? null,
          },
        }),
      ),
    );
    if (resumed) this.broadcast(envelope('match_resumed', {}), socket);
  }

  async webSocketMessage(socket, message) {
    this.initialize();
    return this.handleSocketMessage(socket, message);
  }

  async webSocketClose(socket) {
    const attachment = socket.deserializeAttachment();
    if (!attachment?.seat || !Number.isInteger(attachment.sessionEpoch)) return;
    const paused = await this.state.storage.transaction(async () => {
      const seat = Array.from(
        this.state.storage.sql.exec(
          'SELECT session_epoch FROM room_seats WHERE seat = ?',
          attachment.seat,
        ),
      )[0];
      const room = Array.from(
        this.state.storage.sql.exec('SELECT lifecycle FROM room_metadata WHERE id = 1'),
      )[0];
      if (
        !seat ||
        seat.session_epoch !== attachment.sessionEpoch ||
        !room ||
        !['active', 'paused'].includes(room.lifecycle)
      )
        return false;
      this.state.storage.sql.exec(
        'UPDATE room_seats SET connected_at = NULL, reconnect_expires_at = ? WHERE seat = ?',
        Date.now() + RECONNECT_GRACE_MS,
        attachment.seat,
      );
      this.state.storage.sql.exec("UPDATE room_metadata SET lifecycle = 'paused' WHERE id = 1");
      const reconnect = Array.from(
        this.state.storage.sql.exec(
          'SELECT MIN(reconnect_expires_at) AS next_deadline_at FROM room_seats WHERE reconnect_expires_at IS NOT NULL',
        ),
      )[0];
      const lifecycle = Array.from(
        this.state.storage.sql.exec('SELECT inactive_expires_at FROM room_lifecycle WHERE id = 1'),
      )[0];
      const deadline = earliestDeadline(reconnect.next_deadline_at, lifecycle?.inactive_expires_at);
      this.state.storage.sql.exec(
        'UPDATE room_lifecycle SET state = ?, next_deadline_at = ? WHERE id = 1',
        'paused',
        deadline,
      );
      return room.lifecycle !== 'paused';
    });
    await this.scheduleLifecycleAlarm();
    if (paused) this.broadcast(envelope('match_paused', {}));
  }

  async handleSocketMessage(socket, data) {
    if (!socket.deserializeAttachment()) return this.authenticateSocket(socket, data);
    if (messageBytes(data) > ONLINE_MESSAGE_MAX_BYTES)
      return closeProtocol(socket, 'online_oversize');
    let message;
    try {
      message = JSON.parse(messageText(data));
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
    for (const peer of this.connectedSockets()) peer.send(snapshot);
    socket.send(JSON.stringify(envelope('command_accepted', result.accepted)));
    if (result.state.gameOver) {
      const proof = await this.state.storage.get('terminal-proof');
      const match = Array.from(
        this.state.storage.sql.exec(
          'SELECT commitment, opening_player FROM room_match WHERE id = 1',
        ),
      )[0];
      for (const peer of this.connectedSockets()) {
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
    const result = await this.state.storage.transaction(async () => {
      const room = Array.from(
        this.state.storage.sql.exec('SELECT lifecycle FROM room_metadata WHERE id = 1'),
      )[0];
      if (room?.lifecycle === 'paused') return { error: 'online_match_paused' };
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
      if (!this.consumeCommandRate(seat)) return { error: 'online_rate_limited' };
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
      const deadline =
        Date.now() + (transition.state.gameOver ? TERMINAL_RETENTION_MS : INACTIVITY_EXPIRY_MS);
      this.state.storage.sql.exec(
        'UPDATE room_lifecycle SET state = ?, next_deadline_at = ?, inactive_expires_at = ?, terminal_delete_at = ? WHERE id = 1',
        transition.state.gameOver ? 'terminal' : 'active',
        deadline,
        deadline,
        transition.state.gameOver ? deadline : null,
      );
      if (transition.state.gameOver)
        this.state.storage.sql.exec("UPDATE room_metadata SET lifecycle = 'terminal' WHERE id = 1");
      return { accepted, state: transition.state, sequence: row.sequence + 1 };
    });
    await this.scheduleLifecycleAlarm();
    return result;
  }

  connectedSockets() {
    return this.state.getWebSockets().filter((socket) => socket.deserializeAttachment()?.seat);
  }

  broadcast(message, except = null) {
    const serialized = JSON.stringify(message);
    for (const socket of this.connectedSockets()) {
      if (socket !== except) socket.send(serialized);
    }
  }

  async resumeIfReclaimed() {
    const room = Array.from(
      this.state.storage.sql.exec('SELECT lifecycle FROM room_metadata WHERE id = 1'),
    )[0];
    if (room?.lifecycle !== 'paused' || !this.areBothSeatsConnected()) return false;
    await this.state.storage.transaction(async () => {
      this.state.storage.sql.exec("UPDATE room_metadata SET lifecycle = 'active' WHERE id = 1");
      const deadline = Date.now() + INACTIVITY_EXPIRY_MS;
      this.state.storage.sql.exec(
        'UPDATE room_lifecycle SET state = ?, next_deadline_at = ?, inactive_expires_at = ? WHERE id = 1',
        'active',
        deadline,
        deadline,
      );
    });
    await this.scheduleLifecycleAlarm();
    return true;
  }

  async alarm() {
    this.initialize();
    const outcome = await this.state.storage.transaction(async () => {
      const lifecycle = Array.from(
        this.state.storage.sql.exec(
          'SELECT state, next_deadline_at FROM room_lifecycle WHERE id = 1',
        ),
      )[0];
      if (!lifecycle || lifecycle.next_deadline_at === null) return { deleted: false, next: null };
      if (lifecycle.next_deadline_at > Date.now())
        return { deleted: false, next: lifecycle.next_deadline_at };
      if (['terminal', 'abandoned'].includes(lifecycle.state)) {
        this.state.storage.sql.exec('DELETE FROM room_seats');
        this.state.storage.sql.exec('DELETE FROM room_sessions');
        this.state.storage.sql.exec('DELETE FROM room_authority');
        this.state.storage.sql.exec('DELETE FROM room_match');
        this.state.storage.sql.exec('DELETE FROM room_metadata');
        this.state.storage.sql.exec('DELETE FROM room_lifecycle');
        return { deleted: true, next: null };
      }
      const deletionDeadline = Date.now() + TERMINAL_RETENTION_MS;
      this.state.storage.sql.exec("UPDATE room_metadata SET lifecycle = 'abandoned' WHERE id = 1");
      this.state.storage.sql.exec(
        'UPDATE room_lifecycle SET state = ?, next_deadline_at = ?, terminal_delete_at = ? WHERE id = 1',
        'abandoned',
        deletionDeadline,
        deletionDeadline,
      );
      return { deleted: false, next: deletionDeadline };
    });
    if (outcome.deleted) await this.state.storage.delete('terminal-proof');
    if (outcome.next !== null) await this.state.storage.setAlarm(outcome.next);
  }

  async setLifecycleDeadline(state, deadline) {
    this.state.storage.sql.exec(
      'UPDATE room_lifecycle SET state = ?, next_deadline_at = ?, inactive_expires_at = ? WHERE id = 1',
      state,
      deadline,
      deadline,
    );
    await this.state.storage.setAlarm(deadline);
  }

  async scheduleLifecycleAlarm() {
    const lifecycle = Array.from(
      this.state.storage.sql.exec('SELECT next_deadline_at FROM room_lifecycle WHERE id = 1'),
    )[0];
    if (lifecycle?.next_deadline_at !== null && lifecycle?.next_deadline_at !== undefined)
      await this.state.storage.setAlarm(lifecycle.next_deadline_at);
  }

  areBothSeatsConnected() {
    const activeSockets = new Map(
      this.connectedSockets().map((socket) => {
        const attachment = socket.deserializeAttachment();
        return [attachment.seat, attachment.sessionEpoch];
      }),
    );
    const seats = Array.from(
      this.state.storage.sql.exec('SELECT seat, session_epoch FROM room_seats'),
    );
    return (
      seats.length === 2 &&
      seats.every((seat) => activeSockets.get(seat.seat) === seat.session_epoch)
    );
  }

  consumeCommandRate(seat) {
    const now = Date.now();
    const row = Array.from(
      this.state.storage.sql.exec(
        'SELECT window_started_at, count FROM room_command_limits WHERE seat = ?',
        seat,
      ),
    )[0];
    if (!row || now - row.window_started_at >= COMMAND_WINDOW_MS) {
      this.state.storage.sql.exec(
        'INSERT INTO room_command_limits (seat, window_started_at, count) VALUES (?, ?, 1) ON CONFLICT(seat) DO UPDATE SET window_started_at = excluded.window_started_at, count = excluded.count',
        seat,
        now,
      );
      return true;
    }
    if (row.count >= COMMAND_LIMIT) return false;
    this.state.storage.sql.exec(
      'UPDATE room_command_limits SET count = count + 1 WHERE seat = ?',
      seat,
    );
    return true;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/health')
      return json({ status: 'ok', onlineProtocol: ONLINE_PROTOCOL_VERSION });
    if (request.method === 'POST' && url.pathname === '/v1/rooms') {
      if (env.ONLINE_ENABLED === 'false') return json({ error: { code: 'online_disabled' } }, 503);
      if (!consumeSourceRate(sourceIdentity(request), 'create', 5, 60_000))
        return json({ error: { code: 'online_rate_limited' } }, 429);
      const input = validateRoomCreateRequest(await request.json());
      if (!input.ok) return json({ error: input.error }, 400);
      if (!(await verifyTurnstile(env, input.value.turnstileToken)))
        return json({ error: { code: 'online_turnstile_failed' } }, 403);
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
    if (!match) {
      if (!consumeSourceRate(sourceIdentity(request), 'invalid', 10, 60_000))
        return json({ error: { code: 'online_rate_limited' } }, 429);
      return new Response('Not found', { status: 404 });
    }
    const stub = env.ROOM.get(env.ROOM.idFromName(match[1]));
    if (!match[2] && request.method === 'GET') {
      if (!consumeSourceRate(sourceIdentity(request), 'lookup', 20, 60_000))
        return json({ error: { code: 'online_rate_limited' } }, 429);
      return stub.fetch('https://room.internal/inspect');
    }
    if (match[2] && request.method === 'POST') {
      if (!consumeSourceRate(sourceIdentity(request), 'join', 20, 60_000))
        return json({ error: { code: 'online_rate_limited' } }, 429);
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

function messageText(data) {
  if (typeof data === 'string') return data;
  return new TextDecoder().decode(data);
}

function messageBytes(data) {
  return typeof data === 'string' ? new TextEncoder().encode(data).byteLength : data.byteLength;
}

function sourceIdentity(request) {
  return (
    request.headers.get('x-greedy-sweeper-test-source') ??
    request.headers.get('cf-connecting-ip') ??
    crypto.randomUUID()
  );
}

function consumeSourceRate(source, category, limit, windowMs) {
  const key = `${category}:${source}`;
  const now = Date.now();
  const bucket = sourceBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    sourceBuckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

async function verifyTurnstile(env, token) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (typeof token !== 'string' || token.length === 0) return false;
  const response = await fetch(
    env.TURNSTILE_VERIFY_URL ?? 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ response: token, secret: env.TURNSTILE_SECRET_KEY }),
    },
  );
  if (!response.ok) return false;
  const result = await response.json();
  return result?.success === true;
}

function earliestDeadline(...deadlines) {
  const valid = deadlines.filter((deadline) => Number.isFinite(deadline));
  return valid.length === 0 ? null : Math.min(...valid);
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
