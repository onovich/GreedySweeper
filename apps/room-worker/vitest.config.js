import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      main: 'apps/room-worker/src/index.js',
      wrangler: { configPath: 'apps/room-worker/wrangler.jsonc' },
    }),
  ],
  test: {
    pool: '@cloudflare/vitest-pool-workers',
    include: ['apps/room-worker/worker.test.js'],
  },
});
