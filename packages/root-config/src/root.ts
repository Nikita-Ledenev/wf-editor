import { registerApplication, start } from 'single-spa';
import './global.scss';

// Спецификатор через переменную, чтобы Vite не резолвил его при сборке —
// разрешение отдаётся нативному import map в браузере.
const loadApp = (name: string) => import(/* @vite-ignore */ name);

registerApplication({
  name: '@wf/table-vue',
  app: () => loadApp('@wf/table-vue'),
  activeWhen: () => true,
});

registerApplication({
  name: '@wf/diagram-react',
  app: () => loadApp('@wf/diagram-react'),
  activeWhen: () => true,
});

start({ urlRerouteOnly: true });
