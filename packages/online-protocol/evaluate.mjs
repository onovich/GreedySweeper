/* global console */
import { validateClientMessage } from './index.js';
if (
  !validateClientMessage({ version: '1', type: 'pong', payload: { nonce: 'n' } }).ok ||
  validateClientMessage({ version: '1', type: 'unknown' }).ok
)
  throw new Error('protocol fixture failed');
console.log('online protocol: strict version/type/field/size validation PASS');
