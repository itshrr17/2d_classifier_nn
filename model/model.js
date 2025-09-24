
export class NeuralNetwork {
 constructor(inputSize, hiddenSizes, outputSize, lr=0.1) {
    // hiddenSizes: array of sizes, e.g. [16, 32]
    this.lr = lr;
    this.encodedData = null;

    // Layer sizes: [input, ...hidden, output]
    this.sizes = [inputSize, ...hiddenSizes, outputSize];

    // Initialize weights and biases for each layer
    this.W = [];
    this.b = [];
    for (let i = 0; i < this.sizes.length - 1; i++) {
      this.W.push(math.random([this.sizes[i], this.sizes[i+1]], -0.5, 0.5));
      this.b.push(math.zeros([1, this.sizes[i+1]]));
    }
  }

  // ReLU and derivative
  relu(x) {
    // x is [m, hiddenSize]
    return x.map(row => row.map(v => Math.max(0, v)));
  }

  reluDeriv(x) {
    return x.map(row => row.map(v => v > 0 ? 1 : 0));
  }

  // Softmax for batch
  softmax(z) {
    return z.map(row => {
      const max = Math.max(...row);
      const exps = row.map(v => Math.exp(v - max)); // numerical stability
      const sum = exps.reduce((a,b)=>a+b,0);
      return exps.map(v => v / sum);
    });
  }


  forward(X) {
    this.z = [];
    this.a = [X];
    // Forward through all hidden layers
    for (let i = 0; i < this.W.length - 1; i++) {
      const z = math.add(math.multiply(this.a[i], this.W[i]), this.b[i]);
      this.z.push(z);
      this.a.push(this.relu(z));
    }
    // Output layer
    const z = math.add(math.multiply(this.a[this.a.length - 1], this.W[this.W.length - 1]), this.b[this.b.length - 1]);
    this.z.push(z);
    this.a.push(this.softmax(z));
    return this.a[this.a.length - 1];
  }

  backward(X, y) {
    const m = X.length;
    const L = this.W.length;
    let dz = [];
    let dW = [];
    let db = [];

    // Output layer gradient
    dz[L] = math.subtract(this.a[L], y); // [m, outputSize]

    // Backpropagate through layers
    for (let l = L - 1; l >= 0; l--) {
      dW[l] = math.multiply(math.transpose(this.a[l]), dz[l+1]).map(row => row.map(v => v / m));
      // db[l] = math.mean(dz[l+1], 0);
      db[l] = [math.mean(dz[l+1], 0)];

      if (l > 0) {
        const da = math.multiply(dz[l+1], math.transpose(this.W[l]));
        dz[l] = math.dotMultiply(da, this.reluDeriv(this.z[l-1]));
      }
    }

    // Update weights and biases
    for (let l = 0; l < L; l++) {
      this.W[l] = math.subtract(this.W[l], math.multiply(this.lr, dW[l]));
      this.b[l] = math.subtract(this.b[l], math.multiply(this.lr, db[l]));
    }
  }

  async train(X, y, epochs = 1000, onProgress = null) {
    for (let epoch = 0; epoch < epochs; epoch++) {
        this.forward(X);
        this.backward(X, y);

        // call onProgress every few epochs OR on the last epoch
        if (onProgress && (epoch % Math.ceil(epochs / 100) === 0 || epoch === epochs - 1)) {
            const acc = this.accuracy(X, y).toFixed(2);
            onProgress(epoch + 1, epochs, acc); // note: epoch+1 for 1-based
            await new Promise(resolve => setTimeout(resolve, 0)); // allow UI update
        }
    }
}

  predict(X) {
    const probs = this.forward(X);
    return probs.map(row => row.indexOf(Math.max(...row)));
  }

  predictWithConfidence(X) {
    const probs = this.forward(X);
    return probs.map(row => {
      const maxProb = Math.max(...row);
      return {
        class: row.indexOf(maxProb),
        confidence: (maxProb * 100).toFixed(2) // %
      };
    });
  }

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
