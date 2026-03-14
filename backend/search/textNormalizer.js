export function normalizeSearchText(text = "") {
  let q = String(text).trim().toLowerCase();

  // Arabic normalization
  q = q
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");

  // remove extra spaces
  q = q.replace(/\s+/g, " ").trim();

  return q;
}
