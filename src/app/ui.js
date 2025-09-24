// UI helpers for updating model info, layers, etc.
import { state } from './state.js';

export function updateModelInfo(nn) {
  document.getElementById('outputSize').textContent = nn.encodedData.classes.length;
}

export function renderHiddenLayers() {
  const list = document.getElementById('hiddenLayersList');
  list.innerHTML = '';
  let prevSize = 2;
  state.hiddenLayers.forEach((size, idx) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    const input = document.createElement('input');
    input.type = 'number';
    input.value = size;
    input.min = 1;
    input.onchange = (e) => {
      state.hiddenLayers[idx] = parseInt(e.target.value) || 1;
      renderHiddenLayers();
    };
    const removeBtn = document.createElement('span');
    removeBtn.textContent = '( x )';
    removeBtn.classList.add('removeLayerBtn');
    removeBtn.onclick = () => {
      state.hiddenLayers.splice(idx, 1);
      renderHiddenLayers();
    };
    div.appendChild(document.createTextNode(`ReLU: `));
    div.appendChild(input);
    if (state.hiddenLayers.length > 1) div.appendChild(removeBtn);
    const sizeInfo = document.createElement('div');
    sizeInfo.classList.add('size-info');
    sizeInfo.textContent = `(${prevSize} × ${size})`;
    prevSize = size;
    const wrapper = document.createElement('div');
    wrapper.appendChild(div);
    wrapper.appendChild(sizeInfo);
    list.appendChild(wrapper);
  });
  let outputSize = state.outputSize;
  if (state.currentModel && state.currentModel.W) {
    outputSize = state.currentModel.W[state.currentModel.W.length - 1][0].length;
  } else if (state.samplePoints && state.samplePoints.length > 0) {
    const labels = [...new Set(state.samplePoints.filter(p => p.label).map(p => p.label))];
    outputSize = labels.length;
  }
  document.getElementById('outputPrevSize').innerText = prevSize;
  document.getElementById('outputSize').innerText = outputSize;
}
