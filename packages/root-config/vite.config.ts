import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import vitePluginSingleSpa from 'vite-plugin-single-spa';

const tokensDir = fileURLToPath(new URL('../shared/styles', import.meta.url));

const DIAGRAM_DEV_ORIGIN = 'http://localhost:4102';

// React-микрофронт грузится через single-spa без своего index.html, поэтому
// @vitejs/plugin-react не успевает внедрить preamble React Refresh и падает.
// Внедряем preamble в оболочку из origin'а диаграммы (только в режиме dev).
function reactRefreshPreamble(): Plugin {
  return {
    name: 'wf-react-refresh-preamble',
    apply: 'serve',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          injectTo: 'head-prepend',
          children: [
            `import RefreshRuntime from '${DIAGRAM_DEV_ORIGIN}/@react-refresh';`,
            'RefreshRuntime.injectIntoGlobalHook(window);',
            'window.$RefreshReg$ = () => {};',
            'window.$RefreshSig$ = () => (type) => type;',
            'window.__vite_plugin_react_preamble_installed__ = true;',
          ].join('\n'),
        },
      ];
    },
  };
}

// Корневой проект single-spa: отдаёт оболочку и нативный import map,
// по которому браузер находит микрофронты-таблицу и -диаграмму.
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: { loadPaths: [tokensDir] },
    },
  },
  // Микрофронты разрешаются import map'ом в браузере, а не Vite —
  // выключаем их предсканирование, иначе он не найдёт entry у workspace-пакетов.
  optimizeDeps: {
    exclude: ['@wf/table-vue', '@wf/diagram-react'],
  },
  plugins: [
    reactRefreshPreamble(),
    vitePluginSingleSpa({
      type: 'root',
      importMaps: {
        type: 'importmap',
        dev: 'src/importMap.dev.json',
        build: 'src/importMap.json',
      },
      imo: false,
    }),
  ],
});
