const CATEGORY_SYNONYMS = {
  beverages: [
    "beverages",
    "drink",
    "drinks",
    "coffee",
    "tea",
    "juice",
    "cafe",
    "قهوة",
    "كوفي",
    "شاي",
    "مشروبات",
    "عصير"
  ],
  restaurant: [
    "restaurant",
    "food",
    "مطعم",
    "مأكولات",
    "أكل"
  ],
  pharmacy: [
    "pharmacy",
    "drugstore",
    "صيدلية",
    "دواء"
  ]
};

export function normalizeSearchText(text = "") {
  let q = String(text).trim().toLowerCase();

  q = q
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");

  for (const [canonical, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.includes(q)) return canonical;
  }

  return q;
}
