import { SELF, env, evictDurableObject, reset } from 'cloudflare:test';
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
});
