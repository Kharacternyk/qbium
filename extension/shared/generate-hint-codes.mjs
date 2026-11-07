export default function generateHintCodes(count, alphabet) {
  if (alphabet.length < 2 || new Set(alphabet).size !== alphabet.length) {
    throw new Error("Hint keys must contain at least two distinct characters");
  }

  const width = Math.max(
    1,
    Math.ceil(Math.log(count) / Math.log(alphabet.length)),
  );

  return Array.from(
    {
      length: count,
    },
    (_, index) => {
      let code = "";

      for (let digit = 0; digit < width; digit++) {
        code = alphabet[index % alphabet.length] + code;
        index = Math.floor(index / alphabet.length);
      }

      return code;
    },
  );
}
