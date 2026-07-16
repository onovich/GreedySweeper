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
});
