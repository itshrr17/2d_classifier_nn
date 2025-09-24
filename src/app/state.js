// App state and color definitions
const INITIAL_STATE = {
  hasPainted: false,
  painting: false,
  brushSize: 100,
  brushColor: "Red",
  samplePoints: [],
  models: [],
  currentModel: null,
  trainingAccuracy: 0,
  testAccuracy: 0,
  predictionMode: false,
  hiddenLayers: [64, 64, 64, 64],
  outputSize: 0,
  blockSize: 4,
};

const REACTIVE_KEYS = {
  brushSize: true,
  brushColor: true,
  samplePoints: true,
  trainingAccuracy: true,
  testAccuracy: true,
};

const COLORS = ["Red", "Blue", "Green", "Purple", "Orange", "Yellow"];

const COLOR_MAPPING = {
  "255,0,0,255": "Red",
  "0,0,255,255": "Blue",
  "0,128,0,255": "Green",
  "128,0,128,255": "Purple",
  "255,165,0,255": "Orange",
  "255,255,0,255": "Yellow",
  "0,0,0,0": "Unlabled",
};

const state = new Proxy(INITIAL_STATE, {
  set(target, key, value) {
    target[key] = value;
    if (REACTIVE_KEYS[key]) {
      const el = document.getElementById(key);
      if (el) el.textContent = value instanceof Array ? value.length : value;
    }
    return true;
  }
});

export { state, COLORS, COLOR_MAPPING };
