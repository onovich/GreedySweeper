import { describe, expect, it } from 'vitest';
import { createProgressionStorage } from '../src/application/storage/progression-storage';
describe('progression storage', () => {
  it('degrades safely for corrupt storage', () => {
    const storage = { getItem: () => '{bad', setItem() {}, removeItem() {} };
    expect(createProgressionStorage({ storage }).load()).toEqual({
      ok: false,
      error: { code: 'progression_storage_corrupt' },
    });
  });
  it('migrates a legacy profile shape and isolates reset', () => {
    let value = JSON.stringify({ progressionVersion: '1', baseline: {}, facts: [], unlocks: [] });
    const storage = {
      getItem: () => value,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        value = null;
      },
    };
    const adapter = createProgressionStorage({ storage });
    expect(adapter.load().value.recordIds).toEqual([]);
    expect(adapter.save({})).toEqual({
      ok: false,
      error: { code: 'progression_storage_unavailable' },
    });
    expect(adapter.reset().ok).toBe(true);
  });
});
