import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const gameRoot = join(root, 'apps', 'web', 'src', 'game');
const applicationRoot = join(root, 'apps', 'web', 'src', 'application');
const requiredBoundaries = [
  'apps/web/src/app/App.jsx',
  'apps/web/src/application',
  'apps/web/src/game/config',
  'apps/web/src/game/model',
  'apps/web/src/game/engine',
  'apps/web/src/game/ai',
  'apps/web/src/game/challenge',
  'apps/web/src/game/random',
  'apps/web/src/game/replay',
  'apps/web/src/application/storage',
  'apps/web/src/game/selectors',
  'apps/web/src/ui/components',
  'apps/web/src/ui/screens',
  'packages/game-core',
  'packages/online-protocol',
  'apps/room-worker',
];
const forbiddenPatterns = [
  { pattern: /from\s+['"]react(?:\/[^'"]*)?['"]/, description: 'React import' },
  { pattern: /from\s+['"][^'"]*\/ui(?:\/[^'"]*)?['"]/, description: 'UI import' },
  { pattern: /\b(document|window|setTimeout|setInterval)\b/, description: 'browser or timer API' },
];
const applicationForbiddenPatterns = [
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

const violations = [];
for (const boundary of requiredBoundaries) {
  if (!existsSync(join(root, boundary))) {
    violations.push(`Missing required architecture boundary: ${boundary}.`);
  }
}
for (const filePath of filesBelow(gameRoot).filter((file) => /\.(js|jsx)$/.test(file))) {
  const source = readFileSync(filePath, 'utf8');
  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(source)) {
      violations.push(`${relative(root, filePath)} contains forbidden ${rule.description}.`);
    }
  }
}
for (const filePath of filesBelow(applicationRoot).filter((file) => /\.(js|jsx)$/.test(file))) {
  if (relative(applicationRoot, filePath).startsWith('storage')) continue;
  const source = readFileSync(filePath, 'utf8');
  for (const rule of applicationForbiddenPatterns) {
    if (rule.pattern.test(source)) {
      violations.push(`${relative(root, filePath)} contains forbidden ${rule.description}.`);
    }
  }
}
for (const filePath of filesBelow(join(gameRoot, 'replay')).filter((file) => /\.js$/.test(file))) {
  const source = readFileSync(filePath, 'utf8');
  if (/from\s+['"][^'"]*\/ai\//.test(source)) {
    violations.push(`${relative(root, filePath)} must not import AI policy implementation.`);
  }
}

if (violations.length > 0) {
  console.error('Architecture check failed:\n' + violations.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log('Architecture check passed: game purity and application storage boundaries hold.');
