import { createApp } from './app';
import { config } from './config';

// Точка входа: поднимает HTTP-сервер wf-editor.
const app = createApp();

const server = app.listen(config.port, config.host, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[wf-editor] listening on http://${config.host}:${config.port} (data dir: ${config.dataDir})`,
  );
});

const shutdown = (signal: string): void => {
  // eslint-disable-next-line no-console
  console.log(`[wf-editor] received ${signal}, shutting down...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
