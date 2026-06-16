import type { WorkflowStep } from '@wf/shared';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface DiagramState {
  steps: WorkflowStep[];
  selectedIndex: number | null;
}

const initialState: DiagramState = {
  steps: [],
  selectedIndex: null,
};

const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    setSteps(state, action: PayloadAction<WorkflowStep[]>) {
      state.steps = action.payload;
      // выбранный шаг мог исчезнуть из нового состояния — снимаем выделение
      if (
        state.selectedIndex !== null &&
        !action.payload.some((s) => s.initialIndex === state.selectedIndex)
      ) {
        state.selectedIndex = null;
      }
    },
    setSelected(state, action: PayloadAction<number | null>) {
      state.selectedIndex = action.payload;
    },
    moveStepLocal(state, action: PayloadAction<{ initialIndex: number; x: number; y: number }>) {
      const step = state.steps.find((s) => s.initialIndex === action.payload.initialIndex);
      if (step) {
        step.x = action.payload.x;
        step.y = action.payload.y;
      }
    },
  },
});

export const { setSteps, setSelected, moveStepLocal } = diagramSlice.actions;
export default diagramSlice.reducer;
