// Canvas sampling logic
import { COLOR_MAPPING } from '../app/state.js';

export function sampleCanvas(ctx, numSamples) {
  const samples = [];
  const { width, height } = ctx.canvas;
  let i = 0;
  while (i < numSamples) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const data = ctx.getImageData(x, y, 1, 1).data;
    const color = `${data[0]},${data[1]},${data[2]},${data[3]}`;
    if (COLOR_MAPPING[color] === undefined) continue;
    samples.push({ x: x / width, y: y / height, label: COLOR_MAPPING[color] });
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    i++;
  }
  return samples;
}
