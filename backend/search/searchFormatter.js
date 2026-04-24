// search/searchFormatter.js

const CATEGORY_MAP = {
  BEVERAGES: { ar: "مشروبات", en: "Beverages" },
  RESTAURANT: { ar: "مطعم", en: "Restaurant" },
  RESTAURANTS: { ar: "مطاعم", en: "Restaurants" },
  CAFE: { ar: "كافيه", en: "Cafe" },
  CAFES: { ar: "كافيهات", en: "Cafes" },
  COFFEE: { ar: "قهوة", en: "Coffee" },
  DESSERTS: { ar: "حلويات", en: "Desserts" },
  BAKERY: { ar: "مخبز", en: "Bakery" },
  PHARMACY: { ar: "صيدلية", en: "Pharmacy" },
  CLINIC: { ar: "عيادة", en: "Clinic" },
  GYM: { ar: "نادي رياضي", en: "Gym" },
  SALON: { ar: "صالون", en: "Salon" },
  SHOPPING: { ar: "تسوق", en: "Shopping" },
  SERVICES: { ar: "خدمات", en: "Services" },
};

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isArabicLang(lang = "ar") {
  return lang === "ar";
}

function pickLang(item = {}, arKey, enKey, lang = "ar", fallback = "") {
  if (isArabicLang(lang)) {
    return cleanText(item[arKey] || item[enKey] || item.name || fallback);
  }
  return cleanText(item[enKey] || item[arKey] || item.name || fallback);
}

function translateCategory(value, lang = "ar") {
  const key = String(value || "").trim().toUpperCase();
  return CATEGORY_MAP[key]?.[lang] || cleanText(value);
}

function getDisplayName(item = {}, lang = "ar") {
  return pickLang(item, "name_ar", "name_en", lang, isArabicLang(lang) ? "نشاط" : "Business");
}

function getCategoryText(item = {}, lang = "ar") {
  const raw =
    isArabicLang(lang)
      ? item.category_ar || item.category
      : item.category_en || item.category;

  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const translated = values
    .map((v) => translateCategory(v, lang))
    .filter(Boolean);

  if (!translated.length) return "";

  return isArabicLang(lang)
    ? `🏷️ التصنيف: ${translated.join("، ")}`
    : `🏷️ Category: ${translated.join(", ")}`;
}

function getAreaText(item = {}, lang = "ar") {
  const area = pickLang(item, "area_ar", "area_en", lang, "");
  const city = pickLang(item, "city_ar", "city_en", lang, "");

  if (area && city) return `${area} - ${city}`;
  return area || city || "";
}

function getLocationText(item = {}, lang = "ar") {
  const areaText = getAreaText(item, lang);
  if (!areaText) return "";
  return `📍 ${areaText}`;
}

function getDistanceLine(item = {}, lang = "ar") {
  if (item.distance == null) return "";

  const distanceKm = (Number(item.distance) / 1000).toFixed(1);

  return isArabicLang(lang)
    ? `📏 يبعد ${distanceKm} كم`
    : `📏 ${distanceKm} km away`;
}

function getChatLine(item = {}, lang = "ar") {
  if (!item.trackedLink) return "";

  return isArabicLang(lang)
    ? `💬 واتساب:\n${item.trackedLink}`
    : `💬 WhatsApp:\n${item.trackedLink}`;
}

function getDirectionsLine(item = {}, lang = "ar") {
  if (!item.mapLink) return "";

  return isArabicLang(lang)
    ? `📍 الاتجاهات:\n${item.mapLink}`
    : `📍 Directions:\n${item.mapLink}`;
}

function getIntentHeader(intent = "category", query = "", lang = "ar") {
  if (isArabicLang(lang)) {
    if (intent === "brand") return `🔎 نتيجة البحث عن: "${query}"`;
    if (intent === "discovery") return `🔎 أفضل النتائج لـ: "${query}"`;
    return `🔎 نتائج البحث عن: "${query}"`;
  }

  if (intent === "brand") return `🔎 Search result for: "${query}"`;
  if (intent === "discovery") return `🔎 Best matches for: "${query}"`;
  return `🔎 Results for: "${query}"`;
}

function getFooterHint(lang = "ar") {
  return isArabicLang(lang)
    ? `أرسل بحثًا آخر أو اكتب: أقرب + نوع النشاط.`
    : `Send another search or type: nearest + category.`;
}

function formatBusinessBlock(item = {}, index = 0, lang = "ar", options = {}) {
  const { includeDistance = false, includeCategory = true } = options;

  const lines = [];
  const name = getDisplayName(item, lang);

  lines.push(`${index + 1}) 🏪 *${name}*`);

  if (includeCategory) {
    const categoryLine = getCategoryText(item, lang);
    if (categoryLine) lines.push(categoryLine);
  }

  if (includeDistance) {
    const distanceLine = getDistanceLine(item, lang);
    if (distanceLine) lines.push(distanceLine);
  }

  const locationText = getLocationText(item, lang);
  if (locationText) lines.push(locationText);

  lines.push("");

  const chatLine = getChatLine(item, lang);
  if (chatLine) lines.push(chatLine);

  const directionsLine = getDirectionsLine(item, lang);
  if (directionsLine) lines.push("");
  if (directionsLine) lines.push(directionsLine);

  return lines.join("\n");
}

export function formatNoResults(query = "", lang = "ar") {
  if (isArabicLang(lang)) {
    return query?.trim()
      ? `لم أجد نتائج مطابقة لـ "${query}".\nجرّب اسمًا مختلفًا أو اكتب نوع النشاط بشكل أوضح.`
      : "لم أجد نتائج مطابقة.";
  }

  return query?.trim()
    ? `No matching results found for "${query}".\nTry another name or a clearer category.`
    : "No matching results found.";
}

export function formatRefinementQuestions(questions = [], query = "", lang = "ar") {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  if (!safeQuestions.length) {
    return isArabicLang(lang)
      ? "حتى أعطيك نتائج أدق، أجب على بعض الأسئلة القصيرة."
      : "To show more accurate results, please answer a few short questions.";
  }

  const lines = [];

  lines.push(
    isArabicLang(lang)
      ? query
        ? `حتى أعطيك نتائج أدق لـ "${query}"، أجب على 3 أسئلة قصيرة:`
        : "حتى أعطيك نتائج أدق، أجب على 3 أسئلة قصيرة:"
      : query
      ? `To show more accurate results for "${query}", answer 3 quick questions:`
      : "To show more accurate results, answer 3 quick questions:"
  );

  safeQuestions.forEach((q, index) => {
    lines.push(`${index + 1}) ${q.text}`);
  });

  return lines.join("\n");
}

export function formatSearchResults({
  results = [],
  query = "",
  lang = "ar",
  intent = "category",
} = {}) {
  if (!Array.isArray(results) || results.length === 0) {
    return formatNoResults(query, lang);
  }

  const lines = [];

  lines.push(getIntentHeader(intent, query, lang));
  lines.push("");

  const featured = results[0];
  lines.push(
    isArabicLang(lang)
      ? "🔥 أفضل نتيجة:"
      : "🔥 Best result:"
  );
  lines.push("");
  lines.push(
    formatBusinessBlock(featured, 0, lang, {
      includeDistance: false,
      includeCategory: true,
    })
  );

  const others = results.slice(1, 4);

  if (others.length) {
    lines.push("");
    lines.push("────────────");
    lines.push("");
    lines.push(isArabicLang(lang) ? "نتائج أخرى:" : "Other results:");

    others.forEach((item, index) => {
      lines.push("");
      lines.push(
        formatBusinessBlock(item, index + 1, lang, {
          includeDistance: false,
          includeCategory: false,
        })
      );
    });
  }

  lines.push("");
  lines.push(getFooterHint(lang));

  return lines.join("\n");
}

export function formatNearestResults(results = [], lang = "ar", categoryQuery = "") {
  if (!Array.isArray(results) || results.length === 0) {
    return isArabicLang(lang)
      ? categoryQuery
        ? `لم أجد نتائج قريبة لـ "${categoryQuery}".`
        : "لم أجد نتائج قريبة."
      : categoryQuery
      ? `No nearby results found for "${categoryQuery}".`
      : "No nearby results found.";
  }

  const lines = [];

  lines.push(
    isArabicLang(lang)
      ? categoryQuery
        ? `📍 أقرب النتائج لـ "${categoryQuery}"`
        : "📍 أقرب النتائج"
      : categoryQuery
      ? `📍 Nearest results for "${categoryQuery}"`
      : "📍 Nearest results"
  );

  results.slice(0, 4).forEach((item, index) => {
    lines.push("");
    lines.push(
      formatBusinessBlock(item, index, lang, {
        includeDistance: true,
        includeCategory: index === 0,
      })
    );
  });

  lines.push("");
  lines.push(getFooterHint(lang));

  return lines.join("\n");
}

export function formatSearchResponse(searchData = {}, lang = "ar") {
  if (!searchData || typeof searchData !== "object") {
    return formatNoResults("", lang);
  }

  if (searchData.mode === "refinement_required") {
    return formatRefinementQuestions(
      searchData?.refinement?.questions || [],
      searchData?.effectiveQuery || searchData?.query || "",
      lang
    );
  }

  if (searchData.intentMeta?.isNearby) {
    return formatNearestResults(
      searchData.results || [],
      lang,
      searchData.intentMeta?.categoryQuery || searchData.effectiveQuery || ""
    );
  }

  return formatSearchResults({
    results: searchData.results || [],
    query: searchData.effectiveQuery || searchData.query || "",
    lang,
    intent: searchData.intent || "category",
  });
}
