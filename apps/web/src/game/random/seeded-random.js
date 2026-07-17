const UINT32_MAX = 0xffffffff;

export function normalizeSeed(seed) {
  if (typeof seed === 'number' && Number.isInteger(seed) && seed >= 0 && seed <= UINT32_MAX) {
    return seed >>> 0;
  }

  if (typeof seed === 'string' && /^(0|[1-9]\d{0,9})$/.test(seed)) {
    const parsed = Number(seed);
    if (Number.isSafeInteger(parsed) && parsed <= UINT32_MAX) return parsed >>> 0;
  }

  return null;
}

export function serializeSeed(seed) {
  const normalized = normalizeSeed(seed);
  if (normalized === null) throw new TypeError('Seed must be an unsigned 32-bit integer.');
  return String(normalized);
}

export function createSeededRandom(seed) {
  let state = normalizeSeed(seed);
  if (state === null) throw new TypeError('Seed must be an unsigned 32-bit integer.');

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
