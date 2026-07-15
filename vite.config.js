import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/GreedySweeper/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
