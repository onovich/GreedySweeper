import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const gameRoot = join(root, 'src', 'game');
const forbiddenPatterns = [
  { pattern: /from\s+['"]react(?:\/[^'"]*)?['"]/, description: 'React import' },
  { pattern: /from\s+['"][^'"]*\/ui(?:\/[^'"]*)?['"]/, description: 'UI import' },
  { pattern: /\b(document|window|setTimeout|setInterval)\b/, description: 'browser or timer API' },
];

function filesBelow(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(entryPath) : [entryPath];
  });
}

const violations = [];
for (const filePath of filesBelow(gameRoot).filter((file) => /\.(js|jsx)$/.test(file))) {
  const source = readFileSync(filePath, 'utf8');
  for (const rule of forbiddenPatterns) {
    if (rule.pattern.test(source)) {
      violations.push(`${relative(root, filePath)} contains forbidden ${rule.description}.`);
    }
  }
}

if (violations.length > 0) {
  console.error('Architecture check failed:\n' + violations.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}

console.log('Architecture check passed: no forbidden imports or browser/timer APIs in src/game.');
