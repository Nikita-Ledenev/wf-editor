import path from 'path';

import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'wf-editor API',
      version: '0.1.0',
      description:
        'Бэкенд wf-editor: загрузка и сохранение данных процессов (workflow) из JSON-файлов.',
    },
    servers: [{ url: '/', description: 'Текущий хост' }],
    tags: [{ name: 'workflow', description: 'Операции с процессами (workflow)' }],
    components: {
      schemas: {
        WorkflowStep: {
          type: 'object',
          required: ['initialIndex', 'name', 'x', 'y', 'nextSteps'],
          properties: {
            initialIndex: { type: 'integer', example: 0 },
            name: { type: 'string', example: 'Закупка' },
            x: { type: 'number', example: 174 },
            y: { type: 'number', example: 101 },
            color: {
              type: 'string',
              example: '#5C6BC0',
              description: 'Необязательный цвет блока на схеме (например, HEX)',
            },
            nextSteps: {
              type: 'array',
              items: { type: 'integer' },
              example: [1, 2],
            },
          },
        },
        Workflow: {
          type: 'object',
          required: ['name', 'steps'],
          properties: {
            name: { type: 'string', example: 'wf1' },
            steps: {
              type: 'array',
              items: { $ref: '#/components/schemas/WorkflowStep' },
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              example: 'Процесс «wf2» не найден',
            },
          },
        },
      },
    },
  },
  // Подхватываются и .ts (режим dev / ts-node-dev), и .js (сборка dist),
  // чтобы один и тот же путь к файлам работал в обоих вариантах запуска.
  apis: [
    path.join(__dirname, 'controllers', '*.{ts,js}'),
    path.join(__dirname, 'app.{ts,js}'),
  ],
};

/** Собирает объект спецификации OpenAPI из JSDoc в исходниках. */
export function buildOpenApiSpec(): object {
  return swaggerJSDoc(options);
}
