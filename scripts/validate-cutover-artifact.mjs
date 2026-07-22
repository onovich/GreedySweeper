import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const directory = process.argv[2] ?? 'apps/web/dist';
const expectedBase = process.argv[3] ?? '/';
const expectedEndpoint = process.env.VITE_ONLINE_ENDPOINT ?? '';
const html = readFileSync(join(directory, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"?]+(?:\.js|\.css))"/g)].map(
  (match) => match[1],
);

if (!html.includes('id="root"')) throw new Error('Cutover artifact has no application root');
if (!assets.length || assets.some((asset) => !asset.startsWith(expectedBase)))
  throw new Error('Cutover artifact asset base does not match the requested host path');
if (expectedBase === '/' && html.includes('/GreedySweeper/'))
  throw new Error('Root-path artifact retains a GitHub Pages subpath');
const assetFiles = readdirSync(join(directory, 'assets'));
if (
  !assetFiles.some((file) => file.endsWith('.js')) ||
  !assetFiles.some((file) => file.endsWith('.css'))
)
  throw new Error('Cutover artifact is incomplete');
const bundle = assetFiles
  .filter((file) => file.endsWith('.js'))
  .map((file) => readFileSync(join(directory, 'assets', file), 'utf8'))
  .join('\n');
if (!bundle.includes('LUNAR SYSTEM 1986'))
  throw new Error('Cutover artifact lacks the Lunar Console');
if (expectedEndpoint && !bundle.includes(expectedEndpoint))
  throw new Error('Cutover artifact lacks the approved public Worker endpoint');
console.log(
  `cutover artifact PASS: ${expectedBase} build has root, assets, Lunar Console, and endpoint.`,
);
