import { api, bus, type WorkflowStep } from '@wf/shared';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { center, edgePoint, type Rect } from '../lib/geometry';
import { moveStepLocal, setSelected, setSteps, useAppDispatch, useAppSelector } from '../store';
import Block from './Block';
import styles from './Diagram.module.scss';

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const FIT_PADDING = 56;
const ARROW_COLOR = '#1a1a1a';

type Size = { w: number; h: number };

export default function Diagram() {
  const dispatch = useAppDispatch();
  const steps = useAppSelector((s) => s.diagram.steps);
  const selectedIndex = useAppSelector((s) => s.diagram.selectedIndex);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: FIT_PADDING, y: FIT_PADDING });
  const [sizes, setSizes] = useState<Record<number, Size>>({});

  const dragRef = useRef<{
    index: number;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    x: number;
    y: number;
  } | null>(null);
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(
    null,
  );
  const fittedRef = useRef(false);

  useEffect(() => {
    const offState = bus.on('wf:state', (next) => {
      // пока идёт перетаскивание — не даём входящему состоянию вернуть блок назад
      if (dragRef.current) return;
      dispatch(setSteps(next));
    });
    const offSelect = bus.on('wf:select', ({ initialIndex }) =>
      dispatch(setSelected(initialIndex)),
    );

    // фолбэк, если диаграмма смонтировалась раньше первой трансляции от таблицы
    api
      .getWorkflow()
      .then((wf) => {
        if (steps.length === 0 && !dragRef.current) dispatch(setSteps(wf.steps));
      })
      .catch(() => undefined);

    return () => {
      offState();
      offSelect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const onSize = useCallback((initialIndex: number, w: number, h: number) => {
    setSizes((prev) => {
      const cur = prev[initialIndex];
      if (cur && cur.w === w && cur.h === h) return prev;
      return { ...prev, [initialIndex]: { w, h } };
    });
  }, []);

  const rectOf = useCallback(
    (step: WorkflowStep): Rect | null => {
      const size = sizes[step.initialIndex];
      if (!size) return null;
      return { x: step.x, y: step.y, w: size.w, h: size.h };
    },
    [sizes],
  );

  const fitToContent = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || steps.length === 0) return;
    const rects = steps.map(rectOf);
    if (rects.some((r) => r === null)) return;
    let maxX = 0;
    let maxY = 0;
    for (const r of rects as Rect[]) {
      maxX = Math.max(maxX, r.x + r.w);
      maxY = Math.max(maxY, r.y + r.h);
    }
    const vw = vp.clientWidth - FIT_PADDING * 2;
    const vh = vp.clientHeight - FIT_PADDING * 2;
    const next = Math.min(vw / maxX, vh / maxY, 1);
    setScale(next > 0 ? next : 1);
    setPan({ x: FIT_PADDING, y: FIT_PADDING });
  }, [steps, rectOf]);

  useLayoutEffect(() => {
    if (fittedRef.current || steps.length === 0) return;
    if (steps.every((s) => sizes[s.initialIndex])) {
      fittedRef.current = true;
      fitToContent();
    }
  }, [steps, sizes, fitToContent]);

  const onBlockPointerDown = useCallback(
    (e: React.MouseEvent, step: WorkflowStep) => {
      e.stopPropagation();
      dragRef.current = {
        index: step.initialIndex,
        sx: e.clientX,
        sy: e.clientY,
        ox: step.x,
        oy: step.y,
        x: step.x,
        y: step.y,
      };

      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;
        // Не пускаем блок в отрицательные координаты — они уехали бы за холст и на сервер.
        const nx = Math.max(0, d.ox + (ev.clientX - d.sx) / scale);
        const ny = Math.max(0, d.oy + (ev.clientY - d.sy) / scale);
        d.x = nx;
        d.y = ny;
        dispatch(moveStepLocal({ initialIndex: d.index, x: nx, y: ny }));
      };
      const onUp = () => {
        const d = dragRef.current;
        // Сбрасываем флаг ДО emit: тогда обратная трансляция wf:state с
        // округлёнными координатами не будет отброшена guard'ом по dragRef.
        dragRef.current = null;
        if (d) bus.emit('wf:move', { initialIndex: d.index, x: d.x, y: d.y });
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [scale, dispatch],
  );

  const onCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false };

      const onMove = (ev: MouseEvent) => {
        const p = panRef.current;
        if (!p) return;
        const dx = ev.clientX - p.sx;
        const dy = ev.clientY - p.sy;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) p.moved = true;
        setPan({ x: p.ox + dx, y: p.oy + dy });
      };
      const onUp = () => {
        const p = panRef.current;
        if (p && !p.moved) {
          // Клик по пустому полю — снимаем выделение.
          dispatch(setSelected(null));
          bus.emit('wf:select', { initialIndex: null });
        }
        panRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [pan, dispatch],
  );

  const zoomByButton = useCallback(
    (factor: number) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const mx = vp.clientWidth / 2;
      const my = vp.clientHeight / 2;
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
      if (next === scale) return;
      const wx = (mx - pan.x) / scale;
      const wy = (my - pan.y) / scale;
      setPan({ x: mx - wx * next, y: my - wy * next });
      setScale(next);
    },
    [scale, pan],
  );

  const onSelectBlock = useCallback(
    (initialIndex: number) => {
      dispatch(setSelected(initialIndex));
      bus.emit('wf:select', { initialIndex });
    },
    [dispatch],
  );

  // Колесо мыши: preventDefault невозможен в пассивном React-обработчике,
  // поэтому вешаем нативный listener.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setScale((prevScale) => {
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prevScale * factor));
        if (next === prevScale) return prevScale;
        setPan((prevPan) => {
          const wx = (mx - prevPan.x) / prevScale;
          const wy = (my - prevPan.y) / prevScale;
          return { x: mx - wx * next, y: my - wy * next };
        });
        return next;
      });
    };
    vp.addEventListener('wheel', handler, { passive: false });
    return () => vp.removeEventListener('wheel', handler);
  }, []);

  const arrows: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const step of steps) {
    const from = rectOf(step);
    if (!from) continue;
    const fc = center(from);
    for (const nextIdx of step.nextSteps) {
      const target = steps.find((s) => s.initialIndex === nextIdx);
      if (!target) continue;
      const to = rectOf(target);
      if (!to) continue;
      const tc = center(to);
      const p1 = edgePoint(from, tc.x, tc.y);
      const p2 = edgePoint(to, fc.x, fc.y);
      arrows.push({
        id: `${step.initialIndex}-${nextIdx}`,
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
      });
    }
  }

  let bound = 1000;
  for (const step of steps) {
    const r = rectOf(step);
    if (r) bound = Math.max(bound, r.x + r.w + 200, r.y + r.h + 200);
  }

  // при выделении подсвечиваем соседей и инцидентные стрелки, остальное приглушаем
  const hasSelection = selectedIndex !== null;
  const connectedNodes = new Set<number>();
  const connectedEdges = new Set<string>();
  if (hasSelection) {
    connectedNodes.add(selectedIndex);
    for (const step of steps) {
      if (step.initialIndex === selectedIndex) {
        for (const n of step.nextSteps) {
          connectedNodes.add(n);
          connectedEdges.add(`${step.initialIndex}-${n}`);
        }
      } else if (step.nextSteps.includes(selectedIndex)) {
        connectedNodes.add(step.initialIndex);
        connectedEdges.add(`${step.initialIndex}-${selectedIndex}`);
      }
    }
  }

  return (
    <div className={styles.container}>
      <div
        ref={viewportRef}
        className={styles.viewport}
        data-cy="diagram"
        onMouseDown={onCanvasMouseDown}
      >
        <div
          className={styles.world}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        >
          <svg
            className={styles.edges}
            width={bound}
            height={bound}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <marker
                id="wf-arrowhead"
                markerWidth="15"
                markerHeight="15"
                refX="12"
                refY="6"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,0 L13,6 L0,12 Z" fill={ARROW_COLOR} />
              </marker>
            </defs>
            {arrows.map((a) => {
              const incident = connectedEdges.has(a.id);
              const dimmed = hasSelection && !incident;
              return (
                <line
                  key={a.id}
                  x1={a.x1}
                  y1={a.y1}
                  x2={a.x2}
                  y2={a.y2}
                  stroke={ARROW_COLOR}
                  strokeWidth={incident ? 2.5 : 1.5}
                  opacity={dimmed ? 0.12 : 1}
                  markerEnd="url(#wf-arrowhead)"
                />
              );
            })}
          </svg>

          {steps.map((step) => (
            <Block
              key={step.initialIndex}
              step={step}
              selected={step.initialIndex === selectedIndex}
              dimmed={hasSelection && !connectedNodes.has(step.initialIndex)}
              onPointerDown={onBlockPointerDown}
              onSelect={onSelectBlock}
              onSize={onSize}
            />
          ))}
        </div>

        <div className={styles.zoomControls}>
          <button
            type="button"
            data-cy="zoom-in"
            aria-label="Приблизить"
            onClick={() => zoomByButton(1.2)}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-cy="zoom-out"
            aria-label="Отдалить"
            onClick={() => zoomByButton(1 / 1.2)}
          >
            <i className="fa-solid fa-minus" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-cy="zoom-fit"
            aria-label="Вписать"
            onClick={() => {
              fittedRef.current = true;
              fitToContent();
            }}
          >
            <i className="fa-solid fa-expand" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
