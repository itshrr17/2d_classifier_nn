import { state, colors, colorMapping } from "./db.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {
    willReadFrequently: true // optimize for frequent read operations
});

const minBrushSize = 70;
const maxBrushSize = 200;

// coords
let lastX, lastY;

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
        state.brushSize = Math.min(state.brushSize + 5, maxBrushSize);
    } else {
        state.brushSize = Math.max(state.brushSize - 5, minBrushSize);
    }
    console.log("Brush size:", state.brushSize);
});
canvas.addEventListener("mousedown", (e) => {
    state.painting = true;
    state.brushColor =  colors[colors.indexOf(state.brushColor) + 1] || colors[0];
    console.log("Brush color:", state.brushColor);
    [lastX, lastY] = getPos(e);
});

canvas.addEventListener("mouseup", () => state.painting = false);
canvas.addEventListener("mouseout", () => state.painting = false);

canvas.addEventListener("mousemove", (e) => {
    if (!state.painting) return;
    
    let [x, y] = getPos(e);
    ctx.strokeStyle = state.brushColor;
    ctx.lineWidth = state.brushSize;
    ctx.lineCap = "round";   // smooth edges
    ctx.lineJoin = "round";  // smooth corners

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    [lastX, lastY] = [x, y]; // update
    state.hasPainted = true;
});

function getPos(e) {
    let rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
}

function sampleCanvas(ctx, numSamples) {
    const samples = [];
    const { width, height } = ctx.canvas;

    let i = 0;

    while(i < numSamples) {
        // generate random (x, y)
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);

        const data = ctx.getImageData(x, y, 1, 1).data;
        const r = data[0], g = data[1], b = data[2], a = data[3];

        const color = `${r},${g},${b},${a}`;

        // ignore unknown colors
        if(colorMapping[color] === undefined) continue;
        
        const point = { 
            x: x / width,
            y: y / height,
            label: colorMapping[color]
        }

        samples.push(point);


        // Draw a small dot at sampled location
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2); // radius 4px for sample point
        ctx.fill();
        i++;
    }

    return samples;
}


export function hideDecisionBoundary() {
    const canvas = document.getElementById("decisionBoundary");
    canvas.style.display = 'none';
    canvas.style.zIndex = '-1';
}

export async function drawDecisionBoundary(nn, encodeResult, blockSize = state.blockSize) {
    const canvas = document.getElementById("decisionBoundary");
    canvas.style.display = 'block';
    canvas.style.zIndex = '10';
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    for (let y = 0; y < height; y += blockSize) {
        for (let x = 0; x < width; x += blockSize) {
            const input = [[(x + blockSize/2) / width, (y + blockSize/2) / height]];
            const predIdx = nn.predict(input)[0];
            const classLabel = encodeResult.classes[predIdx];
            const rgbStr = Object.keys(colorMapping).find(
                key => colorMapping[key] === classLabel
            ) || "255,255,255";
            const [r, g, b] = rgbStr.split(',').map(Number);
            ctx.fillStyle = `rgba(${r},${g},${b},0.24)`;
            ctx.fillRect(x, y, blockSize, blockSize);
        }
        // Yield to UI every row
        if (y % 32 === 0) await new Promise(r => setTimeout(r, 0));
    }
}

document.getElementById("populate").addEventListener("click", () => {
    const numSamples = 100; // Number of points to sample
    const samples = sampleCanvas(ctx, numSamples);
    state.samplePoints = state.samplePoints.concat(...samples);

    const labels = {};
    state.samplePoints.forEach(p => labels[p.label]++ || (labels[p.label] = 1));
    const text = Object.entries(labels).map(([k,v]) => `${k}: ${(v / state.samplePoints.length * 100).toFixed(2)}%`).join(', ');
    document.getElementById("classesCount").textContent = text || 'No data';

    console.log("Class distribution:", labels);

    console.log(`Sampled ${samples.length} points. Total samples: ${state.samplePoints.length}`);
    console.log(state.samplePoints);
});

document.getElementById("clearBtn").addEventListener("click", () => {
    // Clear main canvas
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
    // Optionally reset other UI elements
    const classesCount = document.getElementById("classesCount");
    if (classesCount) classesCount.textContent = 'No data';
    const outputSize = document.getElementById("outputSize");
    if (outputSize) outputSize.textContent = '0';
    // Log
    console.log("Canvas and overlays cleared.");
});

document.getElementById("predictionMode").addEventListener("click", () => {
    state.predictionMode = !state.predictionMode;
    const ele = document.getElementById("predictionMode");
    ele.innerText = state.predictionMode ? "Prediction: ON" : "Prediction: OFF";
});

// Given the encodeLabels output, get color by predicted class index
function getColorFromPrediction(predIndex, encodeResult) {
  return encodeResult.classes[predIndex];
}

canvas.addEventListener("mousemove", (e) => {
    if (!state.predictionMode) return;

    let [x, y] = getPos(e);
    
    const nn = state.currentModel;

    const pred = nn.predictWithConfidence([[x / 600, y / 600]])[0];
    const label = getColorFromPrediction(pred.class, nn.encodedData);
    console.log(x, y, label, pred.confidence);
});

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
