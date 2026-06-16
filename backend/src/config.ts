import path from 'path';

/** Порт, хост и каталог с JSON-файлами процессов (переменные окружения PORT, HOST, DATA_DIR). */
export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  dataDir: process.env.DATA_DIR
    ? path.resolve(process.env.DATA_DIR)
    : path.resolve(__dirname, '..', 'data'),
};

/** Полный путь к файлу процесса `<name>.json` в каталоге данных. */
export const workflowFile = (name: string): string =>
  path.join(config.dataDir, `${name}.json`);
