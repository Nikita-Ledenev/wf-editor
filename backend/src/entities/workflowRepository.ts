import type { Workflow } from './workflow';

/** Доступ к сохранённому процессу (workflow): загрузка и запись. */
export interface WorkflowRepository {
  get(name: string): Promise<Workflow>;
  save(workflow: Workflow): Promise<void>;
}
