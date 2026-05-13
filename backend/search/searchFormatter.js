// search/searchFormatter.js

const CATEGORY_MAP = {
  SHOPPING_RETAIL: { ar: "تسوق وتجزئة", en: "Shopping & Retail" },
  AUTOMOTIVE: { ar: "سيارات", en: "Automotive" },
  MEDICAL_HEALTH: { ar: "صحة وطبية", en: "Medical & Health" },
  RESTAURANT_CAFE: { ar: "مطعم / مقهى", en: "Restaurant / Cafe" },
  BEVERAGES: { ar: "مشروبات", en: "Beverages" },
  BEAUTY_SALON: { ar: "تجميل وصالون", en: "Beauty & Salon" },
  CLOTHING: { ar: "ملابس وأزياء", en: "Clothing" },
  CLOTHING_APPAREL: { ar: "ملابس وأزياء", en: "Clothing & Apparel" },
  EDUCATION: { ar: "تعليم", en: "Education" },
  ENTERTAINMENT: { ar: "ترفيه", en: "Entertainment" },
  EVENTS: { ar: "تنظيم فعاليات", en: "Events" },
  FINANCE: { ar: "تمويل وبنوك", en: "Finance" },
  FOOD_GROCERY: { ar: "طعام وبقالة", en: "Food & Grocery" },
  PUBLIC_SERVICE: { ar: "خدمات عامة", en: "Public Service" },
  HOTEL_LODGING: { ar: "فنادق وإقامة", en: "Hotel & Lodging" },
  OTC_DRUGS: { ar: "أدوية بدون وصفة", en: "OTC Drugs" },
  NONPROFIT: { ar: "غير ربحي", en: "Non-profit" },
  PROFESSIONAL_SERVICES: { ar: "خدمات مهنية", en: "Professional Services" },
  TRAVEL_TRANSPORT: { ar: "سفر ومواصلات", en: "Travel & Transportation" },
  OTHER: { ar: "أخرى", en: "Other" },

  RESTAURANT: { ar: "مطعم / مقهى", en: "Restaurant / Cafe" },
  RESTAURANTS: { ar: "مطعم / مقهى", en: "Restaurant / Cafe" },
  CAFE: { ar: "مطعم / مقهى", en: "Restaurant / Cafe" },
  CAFES: { ar: "مطعم / مقهى", en: "Restaurant / Cafe" },
  COFFEE: { ar: "مشروبات", en: "Beverages" },
  DESSERTS: { ar: "طعام وبقالة", en: "Food & Grocery" },
  BAKERY: { ar: "طعام وبقالة", en: "Food & Grocery" },
  PHARMACY: { ar: "صيدلية", en: "Pharmacy" },
  CLINIC: { ar: "صحة وطبية", en: "Medical & Health" },
  SALON: { ar: "تجميل وصالون", en: "Beauty & Salon" },
  SHOPPING: { ar: "تسوق وتجزئة", en: "Shopping & Retail" },
  SERVICES: { ar: "خدمات عامة", en: "Public Service" },
};

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isArabicLang(lang = "ar") {
  return lang === "ar";
}

function pickLang(item = {}, arKey, enKey, lang = "ar", fallback = "") {
  return isArabicLang(lang)
    ? cleanText(item[arKey] || item[enKey] || fallback)
    : cleanText(item[enKey] || item[arKey] || fallback);
}

function translateCategory(value, lang = "ar") {
  const raw = cleanText(value);
  if (!raw) return "";

  const key = raw.toUpperCase().replace(/\s+/g, "_").replace(/&/g, "");
  return CATEGORY_MAP[key]?.[lang] || CATEGORY_MAP[raw.toUpperCase()]?.[lang] || raw;
}

function getDisplayName(item = {}, lang = "ar") {
  return isArabicLang(lang)
    ? cleanText(item.name_ar || item.name || item.name_en || "نشاط")
    : cleanText(item.name_en || item.name || item.name_ar || "Business");
}

function getCategoryText(item = {}, lang = "ar") {
  const raw = isArabicLang(lang)
    ? item.category_ar || item.category
    : item.category_en || item.category;

  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const translated = values.map((v) => translateCategory(v, lang)).filter(Boolean);

  if (!translated.length) return "";

  return isArabicLang(lang)
    ? `🧵 التصنيف: ${translated.join("، ")}`
    : `🧵 Category: ${translated.join(", ")}`;
}

function getAreaText(item = {}, lang = "ar") {
  const area = pickLang(item, "area_ar", "area_en", lang, "");
  const city = pickLang(item, "city_ar", "city_en", lang, "");

  if (area && city && area !== city) return `${area} - ${city}`;
  if (area) return area;
  if (city) return city;

  return cleanText(item.locationText || item.location_text || "");
}

function getLocationText(item = {}, lang = "ar") {
  const areaText = getAreaText(item, lang);
  if (!areaText) return "";

  return isArabicLang(lang)
    ? `📍 الموقع: ${areaText}`
    : `📍 Location: ${areaText}`;
}

function getDistanceLine(item = {}, lang = "ar") {
  if (item.distance == null) return "";

  const distanceKm = (Number(item.distance) / 1000).toFixed(1);

  return isArabicLang(lang)
    ? `📏 يبعد ${distanceKm} كم`
    : `📏 ${distanceKm} km away`;
}

function getChatLine(item = {}, lang = "ar", options = {}) {
  const { showLink = true } = options;
  if (!showLink) return "";

  const link = item.trackedLink || item.whatsappLink;
  if (!link) return "";

  return isArabicLang(lang)
    ? `💬 اضغط للتواصل عبر واتساب:\n${link}`
    : `💬 Tap to contact on WhatsApp:\n${link}`;
}

function getMapLink(item = {}) {
  if (item.mapLink) return item.mapLink;
  if (item.map_link) return item.map_link;

  const lat = item.latitude || item.lat;
  const lng = item.longitude || item.lng;

  if (lat && lng) return `https://www.google.com/maps?q=${lat},${lng}`;

  return "";
}

function getDirectionsLine(item = {}, lang = "ar") {
  const link = getMapLink(item);
  if (!link) return "";

  return isArabicLang(lang)
    ? `🧭 الاتجاهات على الخريطة:\n${link}`
    : `🧭 Directions on map:\n${link}`;
}

function getIntentHeader(intent = "category", query = "", lang = "ar") {
  return isArabicLang(lang)
    ? `🔎 نتائج البحث\n"${query}"`
    : `🔎 Search results\n"${query}"`;
}

function getFooterHint(lang = "ar") {
  return isArabicLang(lang)
    ? `💡 أرسل بحثًا آخر\nمثال: قهوة، مطعم، أقرب صيدلية`
    : `💡 Send another search\nExample: coffee, restaurant, nearest pharmacy`;
}

function formatBusinessBlock(item = {}, index = 0, lang = "ar", options = {}) {
  const {
    includeDistance = false,
    includeCategory = true,
    showLink = true,
    showDirections = true,
  } = options;

  const lines = [];
  const name = getDisplayName(item, lang);

  lines.push("────────────");
  lines.push(`${index + 1}️⃣ ${name}`);

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

  if (!showLink) {
    lines.push("");
    lines.push(
      isArabicLang(lang)
        ? `📩 أرسل ${index + 1} لفتح رابط التواصل.`
        : `📩 Send ${index + 1} to open the contact link.`
    );
  }

  const chatLine = getChatLine(item, lang, { showLink });
  if (chatLine) {
    lines.push("");
    lines.push(chatLine);
  }

  const directionsLine = showDirections ? getDirectionsLine(item, lang) : "";
  if (directionsLine) {
    lines.push("");
    lines.push(directionsLine);
  }

  return lines.join("\n");
}

export function formatNoResults(query = "", lang = "ar") {
  return isArabicLang(lang)
    ? query?.trim()
      ? `لم أجد نتائج مطابقة لـ "${query}".\nجرّب اسمًا مختلفًا أو اكتب نوع النشاط بشكل أوضح.`
      : "لم أجد نتائج مطابقة."
    : query?.trim()
    ? `No matching results found for "${query}".\nTry another name or a clearer category.`
    : "No matching results found.";
}

export function formatRefinementQuestions(questions = [], query = "", lang = "ar") {
  const safeQuestions = Array.isArray(questions) ? questions : [];

  if (!safeQuestions.length) {
    return isArabicLang(lang)
      ? "حتى أعطيك نتائج أدق، أجب على سؤال قصير."
      : "To show more accurate results, answer one quick question.";
  }

  return [
    isArabicLang(lang)
      ? `حتى أعطيك نتائج أدق لـ "${query}"، أجب على سؤال قصير:`
      : `To show more accurate results for "${query}", answer one quick question:`,
    `1) ${safeQuestions[0].text}`,
  ].join("\n");
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

  results.slice(0, 4).forEach((item, index) => {
    lines.push(
      formatBusinessBlock(item, index, lang, {
        includeDistance: false,
        includeCategory: true,
        showLink: index === 0,
        showDirections: index === 0,
      })
    );
    lines.push("");
  });

  if (results.length > 1) {
    lines.push(
      isArabicLang(lang)
        ? "📌 أرسل رقم النتيجة لفتح رابطها."
        : "📌 Send the result number to open its link."
    );
    lines.push("");
  }

  lines.push("━━━━━━━━━━━━");
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
  lines.push("");

  results.slice(0, 4).forEach((item, index) => {
    lines.push(
      formatBusinessBlock(item, index, lang, {
        includeDistance: true,
        includeCategory: true,
        showLink: index === 0,
        showDirections: index === 0,
      })
    );
    lines.push("");
  });

  if (results.length > 1) {
    lines.push(
      isArabicLang(lang)
        ? "📌 أرسل رقم النتيجة لفتح رابطها."
        : "📌 Send the result number to open its link."
    );
    lines.push("");
  }

  lines.push("━━━━━━━━━━━━");
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
