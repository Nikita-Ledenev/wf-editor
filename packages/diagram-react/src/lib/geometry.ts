export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Точка на границе прямоугольника в направлении к (tx, ty). */
export function edgePoint(r: Rect, tx: number, ty: number): { x: number; y: number } {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = r.w / 2;
  const hh = r.h / 2;
  // Масштабируем направление до пересечения с ближайшей стороной.
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function center(r: Rect): { x: number; y: number } {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
