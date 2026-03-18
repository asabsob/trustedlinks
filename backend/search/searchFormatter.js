export function formatSearchResults(results = [], query = "", lang = "ar") {
  if (!results.length) {
    return lang === "ar"
      ? `عذرًا، لم نجد نتائج مطابقة لـ "${query}".\n\nحاول باسم شركة أو نوع نشاط آخر.`
      : `Sorry, no results were found for "${query}".\n\nTry another company name or business category.`;
  }

  if (lang === "ar") {
    let msg = `نتائج البحث عن: "${query}"\n`;
    msg += `عدد النتائج: ${results.length}\n\n`;

    results.slice(0, 3).forEach((item, index) => {
      msg += `#${index + 1} ${item.name_ar || item.name || "اسم غير متوفر"}\n`;

      if (Array.isArray(item.category) && item.category.length) {
        msg += `🏷️ التصنيف: ${item.category.join(" - ")}\n`;
      }

      if (item.description) {
        msg += `📝 الوصف: ${item.description}\n`;
      }

      if (item.trackedLink) {
        msg += `💬 المحادثة: ${item.trackedLink}\n`;
      }

      if (item.mapLink) {
        msg += `📍 الموقع: ${item.mapLink}\n`;
      }

      msg += `\n`;
    });

    msg += `📌 اكتب: المزيد لعرض نتائج إضافية\n`;
    msg += `للبحث مرة أخرى، أرسل اسم شركة أو نوع نشاط آخر.`;
    return msg;
  }

  let msg = `Search results for: "${query}"\n`;
  msg += `Results found: ${results.length}\n\n`;

  results.slice(0, 3).forEach((item, index) => {
    msg += `#${index + 1} ${item.name || item.name_ar || "Unnamed business"}\n`;

    if (Array.isArray(item.category) && item.category.length) {
      msg += `🏷️ Category: ${item.category.join(" - ")}\n`;
    }

    if (item.description) {
      msg += `📝 Description: ${item.description}\n`;
    }

    if (item.trackedLink) {
      msg += `💬 Chat: ${item.trackedLink}\n`;
    }

    if (item.mapLink) {
      msg += `📍 Location: ${item.mapLink}\n`;
    }

    msg += `\n`;
  });

  msg += `📌 Reply MORE to see more results\n`;
  msg += `Send another business name or category to search again.`;
  return msg;
}

export function formatNearestResults(results = [], lang = "ar", categoryQuery = "") {
  if (!results.length) {
    return lang === "ar"
      ? categoryQuery
        ? `عذرًا، لم نجد نتائج قريبة لـ "${categoryQuery}".`
        : "عذرًا، لم نجد أنشطة قريبة تحتوي على موقع محفوظ."
      : categoryQuery
        ? `Sorry, no nearby results were found for "${categoryQuery}".`
        : "Sorry, no nearby businesses with saved locations were found.";
  }

  let msg =
    lang === "ar"
      ? categoryQuery
        ? `أقرب النتائج لـ "${categoryQuery}":\n\n`
        : `أقرب النتائج لك:\n\n`
      : categoryQuery
        ? `Nearest results for "${categoryQuery}":\n\n`
        : `Nearest results to you:\n\n`;

  results.slice(0, 3).forEach((item, index) => {
    const businessName =
      lang === "ar"
        ? item.name_ar || item.name || "اسم غير متوفر"
        : item.name || item.name_ar || "Unnamed business";

    msg += `#${index + 1} ${businessName}\n`;

    if (Array.isArray(item.category) && item.category.length) {
      msg += lang === "ar"
        ? `🏷️ التصنيف: ${item.category.join(" - ")}\n`
        : `🏷️ Category: ${item.category.join(" - ")}\n`;
    }

    if (typeof item.distanceKm === "number") {
      msg += lang === "ar"
        ? `📏 المسافة التقريبية: ${item.distanceKm.toFixed(1)} كم\n`
        : `📏 Approx. distance: ${item.distanceKm.toFixed(1)} km\n`;
    }

    if (item.trackedLink) {
      msg += lang === "ar"
        ? `💬 المحادثة: ${item.trackedLink}\n`
        : `💬 Chat: ${item.trackedLink}\n`;
    }

    if (item.mapLink) {
      msg += lang === "ar"
        ? `📍 الموقع: ${item.mapLink}\n`
        : `📍 Location: ${item.mapLink}\n`;
    }

    msg += `\n`;
  });

  return msg;
}
