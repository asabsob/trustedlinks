import { normalizeSearchText } from "./textNormalizer.js";

function containsNormalized(text = "", query = "") {
  return normalizeSearchText(text).includes(
    normalizeSearchText(query)
  );
}

export function calculateBusinessScore({
  business = {},
  query = "",
  intentType = "category",
  isNearby = false,
}) {
  let score = 0;

  const normalizedQuery =
    normalizeSearchText(query);

  const fields = [
    business.name,
    business.name_ar,
    business.description,
    business.description_ar,
    business.category,
    business.category_ar,
    business.keywords,
    business.keywords_ar,
  ]
    .filter(Boolean)
    .map((x) => String(x));

  // Exact name
  if (
    normalizeSearchText(business.name) ===
      normalizedQuery ||
    normalizeSearchText(business.name_ar) ===
      normalizedQuery
  ) {
    score += 100;
  }

  // Name contains
  if (
    containsNormalized(business.name, query) ||
    containsNormalized(business.name_ar, query)
  ) {
    score += 70;
  }

  // Category match
  if (
    containsNormalized(
      business.category,
      query
    ) ||
    containsNormalized(
      business.category_ar,
      query
    )
  ) {
    score += 50;
  }

  // Keywords
  const keywordMatch = fields.some((field) =>
    containsNormalized(field, query)
  );

  if (keywordMatch) {
    score += 30;
  }

  // Nearby boost
  if (isNearby) {
    score += 20;
  }

  // Verified boost
  if (business.verified === true) {
    score += 15;
  }

  // Sponsored boost
  if (business.sponsored === true) {
    score += 10;
  }

  // Active boost
  if (business.status === "active") {
    score += 5;
  }

  return score;
}
