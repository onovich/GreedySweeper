import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const gameRoot = join(root, 'packages', 'game-core', 'src');
const protocolRoot = join(root, 'packages', 'online-protocol');
const workerRoot = join(root, 'apps', 'room-worker');
const onlineApplicationRoot = join(root, 'apps', 'web', 'src', 'application', 'online');
const webSourceRoot = join(root, 'apps', 'web', 'src');
const applicationRoot = join(webSourceRoot, 'application');
const requiredBoundaries = [
  'apps/web/src/app',
  'apps/web/src/application',
  'apps/web/src/progression',
  'apps/web/src/ui',
  'packages/game-core/src',
  'packages/online-protocol',
  'apps/room-worker/src',
];
const sharedForbidden = [
  { pattern: /from\s+['"]react(?:\/[^'"]*)?['"]/, description: 'React import' },
  {
    pattern:
      /\b(document|window|localStorage|sessionStorage|setTimeout|setInterval|fetch|WebSocket)\b/,
    description: 'browser, timer, or network API',
  },
  { pattern: /from\s+['"](?:cloudflare:|wrangler)/, description: 'Cloudflare platform import' },
  { pattern: /from\s+['"][^'"]*(?:apps\/web|\/ui\/)/, description: 'web or UI import' },
];
const applicationForbidden = [
  { pattern: /from\s+['"][^'"]*\/ui(?:\/[^'"]*)?['"]/, description: 'UI import' },
  {
    pattern: /\b(localStorage|sessionStorage)\b/,
    description: 'browser storage API outside adapter',
  },
];

function filesBelow(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(entryPath) : [entryPath];
  });
}

function inspectFiles(directory, rules, violations) {
  for (const filePath of filesBelow(directory).filter((file) => /\.(js|jsx)$/.test(file))) {
    const source = readFileSync(filePath, 'utf8');
    for (const rule of rules) {
      if (rule.pattern.test(source))
        violations.push(`${relative(root, filePath)} contains forbidden ${rule.description}.`);
    }
  }
}

const violations = [];
for (const boundary of requiredBoundaries) {
  if (!existsSync(join(root, boundary)))
    violations.push(`Missing required architecture boundary: ${boundary}.`);
}

inspectFiles(gameRoot, sharedForbidden, violations);
inspectFiles(protocolRoot, sharedForbidden, violations);
for (const filePath of filesBelow(protocolRoot).filter((file) => /\.js$/.test(file))) {
  const source = readFileSync(filePath, 'utf8');
  if (/from\s+['"][^'"]*(?:engine\/transition|engine\/rules|replay\/replay-engine)/.test(source))
    violations.push(
      `${relative(root, filePath)} executes game rules instead of using the public action validator.`,
    );
}
for (const filePath of filesBelow(workerRoot).filter((file) => /\.js$/.test(file))) {
  const source = readFileSync(filePath, 'utf8');
  if (
    /from\s+['"][^'"]*(?:apps\/web|packages\/game-core\/src|packages\/online-protocol\/)/.test(
      source,
    )
  )
    violations.push(`${relative(root, filePath)} imports an application or package internal path.`);
  if (/\b(createBoard|replayGame)\b/.test(source))
    violations.push(`${relative(root, filePath)} contains copied game authority semantics.`);
  if (/console\.(?:log|info|debug)\([^\n]*(?:seatToken|tokenDigest|seed|salt)/.test(source))
    violations.push(`${relative(root, filePath)} may log an online secret.`);
}
for (const filePath of filesBelow(onlineApplicationRoot).filter((file) =>
  /\.(js|jsx)$/.test(file),
)) {
  const source = readFileSync(filePath, 'utf8');
  if (/useGameController/.test(source))
    violations.push(`${relative(root, filePath)} couples the online controller to local gameplay.`);
  if (/\b(localStorage|createBrowserProgressionStorage|createBrowserHistoryStorage)\b/.test(source))
    violations.push(
      `${relative(root, filePath)} persists online session data outside session storage.`,
    );
  if (/\b(applyAction|createInitialState|createGreedInitialState)\b/.test(source))
    violations.push(
      `${relative(root, filePath)} optimistically executes canonical online gameplay.`,
    );
}
for (const filePath of filesBelow(webSourceRoot).filter((file) => /\.(js|jsx)$/.test(file))) {
  const source = readFileSync(filePath, 'utf8');
  if (/from\s+['"](?:\.\.\/|\.\/)*game\//.test(source))
    violations.push(`${relative(root, filePath)} bypasses the game-core public package export.`);
}
for (const filePath of filesBelow(applicationRoot).filter((file) => /\.(js|jsx)$/.test(file))) {
  if (relative(applicationRoot, filePath).startsWith('storage')) continue;
  if (relative(applicationRoot, filePath).startsWith('online')) continue;
  const source = readFileSync(filePath, 'utf8');
  for (const rule of applicationForbidden) {
    if (rule.pattern.test(source))
      violations.push(`${relative(root, filePath)} contains forbidden ${rule.description}.`);
  }
}

if (violations.length > 0) {
  console.error('Architecture check failed:\n' + violations.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log(
  'Architecture check passed: package direction, pure shared code, and game-core ownership hold.',
);
