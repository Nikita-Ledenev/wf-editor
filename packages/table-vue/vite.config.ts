import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

const sharedSrc = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));
const tokensDir = fileURLToPath(new URL('../shared/styles', import.meta.url));

export default defineConfig(({ command }) => ({
  // В сборке микрофронт отдаётся со своего origin (:4101), а монтируется в
  // оболочку на :4100 — base нужен, чтобы ссылки на CSS/ассеты резолвились верно.
  base: command === 'build' ? 'http://localhost:4101/' : '/',
  resolve: {
    alias: {
      '@wf/shared': sharedSrc,
    },
  },
  css: {
    preprocessorOptions: {
      scss: { loadPaths: [tokensDir] },
    },
  },
  // Микрофронт грузится из корневой оболочки (другой origin) — открываем CORS
  // и в dev, и в preview (продакшн-сборка).
  server: { cors: true },
  preview: { cors: true },
  // У mife нет index.html: указываем точку входа для предсканирования зависимостей.
  optimizeDeps: { entries: ['src/spa.ts'] },
  plugins: [
    vue(),
    vitePluginSingleSpa({
      type: 'mife',
      serverPort: 4101,
      spaEntryPoints: 'src/spa.ts',
      projectId: 'wf-table',
    }),
  ],
}));
