// Микрофронты разрешаются через import map в рантайме, в node_modules их нет —
// объявляем модули, чтобы TypeScript не ругался на динамические импорты в root.ts.
declare module '@wf/table-vue';
declare module '@wf/diagram-react';
