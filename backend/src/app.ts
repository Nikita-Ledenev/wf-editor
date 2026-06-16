import cors from 'cors';
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import swaggerUi from 'swagger-ui-express';

import { createGetDataRouter } from './controllers/workflow';
import type { WorkflowRepository } from './entities/workflowRepository';
import { buildOpenApiSpec } from './openapi';
import { JsonWorkflowRepository } from './repositories/jsonWorkflowRepository';

/** Создаёт Express-приложение: API процессов, OpenAPI и Swagger UI. */
export function createApp(
  workflowRepository: WorkflowRepository = new JsonWorkflowRepository(),
): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/workflow', createGetDataRouter(workflowRepository));

  // OpenAPI: спецификация пересобирается при каждом GET (подхватываются JSDoc из кода).
  app.get('/openapi.json', (_req, res) => {
    res.json(buildOpenApiSpec());
  });

  app.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      customSiteTitle: 'Документация API wf-editor',
      swaggerOptions: {
        url: '/openapi.json',
        displayRequestDuration: true,
      },
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error('[wf-editor] необработанная ошибка:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
