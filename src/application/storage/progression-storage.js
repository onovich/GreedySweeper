import { PROGRESSION_VERSION } from '../../progression/config';
import { createProfile } from '../../progression/profile';
const KEY = 'greedy-sweeper.progression.v1';
export function createProgressionStorage({ storage, key = KEY } = {}) {
  return {
    load() {
      try {
        if (!storage) return fail('progression_storage_unavailable');
        const value = storage.getItem(key);
        if (value == null) return ok(createProfile());
        const parsed = JSON.parse(value);
        return parsed?.progressionVersion === PROGRESSION_VERSION &&
          Array.isArray(parsed.facts) &&
          Array.isArray(parsed.unlocks)
          ? ok({ ...parsed, recordIds: parsed.recordIds ?? parsed.facts.map((fact) => fact.id) })
          : fail('progression_storage_incompatible');
      } catch {
        return fail('progression_storage_corrupt');
      }
    },
    save(profile) {
      try {
        if (!storage) return fail('progression_storage_unavailable');
        storage.setItem(key, JSON.stringify(profile));
        return ok(profile);
      } catch {
        return fail('progression_storage_unavailable');
      }
    },
    reset() {
      try {
        if (!storage) return fail('progression_storage_unavailable');
        storage.removeItem(key);
        return ok(createProfile());
      } catch {
        return fail('progression_storage_unavailable');
      }
    },
  };
}
export function createBrowserProgressionStorage(options) {
  try {
    return createProgressionStorage({ ...options, storage: globalThis.localStorage });
  } catch {
    return createProgressionStorage(options);
  }
}
function ok(value) {
  return { ok: true, value };
}
function fail(code) {
  return { ok: false, error: { code } };
}
