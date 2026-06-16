import { createPinia } from 'pinia';
import singleSpaVue from 'single-spa-vue';
import { cssLifecycleFactory } from 'vite-plugin-single-spa/ex';
import { createApp, h } from 'vue';
import App from './App.vue';

const pinia = createPinia();

const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: {
    el: '#table-app',
    render() {
      return h(App);
    },
  },
  handleInstance(app) {
    app.use(pinia);
  },
});

// Монтируем/демонтируем CSS-бандл этого микрофронта вместе с приложением.
const cssLc = cssLifecycleFactory('spa');

export const bootstrap = [cssLc.bootstrap, vueLifecycles.bootstrap];
export const mount = [cssLc.mount, vueLifecycles.mount];
export const unmount = [cssLc.unmount, vueLifecycles.unmount];
