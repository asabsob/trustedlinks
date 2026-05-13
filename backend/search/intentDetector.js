// search/intentDetector.js

import { normalizeSearchText } from "./textNormalizer.js";

import {
  detectCategoryKeyword,
} from "./categoryDictionary.js";

const BRAND_HINTS_AR = [
  "اسم",
  "فرع",
  "واتساب",
  "رقم",
];

const BRAND_HINTS_EN = [
  "name",
  "branch",
  "whatsapp",
  "number",
];

const CATEGORY_HINTS_AR = [
  "مطعم",
  "مطاعم",
  "كافيه",
  "كوفي",
  "قهوة",
  "صيدلية",
  "حلويات",
  "مشاوي",
  "ملابس",
  "صالون",
  "عيادة",
  "فندق",
  "سوبرماركت",
  "بقالة",
  "خدمات",
  "مكتب",
  "سفر",
  "سيارات",
];

const CATEGORY_HINTS_EN = [
  "restaurant",
  "restaurants",
  "cafe",
  "coffee",
  "pharmacy",
  "dessert",
  "sweets",
  "grill",
  "bbq",
  "clothes",
  "salon",
  "clinic",
  "hotel",
  "market",
  "grocery",
  "services",
  "office",
  "travel",
  "cars",
];

const DISCOVERY_HINTS_AR = [
  "أفضل",
  "احسن",
  "مناسب",
  "اقتراح",
  "خيارات",
  "ابحث",
  "أدور",
  "ابي",
  "ابغى",
  "شي كويس",
  "مكان كويس",
];

const DISCOVERY_HINTS_EN = [
  "best",
  "top",
  "good",
  "recommend",
  "suggest",
  "looking for",
  "find me",
  "options",
];

const NEARBY_HINTS_AR = [
  "قريبة مني",
  "قريب مني",
  "أقرب",
  "اقرب",
  "قريبة",
  "قريب",
  "بالقرب",
  "حولي",
];

const NEARBY_HINTS_EN = [
  "near me",
  "nearest",
  "closest",
  "nearby",
  "near",
];

const REMOVE_NEARBY_WORDS = [
  "قريبة مني",
  "قريب مني",
  "أقرب",
  "اقرب",
  "قريبة",
  "قريب",
  "بالقرب",
  "حولي",
  "مني",
  "عندي",
  "around",
  "near me",
  "nearest",
  "closest",
  "nearby",
  "near",
  "me",
];

function includesAny(text = "", words = []) {
  return words.some((word) => text.includes(normalizeSearchText(word)));
}

function getWordCount(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function cleanNearbyCategoryQuery(raw = "") {
  let result = String(raw || "").trim();

  REMOVE_NEARBY_WORDS
    .sort((a, b) => b.length - a.length)
    .forEach((word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "ig");
      result = result.replace(rx, " ");
    });

  return result.replace(/\s+/g, " ").trim();
}

function detectNearby(normalizedText = "", rawText = "") {
  const isNearby =
    includesAny(normalizedText, NEARBY_HINTS_AR) ||
    includesAny(normalizedText, NEARBY_HINTS_EN);

  if (!isNearby) {
    return {
      isNearby: false,
      categoryQuery: "",
    };
  }

  return {
    isNearby: true,
    categoryQuery: cleanNearbyCategoryQuery(rawText),
  };
}

function detectBrandIntent(normalizedText = "") {
  const words = getWordCount(normalizedText);

  const hasCategoryHint =
    includesAny(normalizedText, CATEGORY_HINTS_AR) ||
    includesAny(normalizedText, CATEGORY_HINTS_EN);

  const hasDiscoveryHint =
    includesAny(normalizedText, DISCOVERY_HINTS_AR) ||
    includesAny(normalizedText, DISCOVERY_HINTS_EN);

  const hasBrandHint =
    includesAny(normalizedText, BRAND_HINTS_AR) ||
    includesAny(normalizedText, BRAND_HINTS_EN);

  if (hasBrandHint && !hasCategoryHint) {
    return {
      matched: true,
      confidence: 0.82,
      reason: "brand_hint_detected",
    };
  }

  if (words <= 2 && !hasCategoryHint && !hasDiscoveryHint) {
    return {
      matched: true,
      confidence: 0.78,
      reason: "short_direct_query",
    };
  }

  return {
    matched: false,
    confidence: 0,
    reason: "",
  };
}

function detectCategoryIntent(normalizedText = "") {
  const hasCategoryHint =
    includesAny(normalizedText, CATEGORY_HINTS_AR) ||
    includesAny(normalizedText, CATEGORY_HINTS_EN);

  if (!hasCategoryHint) {
    return {
      matched: false,
      confidence: 0,
      reason: "",
    };
  }

  return {
    matched: true,
    confidence: 0.8,
    reason: "category_terms_detected",
  };
}

function detectDiscoveryIntent(normalizedText = "", isNearby = false) {
  const words = getWordCount(normalizedText);

  const hasDiscoveryHint =
    includesAny(normalizedText, DISCOVERY_HINTS_AR) ||
    includesAny(normalizedText, DISCOVERY_HINTS_EN);

  if (isNearby) {
    return {
      matched: true,
      confidence: 0.85,
      reason: "nearby_search_detected",
    };
  }

  if (hasDiscoveryHint || words >= 4) {
    return {
      matched: true,
      confidence: 0.76,
      reason: "exploratory_query_detected",
    };
  }

  return {
    matched: false,
    confidence: 0,
    reason: "",
  };
}

function shouldAskRefinement(intent = "category", normalizedText = "", categoryQuery = "") {
  const wordCount = getWordCount(normalizedText);

  if (intent === "brand") return false;

  if (intent === "discovery") return true;

  if (intent === "category") {
    if (wordCount <= 1) return true;
    if (!categoryQuery && wordCount <= 2) return true;
  }

  return false;
}

export function parseSearchIntent(text = "") {
  const raw = String(text || "").trim();
  const normalized = normalizeSearchText(raw);

  if (!normalized) {
    return {
      intent: "discovery",
      confidence: 0.5,
      reason: "empty_query",
      isNearby: false,
      categoryQuery: "",
      normalizedQuery: "",
      needsRefinement: true,
    };
  }

  const nearby = detectNearby(normalized, raw);

  const categoryDictionaryMatch =
  detectCategoryKeyword(normalized);

  const brand = detectBrandIntent(normalized);
  const category = detectCategoryIntent(normalized);
  const discovery = detectDiscoveryIntent(normalized, nearby.isNearby);

  let intent = "category";
  let confidence = 0.6;
  let reason = "default_category";

  if (nearby.isNearby) {
    intent = "discovery";
    confidence = discovery.confidence || 0.85;
    reason = discovery.reason || "nearby_search_detected";
    } else if (categoryDictionaryMatch.matched) {
  intent = "category";
  confidence = 0.9;
  reason = "category_dictionary_match";
  } else if (brand.matched && brand.confidence >= category.confidence) {
    intent = "brand";
    confidence = brand.confidence;
    reason = brand.reason;
  } else if (category.matched) {
    intent = "category";
    confidence = category.confidence;
    reason = category.reason;
  } else if (discovery.matched) {
    intent = "discovery";
    confidence = discovery.confidence;
    reason = discovery.reason;
  }

  const needsRefinement = shouldAskRefinement(
    intent,
    normalized,
    nearby.categoryQuery
  );

  return {
    intent,
    confidence,
    reason,
    isNearby: nearby.isNearby,
    categoryQuery: nearby.categoryQuery,
    normalizedQuery: normalized,
    needsRefinement,
  };
}
