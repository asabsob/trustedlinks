// search/searchService.js

import { expandTerms } from "./synonyms.js";
import { parseSearchIntent } from "./intentDetector.js";
import { normalizeSearchText } from "./textNormalizer.js";
import { listActiveBusinesses } from "../services/pg/businesses.js";

const RESULT_LIMITS = {
  brand: 3,
  category: 8,
  discovery: 12,
};

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function escapeRegex(text = "") {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegexList(terms = []) {
  return terms
    .map((term) => normalizeSearchText(term))
    .filter(Boolean)
    .map((term) => new RegExp(escapeRegex(term), "i"));
}

function getBusinessFields(item) {
  return [
    item?.name || "",
    item?.name_ar || "",
    item?.description || "",
    item?.description_ar || "",
    ...(Array.isArray(item?.keywords) ? item.keywords : []),
    ...(Array.isArray(item?.keywords_ar) ? item.keywords_ar : []),
    ...(Array.isArray(item?.category) ? item.category : []),
    item?.locationText || "",
    item?.location_text || "",
    item?.city || "",
    item?.area || "",
  ].map((v) => String(v || ""));
}

function matchesBusiness(item, regexList) {
  const fields = getBusinessFields(item);
  return regexList.some((rx) => fields.some((field) => rx.test(field)));
}

function calculateMatchScore(item, query = "", terms = [], intent = "category") {
  const normalizedQuery = normalizeSearchText(query);
  const name = normalizeSearchText(item?.name || "");
  const nameAr = normalizeSearchText(item?.name_ar || "");
  const description = normalizeSearchText(item?.description || "");
  const descriptionAr = normalizeSearchText(item?.description_ar || "");
  const keywords = toArray(item?.keywords).map((v) => normalizeSearchText(v)).join(" ");
  const keywordsAr = toArray(item?.keywords_ar).map((v) => normalizeSearchText(v)).join(" ");
  const categories = toArray(item?.category).map((v) => normalizeSearchText(v)).join(" ");
  const locationText = normalizeSearchText(
    item?.locationText || item?.location_text || item?.city || item?.area || ""
  );

  let score = 0;

  // Exact / near exact name match
  if (name === normalizedQuery) score += 120;
  if (nameAr === normalizedQuery) score += 120;

  if (name.includes(normalizedQuery) && normalizedQuery) score += 80;
  if (nameAr.includes(normalizedQuery) && normalizedQuery) score += 80;

  if (keywords.includes(normalizedQuery) && normalizedQuery) score += 35;
  if (keywordsAr.includes(normalizedQuery) && normalizedQuery) score += 35;

  if (categories.includes(normalizedQuery) && normalizedQuery) score += 25;
  if (description.includes(normalizedQuery) && normalizedQuery) score += 18;
  if (descriptionAr.includes(normalizedQuery) && normalizedQuery) score += 18;
  if (locationText.includes(normalizedQuery) && normalizedQuery) score += 12;

  // Per-term scoring
  terms.forEach((term) => {
    const t = normalizeSearchText(term);
    if (!t) return;

    if (name.includes(t)) score += 20;
    if (nameAr.includes(t)) score += 20;
    if (keywords.includes(t)) score += 10;
    if (keywordsAr.includes(t)) score += 10;
    if (categories.includes(t)) score += 8;
    if (description.includes(t)) score += 5;
    if (descriptionAr.includes(t)) score += 5;
    if (locationText.includes(t)) score += 4;
  });

  // Intent weighting
  if (intent === "brand") {
    if (name.includes(normalizedQuery) || nameAr.includes(normalizedQuery)) {
      score += 40;
    }
  }

  if (intent === "category") {
    if (categories.includes(normalizedQuery)) {
      score += 18;
    }
  }

  if (intent === "discovery") {
    if (description || descriptionAr) score += 6;
    if (keywords || keywordsAr) score += 6;
  }

  return score;
}

function shouldAskRefinement({ intent = "category", query = "", results = [] }) {
  const normalizedQuery = normalizeSearchText(query);
  const wordCount = normalizedQuery.split(/\s+/).filter(Boolean).length;
  const resultCount = results.length;

  if (intent === "brand") {
    return resultCount > 5;
  }

  if (intent === "category") {
    if (wordCount <= 1) return true;
    if (resultCount > 10) return true;
    return false;
  }

  if (intent === "discovery") {
    if (wordCount <= 3) return true;
    if (resultCount > 8) return true;
    return true;
  }

  return false;
}

function getRefinementQuestions(lang = "ar") {
  return [
    {
      key: "preference",
      text:
        lang === "ar"
          ? "ماذا تفضل بالتحديد؟"
          : "What exactly do you prefer?",
      type: "text",
    },
    {
      key: "area",
      text:
        lang === "ar"
          ? "في أي منطقة؟"
          : "Which area?",
      type: "text",
    },
    {
      key: "priority",
      text:
        lang === "ar"
          ? "هل تريد خيارًا اقتصاديًا أم الأفضل تقييمًا؟"
          : "Do you want a budget option or top-rated?",
      type: "choice",
      options: ["budget", "top_rated"],
    },
  ];
}

function applyRefinementAnswers(results = [], refinementAnswers = {}) {
  let filtered = [...results];

  const preference = normalizeSearchText(refinementAnswers?.preference || "");
  const area = normalizeSearchText(refinementAnswers?.area || "");
  const priority = normalizeSearchText(refinementAnswers?.priority || "");

  if (preference) {
    filtered = filtered.filter((item) => {
      const text = getBusinessFields(item)
        .map((v) => normalizeSearchText(v))
        .join(" ");

      return text.includes(preference);
    });
  }

  if (area) {
    filtered = filtered.filter((item) => {
      const areaText = [
        item?.locationText || "",
        item?.location_text || "",
        item?.city || "",
        item?.area || "",
        item?.countryName || "",
      ]
        .map((v) => normalizeSearchText(v))
        .join(" ");

      return areaText.includes(area);
    });
  }

  if (priority) {
    if (priority.includes("budget") || priority.includes("اقتصادي")) {
      filtered = filtered.sort((a, b) => Number(a._matchScore || 0) - Number(b._matchScore || 0));
    } else if (
      priority.includes("top") ||
      priority.includes("best") ||
      priority.includes("تقييم") ||
      priority.includes("افضل")
    ) {
      filtered = filtered.sort((a, b) => Number(b._matchScore || 0) - Number(a._matchScore || 0));
    }
  }

  return filtered;
}
export async function searchBusinesses({
  query = "",
  lang = "ar",
  refinementAnswers = null,
} = {}) {
  const safeQuery = String(query || "").trim();
  const intentData = parseSearchIntent(safeQuery);

  const effectiveQuery =
    intentData.isNearby && intentData.categoryQuery
      ? intentData.categoryQuery
      : safeQuery;

  const terms = expandTerms(effectiveQuery || "");
  const regexList = buildRegexList(terms);

  const businesses = await listActiveBusinesses();

  let matched = businesses.filter((item) => matchesBusiness(item, regexList));

  matched = matched
    .map((item) => ({
      ...item,
      _matchScore: calculateMatchScore(
        item,
        effectiveQuery,
        terms,
        intentData.intent
      ),
    }))
    .filter((item) => item._matchScore > 0)
    .sort((a, b) => b._matchScore - a._matchScore);
const needsRefinement =
  !refinementAnswers &&
  shouldAskRefinement({
    intent: intentData.intent,
    query: effectiveQuery,
    results: matched,
  });

if (needsRefinement) {
  return {
    ok: true,
    mode: "refinement_required",
    query: safeQuery,
    effectiveQuery,
    intent: intentData.intent,
    intentMeta: intentData,
    totalMatched: matched.length,
    results: [],
    refinement: {
      enabled: true,
      questions: getRefinementQuestions(lang),
    },
  };
}

const refinedMatched = refinementAnswers
  ? applyRefinementAnswers(matched, refinementAnswers)
  : matched;

const limit = RESULT_LIMITS[intentData.intent] || 8;
const finalResults = refinedMatched.slice(0, limit);

return {
  ok: true,
  mode: "results",
  query: safeQuery,
  effectiveQuery,
  intent: intentData.intent,
  intentMeta: intentData,
  totalMatched: refinedMatched.length,
  results: finalResults,
  refinement: {
    enabled: false,
    answers: refinementAnswers || null,
  },
};
