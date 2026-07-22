import { spawnSync } from 'node:child_process';

const target = process.argv[2];
const baseByTarget = { github: '/GreedySweeper/', cloudflare: '/' };
const base = baseByTarget[target];
if (!base) throw new Error('Use `github` or `cloudflare` as the build target');

const result = spawnSync('npx', ['vite', 'build', '--config', 'apps/web/vite.config.js'], {
  env: { ...process.env, VITE_DEPLOY_BASE: base },
  shell: process.platform === 'win32',
  stdio: 'inherit',
});
process.exitCode = result.status ?? 1;
