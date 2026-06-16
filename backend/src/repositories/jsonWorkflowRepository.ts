import fs from 'fs/promises';

import JSON5 from 'json5';

import { workflowFile } from '../config';
import { Workflow } from '../entities/workflow';
import { WorkflowNotFoundError } from '../entities/workflowErrors';
import { WorkflowStep } from '../entities/workflowStep';
import type { WorkflowRepository } from '../entities/workflowRepository';

/** Описание одного шага в JSON-файле процесса. */
type WorkflowStepJson = {
  initialIndex: number;
  name: string;
  x: number;
  y: number;
  color?: string;
  nextSteps: number[];
};

/** Репозиторий: чтение и запись процессов в виде `<имя>.json` в каталоге данных. */
export class JsonWorkflowRepository implements WorkflowRepository {
  public async get(name: string): Promise<Workflow> {
    let raw: string;
    try {
      raw = await fs.readFile(workflowFile(name), 'utf-8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new WorkflowNotFoundError(name);
      }
      throw err;
    }

    const rows = JSON5.parse(raw) as WorkflowStepJson[];
    const steps = rows.map(
      (row) =>
        new WorkflowStep(
          row.initialIndex,
          row.name,
          row.x,
          row.y,
          row.nextSteps,
          row.color,
        ),
    );
    return new Workflow(name, steps);
  }

  public async save(workflow: Workflow): Promise<void> {
    const data: WorkflowStepJson[] = workflow.steps.map((s) => {
      const row: WorkflowStepJson = {
        initialIndex: s.initialIndex,
        name: s.name,
        x: s.x,
        y: s.y,
        nextSteps: [...s.nextSteps],
      };
      if (s.color !== undefined && s.color !== '') {
        row.color = s.color;
      }
      return row;
    });
    const json = `${JSON.stringify(data, null, '\t')}\n`;
    await fs.writeFile(workflowFile(workflow.name), json, 'utf-8');
  }
}
