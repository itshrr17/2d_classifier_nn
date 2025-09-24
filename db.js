let initialState = {
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
    hiddenLayers: [64, 64, 64, 64], // default hidden layers
    outputSize: 0,   // default classes
    blockSize: 4,    // for decision boundary
}

const reactive = {
    brushSize: true,
    brushColor: true,
    samplePoints: true,
    trainingAccuracy: true,
    testAccuracy: true,
}

const state = new Proxy(initialState, {
    set(target, key, value) {
        target[key] = value;
        if(reactive[key]) document.getElementById(key).textContent = value instanceof Array ? value.length : value;
        return true;
    }
});

const colors = ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Yellow'];

const colorMapping = {  
    "255,0,0,255": "Red",
    "0,0,255,255": "Blue",
    "0,128,0,255": "Green",
    "128,0,128,255": "Purple",
    "255,165,0,255": "Orange",
    "255,255,0,255": "Yellow",
    "0,0,0,0": "Unlabled"  // white or transparent → unlabled
}


export { state, colors, colorMapping };

window.state = state; // for debugging