// Match each query word as a subsequence, preferring compact, contiguous matches.
export default function fuzzyScore(text, query) {
  text = text.toLocaleLowerCase();

  const contiguous = text.indexOf(query);

  if (contiguous !== -1) {
    return 1000 - contiguous / (text.length + 1);
  }

  let position = -1;
  let first = -1;
  let gaps = 0;

  for (const character of query) {
    const next = text.indexOf(character, position + 1);

    if (next === -1) {
      return -Infinity;
    }

    if (first === -1) {
      first = next;
    } else {
      gaps += next - position - 1;
    }

    position = next;
  }

  return 100 - gaps - first / (text.length + 1);
}
