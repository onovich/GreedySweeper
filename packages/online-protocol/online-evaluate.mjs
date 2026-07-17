/* global console */
import {
  ONLINE_RULESETS,
  validateClientMessage,
  validateRoomCreateRequest,
  validateRoomInspectResponse,
  validateRoomJoinRequest,
} from './index.js';

const fixtures = [
  validateRoomCreateRequest({ ruleset: ONLINE_RULESETS.classic }).ok,
  validateRoomCreateRequest({ ruleset: ONLINE_RULESETS.greed }).ok,
  !validateRoomCreateRequest({ ruleset: 'classic-v2' }).ok,
  validateRoomInspectResponse({
    roomCode: 'ABCDEFGH',
    ruleset: ONLINE_RULESETS.greed,
    lifecycle: 'setup',
  }).ok,
  !validateRoomInspectResponse({
    roomCode: 'ABC',
    ruleset: ONLINE_RULESETS.greed,
    lifecycle: 'setup',
  }).ok,
  validateRoomJoinRequest({ rulesetAccepted: true }).ok,
  !validateRoomJoinRequest({ rulesetAccepted: false }).ok,
  validateClientMessage({ version: '1', type: 'authenticate', payload: { seatToken: 'seat' } }).ok,
];
if (fixtures.some((passed) => !passed)) throw new Error('online protocol fixture failed');
console.log('online: room setup, acceptance, and authenticated-command contracts PASS');
