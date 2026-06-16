const NEUTRAL = '#9aa0a6';

/** Светлый ли цвет (по относительной яркости). Белый/почти белый → true. */
export function isLightColor(hex?: string): boolean {
  if (!hex) return false;
  const m = hex.replace('#', '');
  if (m.length !== 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.85;
}

/**
 * Цвет рамки/иконки для отрисовки. Белые блоки (цвет нового шага по умолчанию)
 * на светлом фоне были бы невидимы — заменяем на нейтральный серый.
 */
export function strokeColor(color?: string): string {
  if (!color) return NEUTRAL;
  return isLightColor(color) ? NEUTRAL : color;
}

/** Цвет текста поверх заливки цветом шага: тёмный на светлом, белый на тёмном. */
export function textOnFill(color?: string): string {
  return isLightColor(color) ? '#333333' : '#ffffff';
}
