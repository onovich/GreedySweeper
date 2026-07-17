/* global console */
import {
  ONLINE_ERROR_CODES,
  validatePublicBoardProjection,
  validateClientMessage,
  validatePublicSnapshot,
  validateServerMessage,
} from './index.js';

const action = { type: 'reveal', row: 0, column: 0, player: 'human' };
const fixtures = [
  validateClientMessage({ version: '1', type: 'authenticate', payload: { seatToken: 'seat' } }).ok,
  validateClientMessage({
    version: '1',
    type: 'submit_command',
    payload: { commandId: 'c1', sequence: 0, action },
  }).ok,
  validateClientMessage({ version: '1', type: 'pong', payload: { nonce: 'n' } }).ok,
  validateServerMessage({ version: '1', type: 'snapshot', payload: { snapshot: { board: [] } } })
    .ok,
  !validateClientMessage({ version: '1', type: 'unknown', payload: {} }).ok,
  !validateClientMessage({ version: '1', type: 'pong', payload: { nonce: 'n', extra: true } }).ok,
  !validateClientMessage({ version: '2', type: 'pong', payload: { nonce: 'n' } }).ok,
  !validateClientMessage({
    version: '1',
    type: 'submit_command',
    payload: { commandId: 'c1', sequence: -1, action },
  }).ok,
  !validateClientMessage({
    version: '1',
    type: 'submit_command',
    payload: { commandId: 'c1', sequence: 0, action: {} },
  }).ok,
  validatePublicSnapshot({ board: [{ isRevealed: false }] }).ok,
  validatePublicSnapshot({ board: [{ isMine: true }] }).error?.code ===
    ONLINE_ERROR_CODES.hiddenState,
  validatePublicBoardProjection({ cells: [{ row: 0, column: 0, state: 'hidden' }] }).ok,
  !validatePublicBoardProjection({
    cells: [{ row: 0, column: 0, state: 'hidden', neighborMines: 1 }],
  }).ok,
  !validateClientMessage({ version: '1', type: 'pong', payload: { nonce: 'x'.repeat(17000) } }).ok,
];
if (fixtures.some((passed) => !passed)) throw new Error('protocol fixture failed');
console.log('online protocol: versioned strict contracts and adversarial fixtures PASS');
