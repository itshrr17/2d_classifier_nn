// Log panel: override console.log to also print to logPanel
const logPanel = document.getElementById('logPanel');
if (logPanel) {
  const origLog = console.log;
  console.log = function(...args) {
    origLog.apply(console, args);
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
    const line = document.createElement('div');
    line.textContent = msg;
    logPanel.appendChild(line);
    logPanel.scrollTop = logPanel.scrollHeight;
  };
}

import { state, colorMapping } from './db.js';
import { NeuralNetwork } from './model/best.js'
import { encodeLabels } from './utils.js';

function trainTestSplit(X, Y, testRatio = 0.25) {
    const N = X.length;
    const testSize = Math.floor(N * testRatio);

    // Shuffle indices
    const indices = Array.from({length: N}, (_, i) => i);
    for (let i = N-1; i>0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const X_train = [], X_test = [];
    const Y_train = [], Y_test = [];

    indices.forEach((idx, i) => {
        if (i < testSize) {
            X_test.push(X[idx]);
            Y_test.push(Y[idx]);
        } else {
            X_train.push(X[idx]);
            Y_train.push(Y[idx]);
        }
    });

    return {X_train, X_test, Y_train, Y_test};
}

const progress = document.getElementById("trainProgress");

document.getElementById('trainBtn').addEventListener('click', async() => {
  if(state.samplePoints.length === 0) return;
  let X = [], Y = [];
  const data = state.samplePoints.filter(p => p.label); // drop unlabled points

  data.forEach(p => {
    X.push([p.x, p.y]);
    Y.push(p.label);
  });

  const X_norm = X;
  const encoded = encodeLabels(Y);

  const { oneHot, classes } = encoded;

  // Split into training and testing sets (80-20 split)
  const { X_train, X_test, Y_train, Y_test } = trainTestSplit(X_norm, oneHot);

  const inputSize = 2;                // (x, y)
  const outputSize = classes.length;  //

  // Initialize and train the neural network
  const nn = new NeuralNetwork(inputSize, state.hiddenLayers, outputSize, 0.1); // 2 inputs, 10 hidden neurons, 5 classes
  nn.encodedData = encoded;

  // update UI with model info
  updateModelInfo(nn);

  const epoch = parseInt(document.getElementById("epoch").value) || 100;
  const accuracyEle = document.getElementById('acc')
  const lossEle = document.getElementById('loss')
  
  await nn.train(X_train, Y_train, epoch, (epoch, epochs, acc, loss) => {
      const percent = Math.floor((epoch / epochs) * 100);
      progress.value = percent;
      console.log(`Epoch ${epoch}/${epochs} - Acc: ${acc}% - Loss: ${loss}`);
      accuracyEle.innerText = acc + " %";
      lossEle.innerText = loss;
  });

  state.trainingAccuracy = nn.accuracy(X_train, Y_train).toFixed(2) + " %";
  state.testAccuracy = nn.accuracy(X_test, Y_test).toFixed(2) + " %";

  // Evaluate accuracy
  console.log("Training Accuracy:", state.trainingAccuracy);
  console.log("Test Accuracy:", state.testAccuracy);

  state.currentModel = nn;
  state.models.push({ model: nn, trainingAccuracy: state.trainingAccuracy, testAccuracy: state.testAccuracy });
});

function hideDecisionBoundary() {
    const canvas = document.getElementById("decisionBoundary");
    canvas.style.display = 'none';
    canvas.style.zIndex = '-1';
}

let isDrawing = false;

async function drawDecisionBoundary(nn, encodeResult, blockSize = 4) {
    if (isDrawing) return;
    isDrawing = true;

    const canvas = document.getElementById("decisionBoundary");
    canvas.style.display = 'block';
    canvas.style.zIndex = '10';
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    try {
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                const input = [[(x + blockSize/2) / width, (y + blockSize/2) / height]];
                const predIdx = await nn.predict(input)[0];
                const classLabel = encodeResult.classes[predIdx];
                const rgbStr = Object.keys(colorMapping).find(key => colorMapping[key] === classLabel) || "255,255,255";
                const [r, g, b] = rgbStr.split(',').map(Number);
                ctx.fillStyle = `rgba(${r},${g},${b},0.24)`;
                ctx.fillRect(x, y, blockSize, blockSize);
            }
            // Yield to UI every row
            if (y % 32 === 0) await new Promise(r => setTimeout(r, 0));
        }
    } finally {
        isDrawing = false;
    }
}

// Toggle decision boundary overlay
let boundaryVisible = false;
document.getElementById('decisionBoundaryBtn').addEventListener('click', () => {
  if (!state.currentModel || !state.currentModel.encodedData || isDrawing) return;

  boundaryVisible = !boundaryVisible;

  if (boundaryVisible) {
    const blockSize = parseInt(document.getElementById('blockSize').value)
    drawDecisionBoundary(state.currentModel, state.currentModel.encodedData, blockSize);
    document.getElementById('decisionBoundaryBtn').innerText = 'Hide Decision Boundary';
  } else {
    hideDecisionBoundary();
    document.getElementById('decisionBoundaryBtn').innerText = 'Show Decision Boundary';
  }
});


function updateModelInfo(nn) {
  document.getElementById("outputSize").textContent = nn.encodedData.classes.length;
}

function renderHiddenLayers() {
  const list = document.getElementById('hiddenLayersList');
  list.innerHTML = '';
  let prevSize = 2; // input size (x, y)
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
      renderHiddenLayers(); // re-render to update sizes
    };

    const removeBtn = document.createElement('span');
    removeBtn.textContent = '( x )';
    removeBtn.classList.add('removeLayerBtn')
    removeBtn.onclick = () => {
      state.hiddenLayers.splice(idx, 1);
      renderHiddenLayers();
    };

    div.appendChild(document.createTextNode(`ReLU: `));
    div.appendChild(input);
    if (state.hiddenLayers.length > 1) div.appendChild(removeBtn);

    // Layer size info
    const sizeInfo = document.createElement('div');
    sizeInfo.classList.add('size-info')
    sizeInfo.textContent = `(${prevSize} × ${size})`;
    prevSize = size;

    // Wrapper for input and size info
    const wrapper = document.createElement('div');
    wrapper.appendChild(div);
    wrapper.appendChild(sizeInfo);

    list.appendChild(wrapper);
  });

  // Output layer size info
  // Try to get output size from current model, else fallback to 3
  let outputSize = state.outputSize;;
  if (state.currentModel && state.currentModel.W) {
    outputSize = state.currentModel.W[state.currentModel.W.length - 1][0].length;
  } else if (state.samplePoints && state.samplePoints.length > 0) {
    // Estimate from unique labels
    const labels = [...new Set(state.samplePoints.filter(p => p.label).map(p => p.label))];
    outputSize = labels.length;
  }

  document.getElementById('outputPrevSize').innerText = prevSize;
  document.getElementById('outputSize').innerText = outputSize;
}

document.getElementById('addLayerBtn').onclick = () => {
  if(state.hiddenLayers.length >= 5) return; // max 5 hidden layers
  state.hiddenLayers.push(10); // default size
  state.hiddenLayers = state.hiddenLayers.map(n => n);
  renderHiddenLayers();
  document.getElementById('hiddenLayersList').scrollTop = document.getElementById('hiddenLayersList').scrollHeight;
};

renderHiddenLayers();
