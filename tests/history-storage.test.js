import { describe, expect, it } from 'vitest';
import {
  createHistoryEntry,
  createHistoryStorage,
} from '../src/application/storage/history-storage';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function entry(id) {
  return createHistoryEntry({
    id,
    replay: { descriptor: { seed: id }, actions: [] },
    savedAt: '2026-07-16T00:00:00.000Z',
  });
}

describe('local replay history storage', () => {
  it('saves serializable records, replaces duplicate ids, and evicts oldest records', () => {
    const storage = createHistoryStorage({ storage: createMemoryStorage(), limit: 2 });

    storage.save(entry('one'));
    storage.save(entry('two'));
    const saved = storage.save(entry('one'));

    expect(saved.value.map((item) => item.id)).toEqual(['one', 'two']);
    expect(storage.load().value.map((item) => item.id)).toEqual(['one', 'two']);
  });

  it('degrades safely for corrupt or unavailable browser storage', () => {
    const corrupt = createHistoryStorage({
      storage: { getItem: () => '{bad json', setItem: () => {} },
    });
    const unavailable = createHistoryStorage({
      storage: {
        getItem: () => null,
        setItem: () => {
          throw new Error('quota');
        },
      },
    });

    expect(corrupt.load()).toEqual({ ok: false, error: { code: 'history_storage_corrupt' } });
    expect(unavailable.save(entry('one'))).toEqual({
      ok: false,
      error: { code: 'history_storage_unavailable' },
    });
  });
});
