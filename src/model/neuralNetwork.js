// math.js must be loaded in the environment
// A simple fully-connected feedforward neural network for classification
// This class supports multiple hidden layers, ReLU activations, and softmax output
// All math operations use math.js (must be loaded in the environment)
export class NeuralNetwork {
  /**
   * Create a new neural network.
   * @param {number} inputSize - Number of input features (e.g. 2 for (x, y))
   * @param {number[]} hiddenSizes - Array of hidden layer sizes (e.g. [16, 32])
   * @param {number} outputSize - Number of output classes
   * @param {number} lr - Learning rate
   *
   * Math:
   * - Each layer l has weights W[l] and biases b[l].
   * - For input x, the output of layer l is: a[l] = activation(z[l]), where z[l] = a[l-1] * W[l-1] + b[l-1]
   * - For hidden layers, activation is ReLU; for output, activation is softmax.
   * - Weights are initialized with He initialization: N(0, sqrt(2/fan_in)) for stable gradients.
   */
  constructor(inputSize, hiddenSizes, outputSize, lr=0.1) {
    this.lr = lr; // learning rate
    this.encodedData = null; // for label encoding reference

    // Layer sizes: [input, ...hidden, output]
    this.sizes = [inputSize, ...hiddenSizes, outputSize];

    // Initialize weights and biases for each layer
    this.W = []; // weights
    this.b = []; // biases

    for (let i = 0; i < this.sizes.length - 1; i++) {
      // Simple ReLU weights initialization: small random values
      // this.W.push(math.random([this.sizes[i], this.sizes[i+1]], -0.01, 0.01));
      // this.b.push(math.random([1, this.sizes[i+1]], -0.01, 0.01));

      // He initialization for ReLU: weights ~ N(0, sqrt(2/fan_in))
      let std = Math.sqrt(2 / this.sizes[i]);
      this.W.push(math.multiply(math.random([this.sizes[i], this.sizes[i+1]], -1, 1), std));
      this.b.push(math.random([1, this.sizes[i+1]], -0.01, 0.01)); // small random bias
    }
  }

  // ReLU activation: max(0, x) for each element
  // Math: f(x) = max(0, x) (elementwise)
  relu(x) {
    return x.map(row => row.map(v => Math.max(0, v)));
  }

  // Derivative of ReLU: 1 if x > 0 else 0
  // Math: f'(x) = 1 if x > 0 else 0
  reluDeriv(x) {
    return x.map(row => row.map(v => v > 0 ? 1 : 0));
  }

  // Softmax activation for output layer: converts logits to probabilities
  // Math: softmax(z_i) = exp(z_i) / sum_j exp(z_j) for each class i
  // This ensures output is a probability distribution (sums to 1)
  softmax(z) {
    // For each row (sample), subtract max for numerical stability, then exponentiate and normalize
    return z.map(row => {
      const max = Math.max(...row);
      const exps = row.map(v => Math.exp(v - max));
      const sum = exps.reduce((a,b)=>a+b,0);
      return exps.map(v => v / sum);
    });
  }

  // Cross-entropy loss for classification
  // Math: L = -1/N sum_i sum_c y[i,c] * log(yPred[i,c])
  // yTrue: one-hot true labels, yPred: predicted probabilities
  crossEntropyLoss(yTrue, yPred) {
    const eps = 1e-12; // avoid log(0)
    return -math.mean(
      yTrue.map((row, i) =>
        row.reduce((sum, val, j) => sum + val * Math.log(yPred[i][j] + eps), 0)
      )
    );
  }

  /**
   * Forward pass: compute activations for all layers
   * @param {number[][]} X - Input data (batch of samples)
   * @returns {number[][]} Output probabilities for each sample
   *
   * Math:
   * - For each layer l:
   *   z[l] = a[l-1] * W[l-1] + b[l-1]
   *   a[l] = relu(z[l]) for hidden layers, softmax(z[L]) for output
   * - a[0] = X (input)
   */
  forward(X) {
    this.z = []; // pre-activations for each layer
    this.a = [X]; // activations for each layer (a[0] = input)
    // Forward through all hidden layers
    for (let i = 0; i < this.W.length - 1; i++) {
      // z = a*W + b
      const z = math.add(math.multiply(this.a[i], this.W[i]), this.b[i]);
      this.z.push(z);
      this.a.push(this.relu(z));
    }
    // Output layer: softmax
    const z = math.add(math.multiply(this.a[this.a.length - 1], this.W[this.W.length - 1]), this.b[this.b.length - 1]);
    this.z.push(z);
    this.a.push(this.softmax(z));
    return this.a[this.a.length - 1]; // output probabilities
  }

  /**
   * Backward pass: update weights and biases using gradients from loss
   * @param {number[][]} X - Input data
   * @param {number[][]} y - True one-hot labels
   *
   * Math:
   * - Uses backpropagation to compute gradients of loss w.r.t. weights and biases.
   * - For output layer: dL/dz = y_pred - y_true
   * - For hidden layers: dL/dz = (dL/da) * relu'(z)
   * - Weight update: W := W - lr * dW, b := b - lr * db
   */
  backward(X, y) {
    const m = X.length; // batch size
    const L = this.W.length; // number of layers
    let dz = []; // gradients of loss w.r.t. z
    let dW = []; // gradients of loss w.r.t. W
    let db = []; // gradients of loss w.r.t. b
    // Output layer gradient: dL/dz = y_pred - y_true
    dz[L] = math.subtract(this.a[L], y);
    // Backpropagate through all layers
    for (let l = L - 1; l >= 0; l--) {
      // dW = a^T * dz / m
      dW[l] = math.multiply(math.transpose(this.a[l]), dz[l+1]).map(row => row.map(v => v / m));
      // db = mean of dz across batch
      db[l] = [math.mean(dz[l+1], 0)];
      if (l > 0) {
        // da = dz * W^T
        const da = math.multiply(dz[l+1], math.transpose(this.W[l]));
        // dz = da * relu'(z)
        dz[l] = math.dotMultiply(da, this.reluDeriv(this.z[l-1]));
      }
    }
    // Gradient descent update for all weights and biases
    for (let l = 0; l < L; l++) {
      this.W[l] = math.subtract(this.W[l], math.multiply(this.lr, dW[l]));
      this.b[l] = math.subtract(this.b[l], math.multiply(this.lr, db[l]));
    }
  }

  /**
   * Train the neural network for a number of epochs
   * @param {number[][]} X - Training input data
   * @param {number[][]} y - Training one-hot labels
   * @param {number} epochs - Number of epochs
   * @param {function} onProgress - Optional callback for progress updates
   *
   * Math:
   * - For each epoch: do forward pass, backward pass, and update weights.
   * - Optionally report progress (accuracy/loss).
   */
  async train(X, y, epochs = 1000, onProgress = null) {
    for (let epoch = 0; epoch < epochs; epoch++) {
      const yPred = this.forward(X); // forward pass
      this.backward(X, y); // backward pass (update weights)
      // Optionally report progress
      if (onProgress && (epoch % Math.ceil(epochs / 100) === 0 || epoch === epochs - 1)) {
        const acc = this.accuracy(X, y).toFixed(2);
        const loss = this.crossEntropyLoss(y, yPred).toFixed(4);
        onProgress(epoch + 1, epochs, acc, loss);
        await new Promise(resolve => setTimeout(resolve, 0)); // yield to UI
      }
    }
  }

  /**
   * Predict class indices for input samples
   * @param {number[][]} X - Input data
   * @returns {number[]} Array of predicted class indices
   *
   * Math:
   * - For each sample, output the index of the largest probability from softmax.
   */
  predict(X) {
    const probs = this.forward(X);
    return probs.map(row => row.indexOf(Math.max(...row)));
  }

  /**
   * Predict class and confidence for input samples
   * @param {number[][]} X - Input data
   * @returns {Array<{class: number, confidence: string}>}
   *
   * Math:
   * - For each sample, output the index and value of the largest probability from softmax.
   */
  predictWithConfidence(X) {
    const probs = this.forward(X);
    return probs.map(row => {
      const maxProb = Math.max(...row);
      return {
        class: row.indexOf(maxProb),
        confidence: (maxProb * 100).toFixed(2) // percent
      };
    });
  }

  /**
   * Compute accuracy (percent correct) for given data and true labels
   * @param {number[][]} X - Input data
   * @param {number[][]} yTrue - True one-hot labels
   * @returns {number} Accuracy as a percent
   *
   * Math:
   * - For each sample, compare predicted class to true class (from one-hot).
   * - Accuracy = (number correct) / (total samples) * 100
   */
  accuracy(X, yTrue) {
    const probs = this.forward(X);
    let correct = 0;
    for (let i = 0; i < X.length; i++) {
      const pred = probs[i].indexOf(Math.max(...probs[i]));
      const trueLabel = yTrue[i].indexOf(1); // one-hot
      if (pred === trueLabel) correct++;
    }
    return (correct / X.length) * 100;
  }
}
