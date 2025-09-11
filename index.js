
import { state, colors } from './db.js';
import { NeuralNetwork } from './model/model.js'

// Map colors to indices
const colorToIndex = {};
colors.forEach((c, i) => colorToIndex[c] = i);

// Convert Y to one-hot vectors
function oneHotEncode(Y) {
    return Y.map(c => {
        const arr = new Array(colors.length).fill(0);
        arr[colorToIndex[c]] = 1;
        return arr;
    });
}

function trainTestSplit(X, Y, testRatio = 0.2) {
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
const log = document.getElementById("trainLog");
const btn = document.getElementById("trainBtn");

document.getElementById('trainBtn').addEventListener('click', async() => {
  let X = [], Y = [];
  const data = state.samplePoints.filter(p => p.label); // drop unlabled points

  data.forEach(p => {
    X.push([p.x, p.y]);
    Y.push(p.label);
  });

  // Normalize X coordinates (assuming canvas width & height)
  const X_norm = X.map(([x, y]) => [x / 600, y / 600]); // becasuse canvas size is 600 x 600

  const Y_onehot = oneHotEncode(Y);


  // Split into training and testing sets (80-20 split)

  const { X_train, X_test, Y_train, Y_test } = trainTestSplit(X_norm, Y_onehot);

  // Initialize and train the neural network
  const nn = new NeuralNetwork(2, 10, colors.length, 0.1); // 2 inputs, 10 hidden neurons, 5 classes
  
  await nn.train(X_train, Y_train, 1000, (epoch, epochs, acc) => {
      const percent = Math.floor((epoch / epochs) * 100);
      progress.value = percent;
      log.textContent = `Epoch ${epoch}/${epochs} - Accuracy: ${acc}%`;
  });

  log.innerText += "\n✅ Training complete!";

  state.trainingAccuracy = nn.accuracy(X_train, Y_train).toFixed(2) + " %";
  state.testAccuracy = nn.accuracy(X_test, Y_test).toFixed(2) + " %";

  // Evaluate accuracy
  console.log("Training Accuracy:", state.trainingAccuracy);
  console.log("Test Accuracy:", state.testAccuracy);

  state.currentModel = nn;
  state.models.push({ model: nn, trainingAccuracy: state.trainingAccuracy, testAccuracy: state.testAccuracy });
});

