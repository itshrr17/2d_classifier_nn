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
    let samples = [];
    let { width, height } = ctx.canvas;

    for (let i = 0; i < numSamples; i++) {
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);

        let pixel = ctx.getImageData(x, y, 1, 1).data; // [r,g,b,a]

        // Ignore if transparent
        if (pixel[3] === 0) continue;

        let color = "black";
        let colorCode = `${pixel[0]},${pixel[1]},${pixel[2]}`;

        // Save sample data
        samples.push({
            x: x / width,   // normalize to [0,1] for NN
            y: y / height,  // normalize to [0,1] for NN
            label: colorMapping[colorCode],
        });

        // Draw a small dot at sampled location
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2); // radius 4px for sample point
        ctx.fill();
    }

    return samples;
}

document.getElementById("populate").addEventListener("click", () => {
    const numSamples = 100; // Number of points to sample
    const samples = sampleCanvas(ctx, numSamples);
    state.samplePoints = state.samplePoints.concat(...samples);
    console.log(`Sampled ${samples.length} points. Total samples: ${state.samplePoints.length}`);
});

document.getElementById("clearBtn").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    state.hasPainted = false;
    state.samplePoints = [];
    console.log("Canvas cleared.");
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


makeInputScrollable(document.getElementById("hiddenSizeInput"));
makeInputScrollable(document.getElementById("learningRateInput"));