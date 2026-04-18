import { normalizeSearchText } from "./textNormalizer.js";

export const SEARCH_SYNONYMS = {
  beverages: [
    "قهوة",
    "كوفي",
    "coffee",
    "cafe",
    "شاي",
    "tea",
    "مشروبات",
    "مشروب",
    "مشاريب",
    "drinks",
    "drink",
    "beverages",
    "juice",
    "عصير",
    "بوبل تي",
    "بابل تي",
  ],
  restaurant: [
    "مطعم",
    "مطاعم",
    "restaurant",
    "restaurants",
    "food",
    "اكل",
    "أكل",
    "وجبات",
    "برغر",
    "burger",
    "shawarma",
    "شاورما",
    "pizza",
    "بيتزا",
  ],
  pharmacy: [
    "صيدلية",
    "صيدليات",
    "pharmacy",
    "drugstore",
    "medicine",
    "دواء",
    "ادويه",
    "أدوية",
  ],
  dessert: [
    "حلويات",
    "dessert",
    "desserts",
    "sweets",
    "cake",
    "pastry",
    "كيك",
  ],
  grill: [
    "مشاوي",
    "grill",
    "bbq",
    "kebab",
    "كباب",
  ],
};

function uniqueTerms(terms = []) {
  return [
    ...new Set(
      terms.map((t) => normalizeSearchText(t)).filter(Boolean)
    ),
  ];
}

export function expandTerms(query = "") {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  const expanded = new Set(queryWords);

  for (const [groupKey, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    const normalizedSynonyms = uniqueTerms([groupKey, ...synonyms]);

    const matched = normalizedSynonyms.some((term) => {
      return normalizedQuery.includes(term) || queryWords.includes(term);
    });

    if (matched) {
      normalizedSynonyms.forEach((term) => expanded.add(term));
    }
  }

  return [...expanded];
}
