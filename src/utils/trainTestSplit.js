// Utility: Train/Test Split
export function trainTestSplit(X, Y, testRatio = 0.25) {
  const N = X.length;
  const testSize = Math.floor(N * testRatio);
  const indices = Array.from({ length: N }, (_, i) => i);
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const X_train = [], X_test = [], Y_train = [], Y_test = [];
  indices.forEach((idx, i) => {
    if (i < testSize) {
      X_test.push(X[idx]);
      Y_test.push(Y[idx]);
    } else {
      X_train.push(X[idx]);
      Y_train.push(Y[idx]);
    }
  });
  return { X_train, X_test, Y_train, Y_test };
}
