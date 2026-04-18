// search/searchFormatter.js

function getDisplayName(item = {}, lang = "ar") {
  if (lang === "ar") {
    return item.name_ar || item.name || "نشاط";
  }
  return item.name || item.name_ar || "Business";
}

function getCategoryText(item = {}, lang = "ar") {
  const raw = Array.isArray(item.category)
    ? item.category
    : item.category
    ? [item.category]
    : [];

  const values = raw
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  if (!values.length) return "";

  return lang === "ar"
    ? `التصنيف: ${values.join("، ")}`
    : `Category: ${values.join(", ")}`;
}

function getDescriptionText(item = {}, lang = "ar", maxLength = 120) {
  const text =
    lang === "ar"
      ? item.description_ar || item.description || ""
      : item.description || item.description_ar || "";

  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  const shortened =
    cleaned.length > maxLength
      ? `${cleaned.slice(0, maxLength).trim()}...`
      : cleaned;

  return lang === "ar"
    ? `الوصف: ${shortened}`
    : `Description: ${shortened}`;
}

function getLocationLine(item = {}, lang = "ar") {
  if (!item.mapLink) return "";
  return lang === "ar"
    ? `الموقع: ${item.mapLink}`
    : `Location: ${item.mapLink}`;
}

function getChatLine(item = {}, lang = "ar") {
  if (!item.trackedLink) return "";
  return lang === "ar"
    ? `المحادثة: ${item.trackedLink}`
    : `Chat: ${item.trackedLink}`;
}

function getDistanceLine(item = {}, lang = "ar") {
  if (item.distance == null) return "";

  const distanceKm = (Number(item.distance) / 1000).toFixed(1);

  return lang === "ar"
    ? `المسافة: ${distanceKm} كم`
    : `Distance: ${distanceKm} km`;
}

function getIntentHeader(intent = "category", query = "", lang = "ar") {
  if (lang === "ar") {
    if (intent === "brand") return `نتيجة البحث عن: "${query}"`;
    if (intent === "discovery") return `أفضل النتائج لـ: "${query}"`;
    return `نتائج البحث عن: "${query}"`;
  }

  if (intent === "brand") return `Search result for: "${query}"`;
  if (intent === "discovery") return `Best matches for: "${query}"`;
  return `Results for: "${query}"`;
}

function getFooterHint(lang = "ar") {
  return lang === "ar"
    ? "أرسل بحثًا آخر أو اكتب: أقرب + نوع النشاط."
    : "Send another search or type: nearest + category.";
}

function formatBusinessBlock(item = {}, index = 0, lang = "ar", options = {}) {
  const {
    includeDistance = false,
    includeDescription = true,
    includeCategory = true,
  } = options;

  const lines = [];
  const name = getDisplayName(item, lang);

  lines.push(`${index + 1}) ${name}`);

  if (includeDistance) {
    const distanceLine = getDistanceLine(item, lang);
    if (distanceLine) lines.push(distanceLine);
  }

  if (includeCategory) {
    const categoryLine = getCategoryText(item, lang);
    if (categoryLine) lines.push(categoryLine);
  }

  if (includeDescription) {
    const descriptionLine = getDescriptionText(item, lang);
    if (descriptionLine) lines.push(descriptionLine);
  }

  const chatLine = getChatLine(item, lang);
  if (chatLine) lines.push(chatLine);

  const locationLine = getLocationLine(item, lang);
  if (locationLine) lines.push(locationLine);

  return lines.join("\n");
}

export function formatNoResults(query = "", lang = "ar") {
  if (lang === "ar") {
    if (query?.trim()) {
      return `لم أجد نتائج مطابقة لـ "${query}".\nجرّب اسمًا مختلفًا أو اكتب نوع النشاط بشكل أوضح.`;
    }
    return "لم أجد نتائج مطابقة.";
  }

  if (query?.trim()) {
    return `No matching results found for "${query}".\nTry another name or a clearer category.`;
  }

  return "No matching results found.";
}

export function formatRefinementQuestions(questions = [], query = "", lang = "ar") {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  if (!safeQuestions.length) {
    return lang === "ar"
      ? "حتى أعطيك نتائج أدق، أجب على بعض الأسئلة القصيرة."
      : "To show more accurate results, please answer a few short questions.";
  }

  const lines = [];

  lines.push(
    lang === "ar"
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

  results.forEach((item, index) => {
    lines.push("");
    lines.push(
      formatBusinessBlock(item, index, lang, {
        includeDistance: false,
        includeDescription: true,
        includeCategory: true,
      })
    );
  });

  lines.push("");
  lines.push(getFooterHint(lang));

  return lines.join("\n");
}

export function formatNearestResults(results = [], lang = "ar", categoryQuery = "") {
  if (!Array.isArray(results) || results.length === 0) {
    return lang === "ar"
      ? categoryQuery
        ? `لم أجد نتائج قريبة لـ "${categoryQuery}".`
        : "لم أجد نتائج قريبة."
      : categoryQuery
      ? `No nearby results found for "${categoryQuery}".`
      : "No nearby results found.";
  }

  const lines = [];

  lines.push(
    lang === "ar"
      ? categoryQuery
        ? `أقرب النتائج لـ "${categoryQuery}"`
        : "أقرب النتائج"
      : categoryQuery
      ? `Nearest results for "${categoryQuery}"`
      : "Nearest results"
  );

  results.forEach((item, index) => {
    lines.push("");
    lines.push(
      formatBusinessBlock(item, index, lang, {
        includeDistance: true,
        includeDescription: false,
        includeCategory: true,
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
