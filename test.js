import { encodeLabels } from './utils.js';
import { NeuralNetwork } from './model/model.js';
import { create, all } from 'mathjs';

const math = create(all);
global.math = math;


const X = [
  [0,0],
  [0,1],
  [1,0],
  [1,1]
];

const Y = [0,1,1,0];  // labels
const { oneHot } = encodeLabels(Y);

const nn = new NeuralNetwork(2, [4], 2, 0.1);
await nn.train(X, oneHot, 5000, (e, total, acc) => {
  if (e % 1000 === 0) console.log(`Epoch ${e}: ${acc}%`);
});

// Test predictions
console.log("Predictions:");
console.log("X =", X);
console.log("y_true =", Y);
console.log("y_pred =", nn.predict(X));