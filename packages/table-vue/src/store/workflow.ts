import { api, bus, type WorkflowStep } from '@wf/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type SortKey = 'name' | 'x' | 'y';
export type SortDir = 'asc' | 'desc';
export interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

const SORT_STORAGE_KEY = 'wf-editor:sort';
const DEFAULT_NEW_COLOR = '#ffffff';
// Окно отмены удаления: на сервер изменение уходит только по его истечении.
const UNDO_MS = 5000;

interface PendingDelete {
  step: WorkflowStep;
  pos: number;
  timer: ReturnType<typeof setTimeout>;
}

function loadSort(): SortState {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SortState;
      if (parsed && (parsed.key === null || ['name', 'x', 'y'].includes(parsed.key))) {
        return parsed;
      }
    }
  } catch {
    /* битый localStorage — игнорируем, берём дефолт */
  }
  return { key: null, dir: 'asc' };
}

export const useWorkflowStore = defineStore('workflow', () => {
  const steps = ref<WorkflowStep[]>([]);
  const selectedIndex = ref<number | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const search = ref('');
  const sort = ref<SortState>(loadSort());
  const newColor = ref<string>(DEFAULT_NEW_COLOR);
  // удаления в окне отмены: шаг уже убран из UI, но на сервере ещё не удалён
  const pendingDeletes = ref<PendingDelete[]>([]);

  const stepByIndex = computed(() => {
    const map = new Map<number, WorkflowStep>();
    for (const s of steps.value) map.set(s.initialIndex, s);
    return map;
  });

  // Сортировка и поиск — только представление, на данные и диаграмму не влияют.
  const visibleSteps = computed(() => {
    const q = search.value.trim().toLowerCase();
    let rows = steps.value;
    if (q) {
      rows = rows.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (sort.value.key) {
      const { key, dir } = sort.value;
      const factor = dir === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        if (key === 'name') return a.name.localeCompare(b.name, 'ru') * factor;
        return (a[key] - b[key]) * factor;
      });
    }
    return rows;
  });

  function broadcastState() {
    bus.emit(
      'wf:state',
      steps.value.map((s) => ({ ...s })),
    );
  }

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      const wf = await api.getWorkflow();
      steps.value = wf.steps;
      broadcastState();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Выбирает шаг и оповещает диаграмму через шину.
   * @param broadcast false, если выбор пришёл из диаграммы — иначе зациклимся.
   */
  function select(initialIndex: number | null, broadcast = true) {
    selectedIndex.value = initialIndex;
    if (broadcast) bus.emit('wf:select', { initialIndex });
  }

  function nextDefaultName(): string {
    const names = new Set(steps.value.map((s) => s.name));
    let n = steps.value.length;
    let name = `Шаг ${n}`;
    while (names.has(name)) {
      n += 1;
      name = `Шаг ${n}`;
    }
    return name;
  }

  async function createStep() {
    const name = nextDefaultName();
    try {
      const created = await api.createStep(name, 0, 0, newColor.value);
      steps.value = [...steps.value, created];
      broadcastState();
      select(created.initialIndex);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось создать шаг';
    }
  }

  async function renameStep(initialIndex: number, name: string) {
    const trimmed = name.trim();
    const step = stepByIndex.value.get(initialIndex);
    if (!step || trimmed.length === 0 || trimmed === step.name) return;
    // Имена уникальны: не даём задвоить.
    if (steps.value.some((s) => s.initialIndex !== initialIndex && s.name === trimmed)) {
      error.value = `Шаг с названием «${trimmed}» уже существует`;
      return;
    }
    const prev = step.name;
    step.name = trimmed;
    broadcastState();
    try {
      await api.changeStepName(initialIndex, trimmed);
    } catch (e) {
      step.name = prev;
      broadcastState();
      error.value = e instanceof Error ? e.message : 'Не удалось переименовать шаг';
    }
  }

  /**
   * Убирает шаг из UI сразу, но удаление на сервере откладывает на окно отмены —
   * это даёт безопасный Undo без потери данных.
   */
  function deleteStep(initialIndex: number) {
    const pos = steps.value.findIndex((s) => s.initialIndex === initialIndex);
    if (pos === -1) return;
    const step = steps.value[pos];
    steps.value = steps.value.filter((s) => s.initialIndex !== initialIndex);
    if (selectedIndex.value === initialIndex) select(null);
    broadcastState();
    const timer = setTimeout(() => {
      void commitDelete(initialIndex);
    }, UNDO_MS);
    pendingDeletes.value = [...pendingDeletes.value, { step, pos, timer }];
  }

  function restoreAt(step: WorkflowStep, pos: number) {
    const next = [...steps.value];
    next.splice(Math.min(pos, next.length), 0, step);
    steps.value = next;
    broadcastState();
  }

  function undoDelete(initialIndex: number) {
    const i = pendingDeletes.value.findIndex((p) => p.step.initialIndex === initialIndex);
    if (i === -1) return;
    const p = pendingDeletes.value[i];
    clearTimeout(p.timer);
    pendingDeletes.value = pendingDeletes.value.filter((_, j) => j !== i);
    restoreAt(p.step, p.pos);
  }

  async function commitDelete(initialIndex: number) {
    const i = pendingDeletes.value.findIndex((p) => p.step.initialIndex === initialIndex);
    if (i === -1) return;
    const p = pendingDeletes.value[i];
    pendingDeletes.value = pendingDeletes.value.filter((_, j) => j !== i);
    try {
      await api.deleteStep(initialIndex);
    } catch (e) {
      restoreAt(p.step, p.pos); // не удалось на сервере — возвращаем
      error.value = e instanceof Error ? e.message : 'Не удалось удалить шаг';
    }
  }

  // Закрытие вкладки до истечения окна — досылаем удаления keepalive-запросом.
  function flushPendingDeletes() {
    for (const p of pendingDeletes.value) {
      clearTimeout(p.timer);
      void api.deleteStep(p.step.initialIndex, undefined, { keepalive: true });
    }
    pendingDeletes.value = [];
  }
  window.addEventListener('beforeunload', flushPendingDeletes);

  async function moveStep(initialIndex: number, x: number, y: number) {
    const step = stepByIndex.value.get(initialIndex);
    if (!step) return;
    const rx = Math.round(x);
    const ry = Math.round(y);
    if (step.x === rx && step.y === ry) return;
    step.x = rx;
    step.y = ry;
    // Транслируем округлённые координаты, чтобы диаграмма не осталась с дробными.
    broadcastState();
    try {
      await api.changeStepXY(initialIndex, rx, ry);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не удалось сохранить координаты';
    }
  }

  function setSort(key: SortKey) {
    if (sort.value.key === key) {
      // тот же столбец: asc -> desc -> выкл
      if (sort.value.dir === 'asc') sort.value = { key, dir: 'desc' };
      else sort.value = { key: null, dir: 'asc' };
    } else {
      sort.value = { key, dir: 'asc' };
    }
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sort.value));
  }

  function setSearch(q: string) {
    search.value = q;
  }

  function setNewColor(color: string) {
    newColor.value = color;
  }

  bus.on('wf:select', ({ initialIndex }) => {
    // эхо собственного выбора игнорируем, иначе только синхронизируемся
    if (initialIndex !== selectedIndex.value) select(initialIndex, false);
  });
  bus.on('wf:move', ({ initialIndex, x, y }) => {
    void moveStep(initialIndex, x, y);
  });

  return {
    steps,
    selectedIndex,
    loading,
    error,
    search,
    sort,
    newColor,
    pendingDeletes,
    stepByIndex,
    visibleSteps,
    load,
    select,
    createStep,
    renameStep,
    deleteStep,
    undoDelete,
    moveStep,
    setSort,
    setSearch,
    setNewColor,
  };
});
