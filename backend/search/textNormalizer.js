export function normalizeSearchText(text = "") {
  let q = String(text || "")
    .trim()
    .toLowerCase();

  // Arabic normalization
  q = q
    .replace(/[أإآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");

  // Remove Arabic diacritics
  q = q.replace(/[\u064B-\u065F\u0670]/g, "");

  // Remove tatweel
  q = q.replace(/ـ/g, "");

  // Remove duplicate spaces
  q = q.replace(/\s+/g, " ").trim();

  return q;
}
