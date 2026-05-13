import { expandTerms } from "./synonyms.js";
import { parseSearchIntent } from "./intentDetector.js";
import { normalizeSearchText } from "./textNormalizer.js";
import { listActiveBusinesses } from "../services/pg/businesses.js";
import { calculateBusinessScore } from "./searchScoring.js";

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
    .map((term) => {
      const flexible = escapeRegex(term)
        .replace(/ه/g, "[هة]")
        .replace(/ة/g, "[هة]")
        .replace(/ي/g, "[يى]")
        .replace(/ى/g, "[يى]");

      return new RegExp(flexible, "i");
    });
}

function getBusinessFields(item) {
  return [
    item?.name || "",
    item?.name_ar || "",
    item?.description || "",
    item?.description_ar || "",

    ...toArray(item?.keywords),
    ...toArray(item?.keywords_ar),

    ...toArray(item?.category),
    ...toArray(item?.category_ar),

    item?.business_type || "",
    item?.activity || "",
    item?.sector || "",

    item?.locationText || "",
    item?.location_text || "",
    item?.city || "",
    item?.area || "",
    item?.countryName || "",
  ].map((v) => normalizeSearchText(String(v || "")));
}

function matchesBusiness(item, regexList, query = "") {
  const fields = getBusinessFields(item);
  const fullText = fields.join(" ");

  if (!regexList.length) return true;

  const directMatch = regexList.some((rx) => rx.test(fullText));
  if (directMatch) return true;

  const words = normalizeSearchText(query)
    .split(" ")
    .filter((w) => w.length >= 3);

  if (!words.length) return false;

  return words.some((word) => fullText.includes(word));
}

function shouldAskRefinement({
  intent = "category",
  query = "",
  results = [],
}) {
  if (!results || results.length === 0) {
    return false;
  }

  const normalizedQuery =
    normalizeSearchText(query);

  const wordCount = normalizedQuery
    .split(/\s+/)
    .filter(Boolean).length;

  const resultCount = results.length;

  // Small result sets should NEVER ask refinement
  if (resultCount <= 3) {
    return false;
  }

  // Brand searches rarely need refinement
  if (intent === "brand") {
    return resultCount > 6;
  }

  // Category logic
  if (intent === "category") {
    if (wordCount <= 1 && resultCount >= 6) {
      return true;
    }

    if (resultCount >= 10) {
      return true;
    }

    return false;
  }

  // Discovery searches
  if (intent === "discovery") {
    if (resultCount >= 8) {
      return true;
    }

    return false;
  }

  return false;
}
function getRefinementQuestions(lang = "ar") {
  return [
    {
      key: "preference",
      text: lang === "ar" ? "ماذا تفضل بالتحديد؟" : "What exactly do you prefer?",
      type: "text",
    },
    {
      key: "area",
      text: lang === "ar" ? "في أي منطقة؟" : "Which area?",
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
  query,
  lang = "ar",
  intentType = "category",
  isNearby = false,
  refinementAnswers = null,
}) {

  const safeQuery = String(query || "").trim();
  const intentData = parseSearchIntent(safeQuery);

  const effectiveQuery =
    intentData.isNearby && intentData.categoryQuery
      ? intentData.categoryQuery
      : safeQuery;

  const terms = expandTerms(effectiveQuery || "");
  const regexList = buildRegexList(terms);

 const businesses = await listActiveBusinesses();

const searchableBusinesses = businesses.filter((b) => {
  if (b.wallet_status === "paused") return false;

  const balance = Number(b.wallet_balance ?? 0);
  const negativeLimit = Number(b.wallet_negative_limit ?? -5);

  // Allow active businesses until they reach -5
  return balance > negativeLimit;
});

let matched = searchableBusinesses.filter((item) =>
  matchesBusiness(item, regexList, effectiveQuery)
);

 matched = matched
  .map((item) => ({
    ...item,
   _matchScore: calculateBusinessScore({
  business: item,
  query: effectiveQuery,
  intentType,
  isNearby,
}),
  }))
  .filter((item) => item._matchScore > 0)
  .sort((a, b) => b._matchScore - a._matchScore);

console.log(
  "SEARCH_TOP_RESULTS",
  matched.slice(0, 5).map((r) => ({
    name: r.name,
    score: r._matchScore,
  }))
);

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
}
