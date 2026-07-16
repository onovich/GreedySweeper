import { existsSync } from 'node:fs';
for (const path of ['apps/room-worker', 'packages/online-protocol', 'src/game'])
  if (!existsSync(path)) throw new Error(`Missing workspace boundary: ${path}`);
console.log('workspace foundation PASS');
