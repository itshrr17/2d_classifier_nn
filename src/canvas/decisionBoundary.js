// Decision boundary overlay logic
import { COLOR_MAPPING } from '../app/state.js';

let isDrawing = false;

export async function drawDecisionBoundary(nn, encodeResult, blockSize = 4) {
  if (isDrawing) return;
  isDrawing = true;
  const canvas = document.getElementById('decisionBoundary');
  canvas.style.display = 'block';
  canvas.style.zIndex = '10';
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const width = canvas.width, height = canvas.height;
  try {
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        const input = [[(x + blockSize / 2) / width, (y + blockSize / 2) / height]];
        const predIdx = await nn.predict(input)[0];
        const classLabel = encodeResult.classes[predIdx];
        const rgbStr = Object.keys(COLOR_MAPPING).find(key => COLOR_MAPPING[key] === classLabel) || '255,255,255';
        const [r, g, b] = rgbStr.split(',').map(Number);
        ctx.fillStyle = `rgba(${r},${g},${b},0.24)`;
        ctx.fillRect(x, y, blockSize, blockSize);
      }
      if (y % 32 === 0) await new Promise(r => setTimeout(r, 0));
    }
  } finally {
    isDrawing = false;
  }
}

export function hideDecisionBoundary() {
  const canvas = document.getElementById('decisionBoundary');
  canvas.style.display = 'none';
  canvas.style.zIndex = '-1';
}
