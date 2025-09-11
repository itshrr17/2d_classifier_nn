export class NeuralNetwork {
  constructor(inputSize, hiddenSize, outputSize, lr=0.1) {
    this.W1 = math.random([inputSize, hiddenSize], -0.5, 0.5);
    this.b1 = math.zeros([1, hiddenSize]);
    this.W2 = math.random([hiddenSize, outputSize], -0.5, 0.5);
    this.b2 = math.zeros([1, outputSize]);
    this.lr = lr;
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
    this.z1 = math.add(math.multiply(X, this.W1), this.b1); // [m, hiddenSize]
    this.a1 = this.relu(this.z1); // [m, hiddenSize]
    this.z2 = math.add(math.multiply(this.a1, this.W2), this.b2); // [m, outputSize]
    this.a2 = this.softmax(this.z2); // [m, outputSize]
    return this.a2;
  }

  backward(X, y) {
    const m = X.length;

    // Output layer gradient
    const dz2 = math.subtract(this.a2, y); // [m, outputSize]
    const dW2 = math.multiply(math.transpose(this.a1), dz2).map(row => row.map(v => v / m));
    const db2 = math.mean(dz2, 0); // [1, outputSize]

    // Hidden layer gradient
    const dz1 = math.dotMultiply(
      math.multiply(dz2, math.transpose(this.W2)), // [m, hiddenSize]
      this.reluDeriv(this.z1) // [m, hiddenSize]
    );
    const dW1 = math.multiply(math.transpose(X), dz1).map(row => row.map(v => v / m));
    const db1 = math.mean(dz1, 0); // [1, hiddenSize]

    // Update weights
    this.W1 = math.subtract(this.W1, math.multiply(dW1, this.lr));
    this.b1 = math.subtract(this.b1, math.multiply(db1, this.lr));
    this.W2 = math.subtract(this.W2, math.multiply(dW2, this.lr));
    this.b2 = math.subtract(this.b2, math.multiply(db2, this.lr));
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
