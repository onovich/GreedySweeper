import { describe, expect, it } from 'vitest';
import { CHALLENGE_ERROR_CODES, createChallengeDescriptor } from '../src/game/challenge/contracts';
import { decodeChallengeCode, encodeChallengeCode } from '../src/game/challenge/code';

describe('challenge code', () => {
  const descriptor = createChallengeDescriptor({
    seed: 1234,
    board: { rows: 6, columns: 5, totalMines: 4 },
  });

  it('round-trips a compact, deterministic challenge code', () => {
    const first = encodeChallengeCode(descriptor);
    const second = encodeChallengeCode(descriptor);

    expect(first.ok).toBe(true);
    expect(first.value).toBe(second.value);
    expect(decodeChallengeCode(first.value)).toEqual({ ok: true, value: descriptor });
  });

  it('returns structured failures for malformed and tampered codes', () => {
    const code = encodeChallengeCode(descriptor).value;
    const tampered = `${code.slice(0, -1)}0`;

    expect(decodeChallengeCode('not-a-code')).toMatchObject({
      ok: false,
      error: { code: CHALLENGE_ERROR_CODES.invalidCode },
    });
    expect(decodeChallengeCode(tampered)).toMatchObject({
      ok: false,
      error: { code: CHALLENGE_ERROR_CODES.checksumMismatch },
    });
  });
});
