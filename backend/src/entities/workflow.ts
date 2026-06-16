import { WorkflowStepNotFoundError } from './workflowErrors';
import { WorkflowStep } from './workflowStep';

/** Агрегат процесса (workflow): название и список шагов. */
export class Workflow {
  public constructor(
    /** Название процесса */
    public readonly name: string,
    /** Список шагов */
    public readonly steps: Array<WorkflowStep>,
  ) {}

  public createStep(
    stepName: string,
    x: number,
    y: number,
    color?: string,
  ): WorkflowStep {
    const indices = this.steps.map((s) => s.initialIndex);
    const initialIndex =
      indices.length === 0 ? 0 : Math.max(...indices) + 1;
    const step = new WorkflowStep(initialIndex, stepName, x, y, [], color);
    this.steps.push(step);
    return step;
  }

  public deleteStep(stepInitialIndex: number): void {
    const i = this.steps.findIndex(
      (s) => s.initialIndex === stepInitialIndex,
    );
    if (i === -1) {
      throw new WorkflowStepNotFoundError(this.name, stepInitialIndex);
    }
    this.steps.splice(i, 1);
  }

  public changeStepXY(stepInitialIndex: number, x: number, y: number) {
    const step = this.steps.find((s) => s.initialIndex === stepInitialIndex);
    if (step) {
      step.changeXY(x, y);
    }
  }

  public changeStepName(stepInitialIndex: number, newName: string) {
    const step = this.steps.find((s) => s.initialIndex === stepInitialIndex);
    if (step) {
      step.changeName(newName);
    }
  }
}
