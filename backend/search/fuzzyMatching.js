import { normalizeSearchText } from "./textNormalizer.js";

function levenshtein(a = "", b = "") {
  const matrix = [];

  const aa = normalizeSearchText(a);
  const bb = normalizeSearchText(b);

  for (let i = 0; i <= bb.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aa.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bb.length; i++) {
    for (let j = 1; j <= aa.length; j++) {
      if (bb.charAt(i - 1) === aa.charAt(j - 1)) {
        matrix[i][j] =
          matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[bb.length][aa.length];
}

export function fuzzyMatch(
  text = "",
  query = "",
  threshold = 2
) {
  const normalizedText =
    normalizeSearchText(text);

  const normalizedQuery =
    normalizeSearchText(query);

  if (
    !normalizedText ||
    !normalizedQuery
  ) {
    return false;
  }

  const textWords =
    normalizedText.split(/\s+/);

  return textWords.some((word) => {
    const distance =
      levenshtein(word, normalizedQuery);

    return distance <= threshold;
  });
}
