// Convert Y to one-hot vectors
export function encodeLabels(Y) {
  const unique = [...new Set(Y)];
  const map = Object.fromEntries(unique.map((c, i) => [c, i]));

  const oneHot = Y.map(label => {
    const arr = new Array(unique.length).fill(0);
    arr[map[label]] = 1;
    return arr;
  });

  return { oneHot, classes: unique, map };
}