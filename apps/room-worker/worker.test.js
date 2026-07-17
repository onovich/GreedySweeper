import { SELF, env, evictDurableObject, reset, runInDurableObject } from 'cloudflare:test';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(async () => reset());

describe('room worker foundation', () => {
  it('serves health without exposing a room or WebSocket path', async () => {
    const response = await SELF.fetch('https://worker.test/health');
    expect(await response.json()).toEqual({ status: 'ok', onlineProtocol: '1' });
    expect((await SELF.fetch('https://worker.test/rooms')).status).toBe(404);
  });

  it('initializes SQLite storage and retains it after official runtime eviction', async () => {
    const stub = env.ROOM.get(env.ROOM.idFromName('foundation-eviction'));
    const first = await stub.fetch('https://room.test/foundation');
    expect(await first.json()).toEqual({ status: 'foundation', storage: 'sqlite' });

    await evictDurableObject(stub);

    const reloaded = await stub.fetch('https://room.test/foundation');
    expect(await reloaded.json()).toEqual({ status: 'foundation', storage: 'sqlite' });
  });

  it('creates, inspects, and accepts one private-room invitee without exposing a token in lookup', async () => {
    const created = await SELF.fetch('https://worker.test/v1/rooms', {
      method: 'POST',
      body: JSON.stringify({ ruleset: 'classic-v1' }),
    });
    expect(created.status).toBe(201);
    const room = await created.json();
    expect(room.roomCode).toMatch(/^[A-Z2-9]{8}$/);
    expect(room.seatToken).toHaveLength(43);

    const inspected = await SELF.fetch(`https://worker.test/v1/rooms/${room.roomCode}`);
    expect(await inspected.json()).toEqual({
      roomCode: room.roomCode,
      ruleset: 'classic-v1',
      lifecycle: 'setup',
    });

    const joined = await SELF.fetch(`https://worker.test/v1/rooms/${room.roomCode}/join`, {
      method: 'POST',
      body: JSON.stringify({ rulesetAccepted: true }),
    });
    expect(joined.status).toBe(201);
    const invitee = await joined.json();
    expect(invitee.seatToken).toHaveLength(43);
    expect(invitee.commitment).toMatch(/^[a-f0-9]{64}$/);
    expect(['creator', 'invitee']).toContain(invitee.openingPlayer);

    const active = await SELF.fetch(`https://worker.test/v1/rooms/${room.roomCode}`);
    expect(await active.json()).toEqual({
      roomCode: room.roomCode,
      ruleset: 'classic-v1',
      lifecycle: 'active',
      openingPlayer: invitee.openingPlayer,
      commitment: invitee.commitment,
    });
  });

  it('persists an accepted command once and rejects its stale retry without a second transition', async () => {
    const created = await SELF.fetch('https://worker.test/v1/rooms', {
      method: 'POST',
      body: JSON.stringify({ ruleset: 'classic-v1' }),
    });
    const room = await created.json();
    await SELF.fetch(`https://worker.test/v1/rooms/${room.roomCode}/join`, {
      method: 'POST',
      body: JSON.stringify({ rulesetAccepted: true }),
    });
    const stub = env.ROOM.get(env.ROOM.idFromName(room.roomCode));
    const outcome = await runInDurableObject(stub, async (instance, state) => {
      const row = Array.from(
        state.storage.sql.exec('SELECT state_json FROM room_authority WHERE id = 1'),
      )[0];
      const gameState = JSON.parse(row.state_json);
      const seat = gameState.currentPlayer === 'human' ? 'creator' : 'invitee';
      const player = gameState.currentPlayer;
      const first = await instance.acceptCommand(seat, {
        commandId: 'command-1',
        sequence: 0,
        action: { type: 'reveal', row: 0, column: 0, player },
      });
      const duplicate = await instance.acceptCommand(seat, {
        commandId: 'command-1',
        sequence: 0,
        action: { type: 'reveal', row: 0, column: 0, player },
      });
      const stale = await instance.acceptCommand(seat, {
        commandId: 'command-2',
        sequence: 0,
        action: { type: 'reveal', row: 0, column: 1, player },
      });
      return { first, duplicate, stale };
    });
    expect(outcome.first.accepted.commandId).toBe('command-1');
    expect(outcome.duplicate.accepted.commandId).toBe('command-1');
    expect(outcome.stale).toEqual({ error: 'online_stale_sequence' });
  });
});
