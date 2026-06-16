import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const sharedSrc = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@wf/shared': sharedSrc },
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
