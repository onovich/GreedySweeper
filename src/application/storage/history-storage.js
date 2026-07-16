const HISTORY_VERSION = '1';
const DEFAULT_LIMIT = 20;
const DEFAULT_KEY = 'greedy-sweeper.replay-history.v1';

export function createHistoryStorage({ storage, key = DEFAULT_KEY, limit = DEFAULT_LIMIT } = {}) {
  return {
    load() {
      if (!storage || !Number.isInteger(limit) || limit < 1) {
        return failure('history_storage_unavailable');
      }

      try {
        const raw = storage.getItem(key);
        if (raw == null) return success([]);

        const parsed = JSON.parse(raw);
        if (!isHistoryEnvelope(parsed)) return failure('history_storage_corrupt');
        return success(parsed.entries.slice(0, limit));
      } catch {
        return failure('history_storage_corrupt');
      }
    },

    save(entry) {
      if (!storage || !isHistoryEntry(entry) || !Number.isInteger(limit) || limit < 1) {
        return failure('history_storage_unavailable');
      }

      const current = this.load();
      const entries = current.ok ? current.value : [];
      const nextEntries = [entry, ...entries.filter((item) => item.id !== entry.id)].slice(
        0,
        limit,
      );

      try {
        storage.setItem(key, JSON.stringify({ version: HISTORY_VERSION, entries: nextEntries }));
        return success(nextEntries);
      } catch {
        return failure('history_storage_unavailable');
      }
    },
  };
}

export function createHistoryEntry({ id, replay, savedAt }) {
  return { id, replay, savedAt };
}

function isHistoryEnvelope(value) {
  return Boolean(
    value &&
    value.version === HISTORY_VERSION &&
    Array.isArray(value.entries) &&
    value.entries.every(isHistoryEntry),
  );
}

function isHistoryEntry(value) {
  return Boolean(
    value &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    value.replay &&
    typeof value.replay === 'object' &&
    typeof value.savedAt === 'string',
  );
}

function success(value) {
  return { ok: true, value };
}

function failure(code) {
  return { ok: false, error: { code } };
}
