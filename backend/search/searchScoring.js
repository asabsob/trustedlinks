import { normalizeSearchText } from "./textNormalizer.js";
import { fuzzyMatch } from "./fuzzyMatching.js";

function safeNormalize(value = "") {
  return normalizeSearchText(String(value || ""));
}

function containsNormalized(text = "", query = "") {
  return safeNormalize(text).includes(
    safeNormalize(query)
  );
}

function splitWords(text = "") {
  return safeNormalize(text)
    .split(/\s+/)
    .filter(Boolean);
}

function calculateWordMatchScore(
  field = "",
  queryWords = []
) {
  const normalizedField = safeNormalize(field);

  let score = 0;

  for (const word of queryWords) {
    if (!word || word.length < 2) continue;

    // Exact word
    if (
      normalizedField === word
    ) {
      score += 30;
      continue;
    }

    // Starts with
    if (
      normalizedField.startsWith(word)
    ) {
      score += 20;
      continue;
    }

    // Includes
    if (
      normalizedField.includes(word)
    ) {
      score += 10;
    }
  }

  return score;
}

function calculateFieldScore(
  field = "",
  query = "",
  queryWords = []
) {
  let score = 0;

  const normalizedField =
    safeNormalize(field);

  const normalizedQuery =
    safeNormalize(query);

  if (!normalizedField) {
    return 0;
  }

  // Exact full match
  if (
    normalizedField === normalizedQuery
  ) {
    score += 120;
  }

  // Starts with full query
  else if (
    normalizedField.startsWith(
      normalizedQuery
    )
  ) {
    score += 80;
  }

  // Full contains
  else if (
    normalizedField.includes(
      normalizedQuery
    )
  ) {
    score += 50;
  }

  else if (
  fuzzyMatch(
    normalizedField,
    normalizedQuery
  )
) {
  score += 25;
}
  
  // Word-level scoring
  score += calculateWordMatchScore(
    normalizedField,
    queryWords
  );

  return score;
}

export function calculateBusinessScore({
  business = {},
  query = "",
  intentType = "category",
  isNearby = false,
}) {
  const normalizedQuery =
    safeNormalize(query);

  if (!normalizedQuery) {
    return 0;
  }

  const queryWords =
    splitWords(normalizedQuery);

  let score = 0;

  const name =
    business.name || "";

  const nameAr =
    business.name_ar || "";

  const description =
    business.description || "";

  const descriptionAr =
    business.description_ar || "";

  const category =
    business.category || "";

  const categoryAr =
    business.category_ar || "";

  const keywords = [
    ...(Array.isArray(business.keywords)
      ? business.keywords
      : [business.keywords]),
    ...(Array.isArray(business.keywords_ar)
      ? business.keywords_ar
      : [business.keywords_ar]),
  ]
    .filter(Boolean)
    .join(" ");

  // =====================================================
  // Name scoring (highest priority)
  // =====================================================

  score +=
    calculateFieldScore(
      name,
      normalizedQuery,
      queryWords
    ) * 2.2;

  score +=
    calculateFieldScore(
      nameAr,
      normalizedQuery,
      queryWords
    ) * 2.2;

  // =====================================================
  // Category scoring
  // =====================================================

  score +=
    calculateFieldScore(
      category,
      normalizedQuery,
      queryWords
    ) * 1.4;

  score +=
    calculateFieldScore(
      categoryAr,
      normalizedQuery,
      queryWords
    ) * 1.4;

  // =====================================================
  // Keywords scoring
  // =====================================================

  score +=
    calculateFieldScore(
      keywords,
      normalizedQuery,
      queryWords
    ) * 1.2;

  // =====================================================
  // Description scoring
  // =====================================================

  score +=
    calculateFieldScore(
      description,
      normalizedQuery,
      queryWords
    ) * 0.7;

  score +=
    calculateFieldScore(
      descriptionAr,
      normalizedQuery,
      queryWords
    ) * 0.7;

  // =====================================================
  // Nearby boost
  // =====================================================

  if (isNearby) {
    score += 35;
  }

  // =====================================================
  // Brand intent boost
  // =====================================================

  if (
    intentType === "direct" ||
    intentType === "brand"
  ) {
    if (
      containsNormalized(
        name,
        normalizedQuery
      ) ||
      containsNormalized(
        nameAr,
        normalizedQuery
      )
    ) {
      score += 60;
    }
  }

  // =====================================================
  // Verified boost
  // =====================================================

  if (business.verified === true) {
    score += 20;
  }

  // =====================================================
  // Sponsored boost
  // =====================================================

  if (business.sponsored === true) {
    score += 15;
  }

  // =====================================================
  // Active boost
  // =====================================================

  if (business.status === "active") {
    score += 10;
  }

  // =====================================================
  // Popularity boost
  // =====================================================

  const clicks = Number(
    business.total_clicks || 0
  );

  const leads = Number(
    business.total_leads || 0
  );

  const popularityBoost =
    Math.min(clicks * 0.05, 15) +
    Math.min(leads * 0.1, 20);

  score += popularityBoost;

  return Math.round(score);
}
