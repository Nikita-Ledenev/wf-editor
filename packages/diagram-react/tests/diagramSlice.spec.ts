import type { WorkflowStep } from '@wf/shared';
import { describe, expect, it } from 'vitest';
import reducer, { moveStepLocal, setSelected, setSteps } from '../src/store/diagramSlice';

const steps: WorkflowStep[] = [
  { initialIndex: 0, name: 'A', x: 0, y: 0, nextSteps: [1], color: '#666666' },
  { initialIndex: 1, name: 'B', x: 50, y: 50, nextSteps: [], color: '#0044aa' },
];

describe('diagramSlice', () => {
  it('кладёт состояние от таблицы', () => {
    const state = reducer(undefined, setSteps(steps));
    expect(state.steps).toHaveLength(2);
  });

  it('перемещение блока меняет координаты конкретного шага', () => {
    let state = reducer(undefined, setSteps(steps));
    state = reducer(state, moveStepLocal({ initialIndex: 1, x: 999, y: 111 }));
    expect(state.steps.find((s) => s.initialIndex === 1)).toMatchObject({ x: 999, y: 111 });
    expect(state.steps.find((s) => s.initialIndex === 0)).toMatchObject({ x: 0, y: 0 });
  });

  it('снимает выделение, если выбранный шаг исчез из нового состояния', () => {
    let state = reducer(undefined, setSteps(steps));
    state = reducer(state, setSelected(1));
    expect(state.selectedIndex).toBe(1);
    // Прислали состояние без шага 1 — выделение должно сброситься.
    state = reducer(state, setSteps([steps[0]]));
    expect(state.selectedIndex).toBeNull();
  });
});
