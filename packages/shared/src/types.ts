/** Шаг рабочего процесса в том виде, в каком его отдаёт бэкенд. */
export interface WorkflowStep {
  /** Уникальный идентификатор шага в рамках процесса. Не меняется при переименовании. */
  initialIndex: number;
  name: string;
  x: number;
  y: number;
  /** initialIndex'ы следующих шагов. */
  nextSteps: number[];
  /** HEX-цвет блока. У старых шагов может отсутствовать. */
  color?: string;
}

/** Агрегат процесса: имя файла-процесса и его шаги. */
export interface Workflow {
  name: string;
  steps: WorkflowStep[];
}
