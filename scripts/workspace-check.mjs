import { existsSync, readFileSync } from 'node:fs';

const paths = [
  'apps/web/package.json',
  'apps/room-worker/package.json',
  'packages/game-core/package.json',
  'packages/online-protocol/package.json',
  'packages/game-core/src',
  'apps/room-worker/wrangler.jsonc',
];
for (const path of paths) {
  if (!existsSync(path)) throw new Error(`Missing workspace boundary: ${path}`);
}
const root = JSON.parse(readFileSync('package.json', 'utf8'));
if (
  root.private !== true ||
  JSON.stringify(root.workspaces) !== JSON.stringify(['apps/*', 'packages/*'])
)
  throw new Error('Root package must declare the four private npm workspaces.');
const gameCore = JSON.parse(readFileSync('packages/game-core/package.json', 'utf8'));
const protocol = JSON.parse(readFileSync('packages/online-protocol/package.json', 'utf8'));
if (gameCore.name !== '@greedy-sweeper/game-core' || !gameCore.exports)
  throw new Error('game-core must expose a public package contract.');
if (
  protocol.name !== '@greedy-sweeper/online-protocol' ||
  !protocol.dependencies?.['@greedy-sweeper/game-core']
)
  throw new Error('online-protocol must depend on game-core only through its public contract.');
console.log('workspace check passed: npm workspaces and public package graph hold.');
