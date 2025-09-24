// Main app logic: wires together all modules
import { state } from './app/state.js';
import { encodeLabels } from './utils/labelEncoding.js';
import { trainTestSplit } from './utils/trainTestSplit.js';
import { setupLogPanel } from './app/log.js';
import { setupBrushEvents } from './canvas/brush.js';
import { sampleCanvas } from './canvas/sample.js';
import { setupPredictionLabel } from './canvas/predictionLabel.js';
import { drawDecisionBoundary, hideDecisionBoundary } from './canvas/decisionBoundary.js';
import { NeuralNetwork } from './model/neuralNetwork.js';
import { updateModelInfo, renderHiddenLayers } from './app/ui.js';

// Setup log panel
setupLogPanel('logPanel');

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
setupBrushEvents(canvas, ctx);
setupPredictionLabel(canvas, getColorFromPrediction);

// Populate button
const populateBtn = document.getElementById('populate');
populateBtn.addEventListener('click', () => {
  const numSamples = 100;
  const samples = sampleCanvas(ctx, numSamples);
  state.samplePoints = state.samplePoints.concat(samples);
  // ...update UI, log, etc.
  const labels = {};
  state.samplePoints.forEach(p => labels[p.label] = (labels[p.label] || 0) + 1);
  const text = Object.entries(labels)
    .map(([k, v]) => `${k}: ${(v / state.samplePoints.length * 100).toFixed(2)}%`)
    .join(', ');
  document.getElementById('classesCount').textContent = text || 'No data';
  document.getElementById('outputSize').innerText = Object.keys(labels).length - 1;
  console.log('Class distribution:', labels);
  console.log(`Sampled ${samples.length} points. Total samples: ${state.samplePoints.length}`);
});

// Clear button
const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const boundaryCanvas = document.getElementById('decisionBoundary');
  if (boundaryCanvas) {
    const bctx = boundaryCanvas.getContext('2d');
    bctx.clearRect(0, 0, boundaryCanvas.width, boundaryCanvas.height);
    boundaryCanvas.style.display = 'none';
    boundaryCanvas.style.zIndex = '-1';
  }
  state.hasPainted = false;
  state.samplePoints = [];
  const classesCount = document.getElementById('classesCount');
  if (classesCount) classesCount.textContent = 'No data';
  const outputSize = document.getElementById('outputSize');
  if (outputSize) outputSize.textContent = '0';
  console.log('Canvas and overlays cleared.');
});

// Prediction mode toggle
const predictionModeBtn = document.getElementById('predictionMode');
predictionModeBtn.addEventListener('click', () => {
  if (!state.currentModel) return;
  state.predictionMode = !state.predictionMode;
  predictionModeBtn.innerText = state.predictionMode ? 'Prediction: ON' : 'Prediction: OFF';
});

// Decision boundary toggle
let boundaryVisible = false;
const decisionBoundaryBtn = document.getElementById('decisionBoundaryBtn');
decisionBoundaryBtn.addEventListener('click', () => {
  if (!state.currentModel || !state.currentModel.encodedData) return;
  boundaryVisible = !boundaryVisible;
  if (boundaryVisible) {
    const blockSize = parseInt(document.getElementById('blockSize').value);
    drawDecisionBoundary(state.currentModel, state.currentModel.encodedData, blockSize);
    decisionBoundaryBtn.innerText = 'Hide Decision Boundary';
  } else {
    hideDecisionBoundary();
    decisionBoundaryBtn.innerText = 'Show Decision Boundary';
  }
});

// Training
const progress = document.getElementById('trainProgress');
const trainBtn = document.getElementById('trainBtn');

trainBtn.addEventListener('click', async () => {
  if (state.samplePoints.length === 0) return;
  const data = state.samplePoints.filter(p => p.label);
  const X = data.map(p => [p.x, p.y]);
  const Y = data.map(p => p.label);
  const encoded = encodeLabels(Y);
  const { oneHot, classes } = encoded;
  const { X_train, X_test, Y_train, Y_test } = trainTestSplit(X, oneHot);
  const inputSize = 2;
  const outputSize = classes.length;
  const nn = new NeuralNetwork(inputSize, state.hiddenLayers, outputSize, 0.1);
  nn.encodedData = encoded;
  updateModelInfo(nn);
  const epoch = parseInt(document.getElementById('epoch').value) || 100;
  const accuracyEle = document.getElementById('acc');
  const lossEle = document.getElementById('loss');
  await nn.train(X_train, Y_train, epoch, (ep, epochs, acc, loss) => {
    const percent = Math.floor((ep / epochs) * 100);
    progress.value = percent;
    console.log(`Epoch ${ep}/${epochs} - Acc: ${acc}% - Loss: ${loss}`);
    accuracyEle.innerText = acc + ' %';
    lossEle.innerText = loss;
  });
  state.trainingAccuracy = nn.accuracy(X_train, Y_train).toFixed(2) + ' %';
  state.testAccuracy = nn.accuracy(X_test, Y_test).toFixed(2) + ' %';
  console.log('Training Accuracy:', state.trainingAccuracy);
  console.log('Test Accuracy:', state.testAccuracy);
  state.currentModel = nn;
  state.models.push({ model: nn, trainingAccuracy: state.trainingAccuracy, testAccuracy: state.testAccuracy });
});

// Layer controls
const addLayerBtn = document.getElementById('addLayerBtn');
addLayerBtn.onclick = () => {
  if (state.hiddenLayers.length >= 5) return;
  state.hiddenLayers.push(10);
  state.hiddenLayers = state.hiddenLayers.map(n => n);
  renderHiddenLayers();
  document.getElementById('hiddenLayersList').scrollTop = document.getElementById('hiddenLayersList').scrollHeight;
};
renderHiddenLayers();

// Helper for prediction label
function getColorFromPrediction(predIndex, encodeResult) {
  return encodeResult.classes[predIndex];
}

function makeInputScrollable(input) {
  input.addEventListener("wheel", e => {
    e.preventDefault(); // prevent page scroll

    let step = parseFloat(input.step) || 1;
    let decimals = (step.toString().split(".")[1] || "").length; // number of decimals
    let min = parseFloat(input.min) || 0;
    let max = parseFloat(input.max) || 100;
    let value = parseFloat(input.value) || min;

    if (e.deltaY < 0) value += step; // scroll up → increase
    else value -= step;               // scroll down → decrease

    value = Math.min(Math.max(value, min), max); // clamp
    input.value = value.toFixed(decimals);       // format to step decimals
  });
}

makeInputScrollable(document.getElementById("learningRateInput"));
makeInputScrollable(document.getElementById("epoch"));
makeInputScrollable(document.getElementById("blockSize"));