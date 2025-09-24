
// === Canvas Setup ===
import { state, colors, colorMapping } from "./db.js";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const minBrushSize = 70, maxBrushSize = 200;
let lastX, lastY;


// === Canvas Events ===
canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    state.brushSize = e.deltaY < 0
        ? Math.min(state.brushSize + 5, maxBrushSize)
        : Math.max(state.brushSize - 5, minBrushSize);
    console.log("Brush size:", state.brushSize);
});

canvas.addEventListener("mousedown", (e) => {
    state.painting = true;
    state.brushColor = colors[(colors.indexOf(state.brushColor) + 1) % colors.length];
    console.log("Brush color:", state.brushColor);
    [lastX, lastY] = getPos(e);
});

canvas.addEventListener("mouseup", () => (state.painting = false));
canvas.addEventListener("mouseout", () => (state.painting = false));

canvas.addEventListener("mousemove", (e) => {
    if (!state.painting) return;
    let [x, y] = getPos(e);
    ctx.strokeStyle = state.brushColor;
    ctx.lineWidth = state.brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
    state.hasPainted = true;
});

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
}

// === Sampling ===
function populateCanvas(ctx, numSamples) {
    const samples = [];
    const { width, height } = ctx.canvas;
    let i = 0;
    while (i < numSamples) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const data = ctx.getImageData(x, y, 1, 1).data;
        const color = `${data[0]},${data[1]},${data[2]},${data[3]}`;
        if (colorMapping[color] === undefined) continue;
        samples.push({ x: x / width, y: y / height, label: colorMapping[color] });
        // Draw a small dot at sampled location
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        i++;
    }
    return samples;
}

// === Populate Button ===
document.getElementById("populate").addEventListener("click", () => {
    const numSamples = 100;
    const samples = populateCanvas(ctx, numSamples);
    state.samplePoints = state.samplePoints.concat(samples);
    // Update class distribution
    const labels = {};
    state.samplePoints.forEach(p => labels[p.label] = (labels[p.label] || 0) + 1);
    const text = Object.entries(labels)
        .map(([k, v]) => `${k}: ${(v / state.samplePoints.length * 100).toFixed(2)}%`)
        .join(', ');
    document.getElementById("classesCount").textContent = text || 'No data';
    document.getElementById('outputSize').innerText = Object.keys(labels).length - 1;
    console.log("Class distribution:", labels);
    console.log(`Sampled ${samples.length} points. Total samples: ${state.samplePoints.length}`);
});

// === Clear Button ===
document.getElementById("clearBtn").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Clear decision boundary overlay if present
    const boundaryCanvas = document.getElementById("decisionBoundary");
    if (boundaryCanvas) {
        const bctx = boundaryCanvas.getContext("2d");
        bctx.clearRect(0, 0, boundaryCanvas.width, boundaryCanvas.height);
        boundaryCanvas.style.display = 'none';
        boundaryCanvas.style.zIndex = '-1';
    }
    // Reset state
    state.hasPainted = false;
    state.samplePoints = [];
    // Reset UI
    const classesCount = document.getElementById("classesCount");
    if (classesCount) classesCount.textContent = 'No data';
    const outputSize = document.getElementById("outputSize");
    if (outputSize) outputSize.textContent = '0';
    console.log("Canvas and overlays cleared.");
});

// === Prediction Mode Toggle ===
document.getElementById("predictionMode").addEventListener("click", () => {
    if (!state.currentModel) return;
    state.predictionMode = !state.predictionMode;
    const ele = document.getElementById("predictionMode");
    ele.innerText = state.predictionMode ? "Prediction: ON" : "Prediction: OFF";
});

// Given the encodeLabels output, get color by predicted class index
function getColorFromPrediction(predIndex, encodeResult) {
  return encodeResult.classes[predIndex];
}

// === Floating Prediction Label ===
let predLabelDiv = document.getElementById('predictionLabelDiv');
if (!predLabelDiv) {
    predLabelDiv = document.createElement('div');
    predLabelDiv.id = 'predictionLabelDiv';
    predLabelDiv.style.display = 'none';
    document.body.appendChild(predLabelDiv);
}

canvas.addEventListener("mousemove", (e) => {
    if (!state.predictionMode) {
        predLabelDiv.style.display = 'none';
        return;
    }
    let [x, y] = getPos(e);
    const nn = state.currentModel;
    const pred = nn.predictWithConfidence([[x / 600, y / 600]])[0];
    const label = getColorFromPrediction(pred.class, nn.encodedData);
    const rgbStr = Object.keys(colorMapping).find(key => colorMapping[key] === label) || "255,255,255";
    const [r, g, b] = rgbStr.split(',').map(Number);
    predLabelDiv.textContent = `${label} (${pred.confidence}%)`;
    predLabelDiv.style.background = `rgba(${r},${g},${b},0.85)`;
    predLabelDiv.style.color = (r*0.299 + g*0.587 + b*0.114 > 186) ? '#222' : '#fff';
    predLabelDiv.style.left = (e.clientX + 16) + 'px';
    predLabelDiv.style.top = (e.clientY + 8) + 'px';
    predLabelDiv.style.display = 'block';
});

canvas.addEventListener("mouseleave", () => {
    predLabelDiv.style.display = 'none';
});

// === Input Scroll Helper ===
function makeInputScrollable(input) {
    input.addEventListener("wheel", e => {
        e.preventDefault();
        let step = parseFloat(input.step) || 1;
        let decimals = (step.toString().split(".")[1] || "").length;
        let min = parseFloat(input.min) || 0;
        let max = parseFloat(input.max) || 100;
        let value = parseFloat(input.value) || min;
        if (e.deltaY < 0) value += step;
        else value -= step;
        value = Math.min(Math.max(value, min), max);
        input.value = value.toFixed(decimals);
    });
}
['learningRateInput', 'epoch', 'blockSize'].forEach(id => {
    const el = document.getElementById(id);
    if (el) makeInputScrollable(el);
});

