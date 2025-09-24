// Brush and canvas drawing logic
import { state, COLORS } from '../app/state.js';

export function setupBrushEvents(canvas, ctx) {
  let lastX, lastY;
  const minBrushSize = 70, maxBrushSize = 200;

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.brushSize = e.deltaY < 0 ?
        Math.min(state.brushSize + 5, maxBrushSize)
      : Math.max(state.brushSize - 5, minBrushSize);
    console.log('Brush size:', state.brushSize);
  });

  canvas.addEventListener('mousedown', (e) => {
    state.painting = true;
    state.brushColor = COLORS[(COLORS.indexOf(state.brushColor) + 1) % COLORS.length];
    console.log('Brush color:', state.brushColor);
    [lastX, lastY] = getCanvasPos(canvas, e);
  });

  canvas.addEventListener('mouseup', () => (state.painting = false));

  canvas.addEventListener('mouseout', () => (state.painting = false));

  canvas.addEventListener('mousemove', (e) => {
    if (!state.painting) return;
    let [x, y] = getCanvasPos(canvas, e);
    ctx.strokeStyle = state.brushColor;
    ctx.lineWidth = state.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
    state.hasPainted = true;
  });
}

export function getCanvasPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top];
}
