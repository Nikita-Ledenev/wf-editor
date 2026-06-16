import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Изолируем стор от сети и шины — проверяем чистую логику.
vi.mock('@wf/shared', () => ({
  api: {
    getWorkflow: vi.fn(),
    createStep: vi.fn(),
    changeStepName: vi.fn(),
    changeStepXY: vi.fn(),
    deleteStep: vi.fn(),
  },
  bus: { emit: vi.fn(), on: vi.fn(() => () => {}) },
}));

import { api } from '@wf/shared';
import { useWorkflowStore } from '../src/store/workflow';

describe('workflow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('генерирует уникальное дефолтное имя при коллизии «Шаг N»', async () => {
    const store = useWorkflowStore();
    store.steps = [
      { initialIndex: 0, name: 'Закупка', x: 10, y: 20, nextSteps: [], color: '#666666' },
      { initialIndex: 1, name: 'Шаг 2', x: 5, y: 5, nextSteps: [], color: '#000000' },
    ];
    (api.createStep as ReturnType<typeof vi.fn>).mockResolvedValue({
      initialIndex: 2,
      name: 'Шаг 3',
      x: 0,
      y: 0,
      nextSteps: [],
      color: '#ffffff',
    });

    await store.createStep();

    // length === 2 → базовое «Шаг 2» занято → берём «Шаг 3»; координаты 0,0; цвет белый.
    expect(api.createStep).toHaveBeenCalledWith('Шаг 3', 0, 0, '#ffffff');
  });

  it('фильтрует и сортирует видимые строки, не трогая исходный список', () => {
    const store = useWorkflowStore();
    store.steps = [
      { initialIndex: 0, name: 'Закупка', x: 30, y: 0, nextSteps: [], color: '#666666' },
      { initialIndex: 1, name: 'Хранение', x: 10, y: 0, nextSteps: [], color: '#666666' },
      { initialIndex: 2, name: 'Сортировка', x: 20, y: 0, nextSteps: [], color: '#666666' },
    ];

    store.setSearch('сорт');
    expect(store.visibleSteps.map((s) => s.name)).toEqual(['Сортировка']);

    store.setSearch('');
    store.setSort('x'); // по возрастанию
    expect(store.visibleSteps.map((s) => s.x)).toEqual([10, 20, 30]);

    store.setSort('x'); // тот же столбец → по убыванию
    expect(store.visibleSteps.map((s) => s.x)).toEqual([30, 20, 10]);

    // Сортировка сохраняется в localStorage.
    expect(JSON.parse(localStorage.getItem('wf-editor:sort')!)).toEqual({ key: 'x', dir: 'desc' });
    // Исходный порядок не изменился.
    expect(store.steps.map((s) => s.initialIndex)).toEqual([0, 1, 2]);
  });

  it('удаление откладывается на окно отмены и возвращается через undo', () => {
    vi.useFakeTimers();
    const store = useWorkflowStore();
    store.steps = [
      { initialIndex: 0, name: 'A', x: 0, y: 0, nextSteps: [], color: '#666666' },
      { initialIndex: 1, name: 'B', x: 0, y: 0, nextSteps: [], color: '#0044aa' },
    ];

    store.deleteStep(1);
    // Из UI ушло сразу, но на сервер ещё не отправляли.
    expect(store.steps.map((s) => s.initialIndex)).toEqual([0]);
    expect(store.pendingDeletes).toHaveLength(1);
    expect(api.deleteStep).not.toHaveBeenCalled();

    store.undoDelete(1);
    // Шаг вернулся на свою позицию, коммита на сервер так и не было.
    expect(store.steps.map((s) => s.initialIndex)).toEqual([0, 1]);
    expect(store.pendingDeletes).toHaveLength(0);

    // Новое удаление без отмены — по истечении окна уходит на сервер.
    (api.deleteStep as ReturnType<typeof vi.fn>).mockResolvedValue({ name: 'wf1', steps: [] });
    store.deleteStep(1);
    vi.advanceTimersByTime(5000);
    expect(api.deleteStep).toHaveBeenCalledWith(1);

    vi.useRealTimers();
  });
});
