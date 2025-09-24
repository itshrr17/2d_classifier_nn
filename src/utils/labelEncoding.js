// Label encoding utility
export function encodeLabels(labels) {
  const unique = [...new Set(labels)];
  const map = Object.fromEntries(unique.map((c, i) => [c, i]));
  const oneHot = labels.map(label => {
    const arr = new Array(unique.length).fill(0);
    arr[map[label]] = 1;
    return arr;
  });
  return { oneHot, classes: unique, map };
}
