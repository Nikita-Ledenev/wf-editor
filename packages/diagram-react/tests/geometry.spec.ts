import { describe, expect, it } from 'vitest';
import { center, edgePoint, type Rect } from '../src/lib/geometry';

const rect: Rect = { x: 100, y: 100, w: 200, h: 100 }; // центр (200, 150)

describe('edgePoint', () => {
  it('возвращает центр, если цель совпадает с центром', () => {
    expect(edgePoint(rect, 200, 150)).toEqual({ x: 200, y: 150 });
  });

  it('точка выхода лежит на правой грани при цели справа', () => {
    const p = edgePoint(rect, 1000, 150);
    expect(p.x).toBeCloseTo(300); // правый край
    expect(p.y).toBeCloseTo(150);
  });

  it('точка выхода лежит на верхней грани при цели сверху', () => {
    const p = edgePoint(rect, 200, -500);
    expect(p.y).toBeCloseTo(100); // верхний край
    expect(p.x).toBeCloseTo(200);
  });

  it('точка всегда на границе прямоугольника', () => {
    const p = edgePoint(rect, 600, 400);
    const onVerticalEdge = Math.abs(p.x - 100) < 0.001 || Math.abs(p.x - 300) < 0.001;
    const onHorizontalEdge = Math.abs(p.y - 100) < 0.001 || Math.abs(p.y - 200) < 0.001;
    expect(onVerticalEdge || onHorizontalEdge).toBe(true);
  });
});

describe('center', () => {
  it('считает центр прямоугольника', () => {
    expect(center(rect)).toEqual({ x: 200, y: 150 });
  });
});
