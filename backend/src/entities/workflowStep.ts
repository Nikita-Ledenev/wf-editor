/** Шаг процесса: изначальный индекс, позиция на схеме, название, исходящие связи, опционально цвет блока. */
export class WorkflowStep {
  public constructor(
    /** Изначальный индекс шага. Уникальный идентификатор шага в рамках процесса */
    public readonly initialIndex: number,
    /** Название шага */
    public name: string,
    /** Координаты шага на схеме */
    public x: number,
    public y: number,
    /** Индексы (initialIndex) следующих шагов */
    public nextSteps: ReadonlyArray<number>,
    /** Цвет блока на схеме (HEX, CSS и т.д.); если не задан — в JSON не пишется */
    public color?: string,
  ) {}  public changeXY(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public changeName(newName: string) {
    this.name = newName;
  }
}
