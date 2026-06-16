import type { WorkflowStep } from './types';

/**
 * Карта событий шины. Микрофронты живут в одном окне, но в разных фреймворках,
 * поэтому общаются через общий EventTarget, а не через общий стор.
 */
export interface WfEventMap {
  /** Таблица — владелец данных — транслирует актуальный список шагов. */
  'wf:state': WorkflowStep[];
  /** Выбор шага (из таблицы или из диаграммы). null — снять выделение. */
  'wf:select': { initialIndex: number | null };
  /** Диаграмма сообщает о перетаскивании блока, чтобы таблица сохранила координаты. */
  'wf:move': { initialIndex: number; x: number; y: number };
}

type Handler<K extends keyof WfEventMap> = (payload: WfEventMap[K]) => void;

const TARGET_KEY = '__wfEditorBus__';

function getTarget(): EventTarget {
  const w = window as unknown as Record<string, EventTarget>;
  if (!w[TARGET_KEY]) {
    w[TARGET_KEY] = new EventTarget();
  }
  return w[TARGET_KEY];
}

export const bus = {
  emit<K extends keyof WfEventMap>(type: K, payload: WfEventMap[K]): void {
    getTarget().dispatchEvent(new CustomEvent(type, { detail: payload }));
  },

  on<K extends keyof WfEventMap>(type: K, handler: Handler<K>): () => void {
    const listener = (e: Event) => handler((e as CustomEvent).detail);
    getTarget().addEventListener(type, listener);
    return () => getTarget().removeEventListener(type, listener);
  },
};
