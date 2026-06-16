import { strokeColor, textOnFill, type WorkflowStep } from '@wf/shared';
import { useLayoutEffect, useRef } from 'react';
import styles from './Diagram.module.scss';

interface Props {
  step: WorkflowStep;
  selected: boolean;
  dimmed: boolean;
  onPointerDown: (e: React.MouseEvent, step: WorkflowStep) => void;
  onSelect: (initialIndex: number) => void;
  onSize: (initialIndex: number, w: number, h: number) => void;
}

const HANDLES = ['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'] as const;

export default function Block({ step, selected, dimmed, onPointerDown, onSelect, onSize }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  // Видимая рамка/текст: белый блок (цвет нового шага) на светлом фоне иначе пропал бы.
  const stroke = strokeColor(step.color);

  // Сообщаем диаграмме реальные размеры блока, чтобы стрелки шли от его краёв.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (el) onSize(step.initialIndex, el.offsetWidth, el.offsetHeight);
  }, [step.initialIndex, step.name, onSize]);

  const blockStyle = selected
    ? { background: step.color || '#fff', color: textOnFill(step.color), borderColor: stroke }
    : { background: '#fff', color: stroke, borderColor: stroke };

  return (
    <div
      className={`${styles.blockWrap} ${dimmed ? styles.blockDimmed : ''}`}
      style={{ left: step.x, top: step.y }}
      data-cy="block"
      data-index={step.initialIndex}
      data-selected={selected ? 'true' : 'false'}
      data-dimmed={dimmed ? 'true' : 'false'}
      onMouseDown={(e) => onPointerDown(e, step)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(step.initialIndex);
      }}
    >
      <div
        ref={innerRef}
        className={`${styles.block} ${selected ? styles.blockSelected : ''}`}
        style={blockStyle}
      >
        {step.name}
      </div>

      {selected && (
        <div className={styles.marquee} aria-hidden="true">
          {HANDLES.map((h) => (
            <span key={h} className={`${styles.handle} ${styles[`handle_${h}`]}`} />
          ))}
        </div>
      )}
    </div>
  );
}
