import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const sharedSrc = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@wf/shared': sharedSrc },
  },
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
