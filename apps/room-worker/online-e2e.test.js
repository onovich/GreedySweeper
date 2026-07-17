import { SELF, env, reset, runInDurableObject } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';

const VERSION = '1';

afterEach(async () => reset());

describe('two-client Workers-runtime online e2e', () => {
  for (const ruleset of ['classic-v1', 'greed-v2']) {
    it(`two-client ${ruleset} happy path completes and rejects stale and wrong-seat commands`, async () => {
      const room = await createRoom(ruleset);
      const creator = await connect(room.roomCode, room.creatorToken);
      const invitee = await connect(room.roomCode, room.inviteeToken);
      const creatorSnapshot = await creator.waitFor('snapshot');
      const inviteeSnapshot = await invitee.waitFor('snapshot');
      expect(creatorSnapshot.payload.snapshot.sequence).toBe(0);
      expect(inviteeSnapshot.payload.snapshot.sequence).toBe(0);

      const mines = await roomMineCoordinates(room.roomCode);
      const mineKeys = new Set(mines.map((mine) => `${mine.row}:${mine.column}`));
      const safeOpening = firstSafeCoordinate(mineKeys);
      const firstSeat = creatorSnapshot.payload.snapshot.currentSeat;
      const firstClient = firstSeat === 'creator' ? creator : invitee;
      const otherClient = firstSeat === 'creator' ? invitee : creator;
      const firstPlayer = firstSeat === 'creator' ? 'human' : 'ai';
      firstClient.send('submit_command', {
        commandId: 'first-command',
        sequence: 0,
        action: { type: 'reveal', ...safeOpening, player: firstPlayer },
      });
      await firstClient.waitFor('command_accepted');
      await creator.waitFor('snapshot', (message) => message.payload.snapshot.sequence === 1);
      await invitee.waitFor('snapshot', (message) => message.payload.snapshot.sequence === 1);

      firstClient.send('submit_command', {
        commandId: 'stale-command',
        sequence: 0,
        action: { type: 'flag', row: 0, column: 1, player: firstPlayer },
      });
      await expectRejected(firstClient, 'online_stale_sequence');

      otherClient.send('submit_command', {
        commandId: 'wrong-seat-command',
        sequence: 1,
        action: { type: 'flag', row: 0, column: 1, player: firstPlayer },
      });
      await expectRejected(otherClient, 'online_wrong_turn');

      let sequence = 1;
      for (const mine of mines) {
        const current = await currentSeat(room.roomCode);
        const client = current === 'creator' ? creator : invitee;
        client.send('submit_command', {
          commandId: `finish-${sequence}`,
          sequence,
          action: {
            type: 'flag',
            row: mine.row,
            column: mine.column,
            player: current === 'creator' ? 'human' : 'ai',
          },
        });
        await client.waitFor('command_accepted');
        sequence += 1;
      }

      await creator.waitFor('match_terminal');
      await invitee.waitFor('match_terminal');
      const creatorProof = await creator.waitFor('terminal_proof');
      const inviteeProof = await invitee.waitFor('terminal_proof');
      expect(creatorProof.payload.commitment).toMatch(/^[a-f0-9]{64}$/);
      expect(inviteeProof.payload.commitment).toBe(creatorProof.payload.commitment);
      creator.close();
      invitee.close();
    }, 20_000);
  }
});

async function createRoom(ruleset) {
  const created = await SELF.fetch('https://worker.test/v1/rooms', {
    method: 'POST',
    body: JSON.stringify({ ruleset }),
  });
  expect(created.status).toBe(201);
  const creator = await created.json();
  const joined = await SELF.fetch(`https://worker.test/v1/rooms/${creator.roomCode}/join`, {
    method: 'POST',
    body: JSON.stringify({ rulesetAccepted: true }),
  });
  expect(joined.status).toBe(201);
  const invitee = await joined.json();
  return {
    roomCode: creator.roomCode,
    creatorToken: creator.seatToken,
    inviteeToken: invitee.seatToken,
  };
}

async function connect(roomCode, seatToken) {
  const response = await SELF.fetch(`https://worker.test/v1/rooms/${roomCode}/socket`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(response.status).toBe(101);
  const socket = response.webSocket;
  socket.accept();
  const client = messageClient(socket);
  client.send('authenticate', { seatToken });
  await client.waitFor('authenticated');
  return client;
}

function messageClient(socket) {
  const messages = [];
  const waiters = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    messages.push(message);
    const index = waiters.findIndex(
      (waiter) => waiter.type === message.type && waiter.predicate(message),
    );
    if (index >= 0) waiters.splice(index, 1)[0].resolve(message);
  });
  return {
    send(type, payload) {
      socket.send(JSON.stringify({ version: VERSION, type, payload }));
    },
    close() {
      socket.close();
    },
    waitFor(type, predicate = () => true) {
      const index = messages.findIndex((message) => message.type === type && predicate(message));
      if (index >= 0) return Promise.resolve(messages.splice(index, 1)[0]);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          const waiter = waiters.findIndex((entry) => entry.resolve === resolve);
          if (waiter >= 0) waiters.splice(waiter, 1);
          reject(new Error(`Timed out waiting for ${type}`));
        }, 5_000);
        waiters.push({
          type,
          predicate,
          resolve(message) {
            clearTimeout(timeout);
            resolve(message);
          },
        });
      });
    },
  };
}

async function expectRejected(client, error) {
  const rejected = await client.waitFor('command_rejected');
  expect(rejected.payload.error).toBe(error);
}

async function roomMineCoordinates(roomCode) {
  const stub = env.ROOM.get(env.ROOM.idFromName(roomCode));
  return runInDurableObject(stub, async (_instance, state) => {
    const row = Array.from(
      state.storage.sql.exec('SELECT state_json FROM room_authority WHERE id = 1'),
    )[0];
    return JSON.parse(row.state_json).board.flatMap((cells, rowIndex) =>
      cells
        .map((cell, column) => ({ row: rowIndex, column, mine: cell.isMine }))
        .filter((cell) => cell.mine),
    );
  });
}

async function currentSeat(roomCode) {
  const stub = env.ROOM.get(env.ROOM.idFromName(roomCode));
  return runInDurableObject(stub, async (_instance, state) => {
    const row = Array.from(
      state.storage.sql.exec('SELECT state_json FROM room_authority WHERE id = 1'),
    )[0];
    return JSON.parse(row.state_json).currentPlayer === 'human' ? 'creator' : 'invitee';
  });
}

function firstSafeCoordinate(mineKeys) {
  for (let row = 0; row < 16; row += 1) {
    for (let column = 0; column < 16; column += 1) {
      if (!mineKeys.has(`${row}:${column}`)) return { row, column };
    }
  }
  throw new Error('Expected a safe opening coordinate');
}
