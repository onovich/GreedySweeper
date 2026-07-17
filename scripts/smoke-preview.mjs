import WebSocket from 'ws';

const PREVIEW_ENDPOINT = requiredPreviewEndpoint(process.env.PREVIEW_ENDPOINT);
const PROTOCOL_VERSION = '1';
const REQUEST_TIMEOUT_MS = 20_000;
const MESSAGE_TIMEOUT_MS = 20_000;
const MAX_COMMANDS = 256;

try {
  await verifyHealth();
  for (const ruleset of ['classic-v1', 'greed-v2']) await completeRoom(ruleset);
  console.log(
    'Preview smoke PASS: HTTPS health and two-client WSS Classic/Greed completion verified.',
  );
} catch (error) {
  const reason = error instanceof Error ? error.message : 'unknown error';
  console.error(`Preview smoke failed: ${reason}`);
  process.exitCode = 1;
}

function requiredPreviewEndpoint(value) {
  if (!value) throw new Error('Missing Preview endpoint');
  const endpoint = new URL(value);
  if (
    endpoint.protocol !== 'https:' ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash
  ) {
    throw new Error('Preview endpoint must be a clean HTTPS origin');
  }
  return endpoint;
}

async function verifyHealth() {
  const response = await fetch(new URL('/health', PREVIEW_ENDPOINT), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error('Preview health request failed');
  const health = await response.json();
  if (health?.status !== 'ok' || health?.onlineProtocol !== PROTOCOL_VERSION)
    throw new Error('Preview health payload invalid');
}

async function completeRoom(ruleset) {
  const room = await createRoom(ruleset);
  const creator = await connectClient(room.roomCode, room.creatorToken);
  const invitee = await connectClient(room.roomCode, room.inviteeToken);

  try {
    let snapshot = creator.snapshot;
    for (let count = 0; !snapshot.gameOver; count += 1) {
      if (count >= MAX_COMMANDS) throw new Error('Room did not complete');
      const target = snapshot.board.find((cell) => cell.state === 'hidden');
      if (!target) throw new Error('Room has no legal reveal');
      const client = snapshot.currentSeat === 'creator' ? creator.client : invitee.client;
      const commandId = crypto.randomUUID();
      const expectedSequence = snapshot.sequence;
      client.send('submit_command', {
        commandId,
        sequence: expectedSequence,
        action: {
          type: 'reveal',
          row: target.row,
          column: target.column,
          player: snapshot.currentSeat === 'creator' ? 'human' : 'ai',
        },
      });
      await client.waitFor(
        'command_accepted',
        (message) => message.payload.commandId === commandId,
      );
      snapshot = (
        await client.waitFor(
          'snapshot',
          (message) => message.payload.snapshot.sequence === expectedSequence + 1,
        )
      ).payload.snapshot;
    }

    await Promise.all([
      creator.client.waitFor('match_terminal'),
      invitee.client.waitFor('match_terminal'),
    ]);
    const proofs = await Promise.all([
      creator.client.waitFor('terminal_proof'),
      invitee.client.waitFor('terminal_proof'),
    ]);
    if (
      !proofs.every(
        (message) =>
          typeof message.payload.seed === 'string' &&
          typeof message.payload.salt === 'string' &&
          /^[a-f0-9]{64}$/.test(message.payload.commitment),
      ) ||
      proofs[0].payload.commitment !== proofs[1].payload.commitment
    ) {
      throw new Error('Terminal proof invalid');
    }
  } finally {
    creator.client.close();
    invitee.client.close();
  }
}

async function createRoom(ruleset) {
  const created = await fetch(new URL('/v1/rooms', PREVIEW_ENDPOINT), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ruleset }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (created.status !== 201) throw new Error('Room creation failed');
  const creator = await created.json();
  const joined = await fetch(new URL(`/v1/rooms/${creator.roomCode}/join`, PREVIEW_ENDPOINT), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rulesetAccepted: true }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (joined.status !== 201) throw new Error('Room join failed');
  const invitee = await joined.json();
  if (
    typeof creator.roomCode !== 'string' ||
    typeof creator.seatToken !== 'string' ||
    typeof invitee.seatToken !== 'string'
  ) {
    throw new Error('Room credentials invalid');
  }
  return {
    roomCode: creator.roomCode,
    creatorToken: creator.seatToken,
    inviteeToken: invitee.seatToken,
  };
}

async function connectClient(roomCode, seatToken) {
  const socketUrl = new URL(`/v1/rooms/${roomCode}/socket`, PREVIEW_ENDPOINT);
  socketUrl.protocol = 'wss:';
  const client = new SocketClient(socketUrl);
  await client.open();
  client.send('authenticate', { seatToken });
  await client.waitFor('authenticated');
  const snapshot = (await client.waitFor('snapshot')).payload.snapshot;
  return { client, snapshot };
}

class SocketClient {
  constructor(url) {
    this.socket = new WebSocket(url, { handshakeTimeout: REQUEST_TIMEOUT_MS });
    this.messages = [];
    this.waiters = [];
    this.closed = false;
    this.socket.on('message', (data) => this.receive(data));
    this.socket.on('error', () => this.fail('WebSocket error'));
    this.socket.on('close', () => {
      if (!this.closed) this.fail('WebSocket closed');
    });
  }

  open() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('WebSocket open timed out')),
        MESSAGE_TIMEOUT_MS,
      );
      this.socket.once('open', () => {
        clearTimeout(timeout);
        resolve();
      });
      this.socket.once('error', () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket open failed'));
      });
    });
  }

  send(type, payload) {
    this.socket.send(JSON.stringify({ version: PROTOCOL_VERSION, type, payload }));
  }

  waitFor(type, predicate = () => true) {
    const index = this.messages.findIndex((message) => message.type === type && predicate(message));
    if (index >= 0) return Promise.resolve(this.messages.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.waiters = this.waiters.filter((waiter) => waiter.resolve !== resolve);
        reject(new Error('WebSocket message timed out'));
      }, MESSAGE_TIMEOUT_MS);
      this.waiters.push({ type, predicate, resolve, reject, timeout });
    });
  }

  close() {
    this.closed = true;
    this.socket.close();
  }

  receive(data) {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch {
      this.fail('WebSocket message malformed');
      return;
    }
    this.messages.push(message);
    const index = this.waiters.findIndex(
      (waiter) => waiter.type === message.type && waiter.predicate(message),
    );
    if (index >= 0) {
      const [waiter] = this.waiters.splice(index, 1);
      clearTimeout(waiter.timeout);
      waiter.resolve(message);
    }
  }

  fail(reason) {
    for (const waiter of this.waiters.splice(0)) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error(reason));
    }
  }
}
