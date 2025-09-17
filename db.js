let initialState = {
    hasPainted: false,
    painting: false,
    brushSize: 100,
    brushColor: "Red",
    samplePoints: [],
    models: [],
    currentModel: null,
    trainingAccuracy: 0,
    testAccuracy: 0
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
    "255,0,0": "Red",
    "0,0,255": "Blue",
    "0,128,0": "Green",
    "128,0,128": "Purple",
    "255,165,0": "Orange",
    "255,255,0": "Yellow"
}


export { state, colors, colorMapping };