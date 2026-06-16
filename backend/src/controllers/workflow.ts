import { Router, type Request, type Response, type NextFunction } from 'express';

import {
  WorkflowNotFoundError,
  WorkflowStepNotFoundError,
} from '../entities/workflowErrors';
import type { WorkflowRepository } from '../entities/workflowRepository';

const DEFAULT_WORKFLOW = 'wf1';

/** Контроллер для процессов (workflow). */
export function createGetDataRouter(repository: WorkflowRepository): Router {
  const router = Router();

  /**
   * @openapi
   * /workflow/get:
   *   get:
   *     tags: [workflow]
   *     summary: Возвращает данные процесса (workflow)
   *     parameters:
   *       - in: query
   *         name: wfName
   *         required: false
   *         schema:
   *           type: string
   *           default: wf1
   *         example: wf1
   *         description: Название процесса (и файла процесса, без расширения .json)
   *     responses:
   *       200:
   *         description: Агрегат процесса (workflow)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Workflow'
   *       404:
   *         description: Процесс не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get(
    '/get',
    async (req: Request, res: Response, next: NextFunction) => {
      const wfNameParam = req.query.wfName;
      const wfName =
        typeof wfNameParam === 'string' && wfNameParam.length > 0
          ? wfNameParam
          : DEFAULT_WORKFLOW;

      try {
        const workflow = await repository.get(wfName);
        res.json(workflow);
      } catch (err) {
        if (err instanceof WorkflowNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  /**
   * @openapi
   * /workflow/changeStepXY:
   *   post:
   *     tags: [workflow]
   *     summary: Изменяет координаты шага на схеме (x, y)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [stepInitialIndex, x, y]
   *             properties:
   *               wfName:
   *                 type: string
   *                 default: wf1
   *                 description: Название процесса (и файла процесса, без расширения .json)
   *               stepInitialIndex:
   *                 type: integer
   *                 description: initialIndex шага процесса, координаты которого нужно изменить
   *               x:
   *                 type: number
   *                 description: Новое значение координаты x шага процесса
   *               y:
   *                 type: number
   *                 description: Новое значение координаты y шага процесса
   *     responses:
   *       200:
   *         description: Обновлённый агрегат процесса
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Workflow'
   *       404:
   *         description: Процесс или шаг не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post(
    '/changeStepXY',
    async (req: Request, res: Response, next: NextFunction) => {
      const wfName =
        typeof req.body?.wfName === 'string' && req.body.wfName.length > 0
          ? req.body.wfName
          : DEFAULT_WORKFLOW;

      const { stepInitialIndex, x, y } = req.body ?? {};
      if (
        typeof stepInitialIndex !== 'number' ||
        !Number.isInteger(stepInitialIndex)
      ) {
        res
          .status(400)
          .json({ error: 'stepInitialIndex must be an integer' });
        return;
      }
      if (typeof x !== 'number' || !Number.isFinite(x)) {
        res.status(400).json({ error: 'x must be a finite number' });
        return;
      }
      if (typeof y !== 'number' || !Number.isFinite(y)) {
        res.status(400).json({ error: 'y must be a finite number' });
        return;
      }

      try {
        let workflow = await repository.get(wfName);
        workflow.changeStepXY(stepInitialIndex, x, y);
        await repository.save(workflow);
        res.json(workflow);
      } catch (err) {
        if (err instanceof WorkflowNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        if (err instanceof WorkflowStepNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  /**
   * @openapi
   * /workflow/changeStepName:
   *   post:
   *     tags: [workflow]
   *     summary: Изменяет название шага
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [stepInitialIndex, stepName]
   *             properties:
   *               wfName:
   *                 type: string
   *                 default: wf1
   *                 description: Название процесса (и файла процесса, без расширения .json)
   *               stepInitialIndex:
   *                 type: integer
   *                 description initialIndex шага процесса, название которого нужно изменить
   *               stepName:
   *                 type: string
   *                 description: Новое значение поля name шага процесса
   *     responses:
   *       200:
   *         description: Обновлённый агрегат процесса
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Workflow'
   *       404:
   *         description: Процесс или шаг не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post(
    '/changeStepName',
    async (req: Request, res: Response, next: NextFunction) => {
      const wfName =
        typeof req.body?.wfName === 'string' && req.body.wfName.length > 0
          ? req.body.wfName
          : DEFAULT_WORKFLOW;

      const { stepInitialIndex, stepName } = req.body ?? {};
      if (
        typeof stepInitialIndex !== 'number' ||
        !Number.isInteger(stepInitialIndex)
      ) {
        res
          .status(400)
          .json({ error: 'stepInitialIndex must be an integer' });
        return;
      }
      if (typeof stepName !== 'string' || stepName.trim().length === 0) {
        res.status(400).json({ error: 'stepName must be a non-empty string' });
        return;
      }

      try {
        const workflow = await repository.get(wfName);
        workflow.changeStepName(stepInitialIndex, stepName.trim());
        await repository.save(workflow);
        res.json(workflow);
      } catch (err) {
        if (err instanceof WorkflowNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        if (err instanceof WorkflowStepNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  /**
   * @openapi
   * /workflow/createStep:
   *   post:
   *     tags: [workflow]
   *     summary: Создает новый шаг процесса
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [wfName, stepName, x, y]
   *             properties:
   *               wfName:
   *                 type: string
   *                 description: Название процесса (и файла процесса, без расширения .json)
   *               stepName:
   *                 type: string
   *                 description: name нового шага процесса
   *               x:
   *                 type: number
   *                 description: x нового шага процесса  
   *               y:
   *                 type: number
   *                 description: y нового шага процесса
   *               color:
   *                 type: string
   *                 description: Необязательный цвет блока на схеме (например, HEX)
   *     responses:
   *       201:
   *         description: Созданный шаг
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/WorkflowStep'
   *       404:
   *         description: Процесс не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post(
    '/createStep',
    async (req: Request, res: Response, next: NextFunction) => {
      const wfName = req.body?.wfName;
      if (typeof wfName !== 'string' || wfName.length === 0) {
        res.status(400).json({ error: 'wfName is required' });
        return;
      }

      const { stepName, x, y } = req.body ?? {};
      if (typeof stepName !== 'string' || stepName.trim().length === 0) {
        res.status(400).json({ error: 'stepName must be a non-empty string' });
        return;
      }
      if (typeof x !== 'number' || !Number.isFinite(x)) {
        res.status(400).json({ error: 'x must be a finite number' });
        return;
      }
      if (typeof y !== 'number' || !Number.isFinite(y)) {
        res.status(400).json({ error: 'y must be a finite number' });
        return;
      }

      const color =
        typeof req.body?.color === 'string' && req.body.color.trim().length > 0
          ? req.body.color.trim()
          : undefined;

      try {
        const workflow = await repository.get(wfName);
        const step = workflow.createStep(stepName.trim(), x, y, color);
        await repository.save(workflow);
        res.status(201).json(step);
      } catch (err) {
        if (err instanceof WorkflowNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        if (err instanceof WorkflowStepNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  /**
   * @openapi
   * /workflow/deleteStep:
   *   post:
   *     tags: [workflow]
   *     summary: Удаляет шаг процесса по stepInitialIndex
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [wfName, stepInitialIndex]
   *             properties:
   *               wfName:
   *                 type: string
   *                 description: Название процесса (и файла процесса, без расширения .json)
   *               stepInitialIndex:
   *                 type: integer
   *                 description: initialIndex удаляемого шага
   *     responses:
   *       200:
   *         description: Процесс после удаления шага
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Workflow'  
   *       404:
   *         description: Процесс или шаг не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post(
    '/deleteStep',
    async (req: Request, res: Response, next: NextFunction) => {
      const wfName = req.body?.wfName;
      if (typeof wfName !== 'string' || wfName.length === 0) {
        res.status(400).json({ error: 'wfName is required' });
        return;
      }

      const { stepInitialIndex } = req.body ?? {};
      if (
        typeof stepInitialIndex !== 'number' ||
        !Number.isInteger(stepInitialIndex)
      ) {
        res
          .status(400)
          .json({ error: 'stepInitialIndex must be an integer' });
        return;
      }

      try {
        const workflow = await repository.get(wfName);
        workflow.deleteStep(stepInitialIndex);
        await repository.save(workflow);
        res.json(workflow);
      } catch (err) {
        if (err instanceof WorkflowNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        if (err instanceof WorkflowStepNotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        next(err);
      }
    },
  );

  return router;
}
