/** Файл процесса с указанным идентификатором отсутствует. */
export class WorkflowNotFoundError extends Error {
  public constructor(public readonly workflowName: string) {
    super(`Workflow "${workflowName}" was not found`);
    this.name = 'WorkflowNotFoundError';
  }
}

/** В процессе нет шага с заданным stepInitialIndex. */
export class WorkflowStepNotFoundError extends Error {
  public constructor(
    public readonly workflowName: string,
    public readonly stepInitialIndex: number,
  ) {
    super(
      `Step with initialIndex ${stepInitialIndex} not found in workflow "${workflowName}"`,
    );
    this.name = 'WorkflowStepNotFoundError';
  }
}
