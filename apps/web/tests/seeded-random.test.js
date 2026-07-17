import { describe, expect, it } from 'vitest';
import { createSeededRandom, normalizeSeed, serializeSeed } from '../src/game/random/seeded-random';

describe('seeded random', () => {
  it('normalizes only canonical unsigned 32-bit seed values', () => {
    expect(normalizeSeed(0)).toBe(0);
    expect(normalizeSeed('4294967295')).toBe(4294967295);
    expect(normalizeSeed('0042')).toBeNull();
    expect(normalizeSeed(-1)).toBeNull();
    expect(serializeSeed(42)).toBe('42');
  });

  it('matches a fixed Mulberry32 vector across repeated runs', () => {
    const first = createSeededRandom(123456789);
    const second = createSeededRandom('123456789');
    const vector = Array.from({ length: 5 }, () => first());

    expect(vector).toEqual([
      0.2577907438389957, 0.9707721115555614, 0.7853280142880976, 0.20616457983851433,
      0.30307188746519387,
    ]);
    expect(Array.from({ length: 5 }, () => second())).toEqual(vector);
  });
});
