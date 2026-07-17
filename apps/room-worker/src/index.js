import {
  ONLINE_PROTOCOL_VERSION,
  canonicalCommitmentPayload,
  validateRoomCreateRequest,
  validateRoomJoinRequest,
} from '@greedy-sweeper/online-protocol';

const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';

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
    const seed = createSecret();
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
    await this.state.storage.put('terminal-proof', { seed, salt });
    return json({ ruleset: room.ruleset, lifecycle: 'active', openingPlayer, commitment });
  }

  async socket(request) {
    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Expected WebSocket', { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    server.addEventListener('message', (event) => this.authenticateSocket(server, event));
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
    const seat =
      digestValue === room?.creator_digest
        ? 'creator'
        : digestValue === room?.invitee_digest
          ? 'invitee'
          : null;
    if (!seat) return closeProtocol(socket, 'online_unauthorized_seat');
    socket.send(JSON.stringify(envelope('authenticated', { seat })));
    socket.send(
      JSON.stringify(
        envelope('snapshot', {
          snapshot: {
            ruleset: room.ruleset,
            lifecycle: room.lifecycle,
            openingPlayer: match?.opening_player ?? null,
            commitment: match?.commitment ?? null,
            board: [],
          },
        }),
      ),
    );
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
