import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = normalizeBase(process.env.VITE_DEPLOY_BASE ?? '/GreedySweeper/');

export default defineConfig({
  root: import.meta.dirname,
  base,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{js,jsx}'],
  },
});

function normalizeBase(value) {
  if (!value.startsWith('/') || !value.endsWith('/'))
    throw new Error('VITE_DEPLOY_BASE must start and end with a slash');
  return value;
}
