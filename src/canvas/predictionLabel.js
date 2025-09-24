// Floating prediction label logic
import { state, COLOR_MAPPING } from '../app/state.js';

export function setupPredictionLabel(canvas, getColorFromPrediction) {
  let predLabelDiv = document.getElementById('predictionLabelDiv');
  if (!predLabelDiv) {
    predLabelDiv = document.createElement('div');
    predLabelDiv.id = 'predictionLabelDiv';
    predLabelDiv.style.display = 'none';
    document.body.appendChild(predLabelDiv);
  }
  canvas.addEventListener('mousemove', (e) => {
    if (!state.predictionMode) {
      predLabelDiv.style.display = 'none';
      return;
    }
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    const nn = state.currentModel;
    const pred = nn.predictWithConfidence([[x / 600, y / 600]])[0];
    const label = getColorFromPrediction(pred.class, nn.encodedData);
    const rgbStr = Object.keys(COLOR_MAPPING).find(key => COLOR_MAPPING[key] === label) || '255,255,255';
    const [r, g, b] = rgbStr.split(',').map(Number);
    predLabelDiv.textContent = `${label} (${pred.confidence}%)`;
    predLabelDiv.style.background = `rgba(${r},${g},${b},0.85)`;
    predLabelDiv.style.color = (r*0.299 + g*0.587 + b*0.114 > 186) ? '#222' : '#fff';
    predLabelDiv.style.left = (e.clientX + 16) + 'px';
    predLabelDiv.style.top = (e.clientY + 8) + 'px';
    predLabelDiv.style.display = 'block';
  });
  canvas.addEventListener('mouseleave', () => {
    predLabelDiv.style.display = 'none';
  });
}
