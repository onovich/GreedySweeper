import {
  CHALLENGE_ERROR_CODES,
  createChallengeDescriptor,
  createProtocolError,
  createProtocolSuccess,
  validateChallengeDescriptor,
} from './contracts';

const CODE_PREFIX = 'GS1';
const BASE64_URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function encodeChallengeCode(descriptor) {
  const validation = validateChallengeDescriptor(descriptor);
  if (!validation.ok) return validation;

  const payload = JSON.stringify(toCompactTuple(validation.value));
  const encoded = encodeAsciiBase64Url(payload);
  return createProtocolSuccess(`${CODE_PREFIX}.${encoded}.${checksum(payload)}`);
}

export function decodeChallengeCode(code) {
  if (typeof code !== 'string') {
    return createProtocolError(CHALLENGE_ERROR_CODES.invalidCode, 'Challenge code must be text.');
  }

  const [prefix, encoded, suppliedChecksum, ...rest] = code.trim().split('.');
  if (prefix !== CODE_PREFIX || !encoded || !suppliedChecksum || rest.length > 0) {
    return createProtocolError(
      CHALLENGE_ERROR_CODES.invalidCode,
      'Challenge code format is invalid.',
    );
  }

  const payload = decodeAsciiBase64Url(encoded);
  if (payload === null) {
    return createProtocolError(
      CHALLENGE_ERROR_CODES.invalidCode,
      'Challenge code payload is invalid.',
    );
  }
  if (checksum(payload) !== suppliedChecksum) {
    return createProtocolError(
      CHALLENGE_ERROR_CODES.checksumMismatch,
      'Challenge code checksum does not match.',
    );
  }

  try {
    const tuple = JSON.parse(payload);
    if (!Array.isArray(tuple) || tuple.length !== 7) {
      return createProtocolError(
        CHALLENGE_ERROR_CODES.invalidCode,
        'Challenge code data is invalid.',
      );
    }
    return validateChallengeDescriptor(fromCompactTuple(tuple));
  } catch {
    return createProtocolError(
      CHALLENGE_ERROR_CODES.invalidCode,
      'Challenge code JSON is invalid.',
    );
  }
}

function toCompactTuple(descriptor) {
  return [
    descriptor.rulesVersion,
    descriptor.challengeVersion,
    descriptor.board.rows,
    descriptor.board.columns,
    descriptor.board.totalMines,
    descriptor.seed,
    descriptor.mode,
  ];
}

function fromCompactTuple([rulesVersion, challengeVersion, rows, columns, totalMines, seed, mode]) {
  return createChallengeDescriptor({
    rulesVersion,
    challengeVersion,
    board: { rows, columns, totalMines },
    seed,
    mode,
  });
}

function checksum(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function encodeAsciiBase64Url(text) {
  let encoded = '';
  for (let index = 0; index < text.length; index += 3) {
    const first = text.charCodeAt(index);
    const second = text.charCodeAt(index + 1);
    const third = text.charCodeAt(index + 2);
    encoded += BASE64_URL_ALPHABET[first >>> 2];
    encoded += BASE64_URL_ALPHABET[((first & 0b11) << 4) | (second >>> 4)];
    if (!Number.isNaN(second))
      encoded += BASE64_URL_ALPHABET[((second & 0b1111) << 2) | (third >>> 6)];
    if (!Number.isNaN(third)) encoded += BASE64_URL_ALPHABET[third & 0b111111];
  }
  return encoded;
}

function decodeAsciiBase64Url(encoded) {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  let text = '';
  for (let index = 0; index < encoded.length; index += 4) {
    const first = BASE64_URL_ALPHABET.indexOf(encoded[index]);
    const second = BASE64_URL_ALPHABET.indexOf(encoded[index + 1]);
    const third = BASE64_URL_ALPHABET.indexOf(encoded[index + 2]);
    const fourth = BASE64_URL_ALPHABET.indexOf(encoded[index + 3]);
    if (
      first < 0 ||
      second < 0 ||
      (index + 2 < encoded.length && third < 0) ||
      (index + 3 < encoded.length && fourth < 0)
    ) {
      return null;
    }
    text += String.fromCharCode((first << 2) | (second >>> 4));
    if (index + 2 < encoded.length)
      text += String.fromCharCode(((second & 0b1111) << 4) | (third >>> 2));
    if (index + 3 < encoded.length) text += String.fromCharCode(((third & 0b11) << 6) | fourth);
  }
  return text;
}
