export function formatSearchResults(results = [], query = "", lang = "ar") {
  if (!results.length) {
    return lang === "ar"
      ? `عذرًا، لم نجد نتائج مطابقة لـ "${query}".\n\nحاول باسم شركة أو نوع نشاط آخر.`
      : `Sorry, no results were found for "${query}".\n\nTry another company name or business category.`;
  }

  if (lang === "ar") {
    let msg = `نتائج البحث عن: "${query}"\n`;
    msg += `عدد النتائج: ${results.length}\n\n`;

    results.forEach((item, index) => {
      msg += `#${index + 1} ${item.name_ar || item.name || "اسم غير متوفر"}\n`;

      if (Array.isArray(item.category) && item.category.length) {
        msg += `🏷️ التصنيف: ${item.category.join(" - ")}\n`;
      }

      if (item.description) {
        msg += `📝 الوصف: ${item.description}\n`;
      }

      if (item.whatsapp) {
        const wa = String(item.whatsapp).replace(/\D/g, "");
        msg += `💬 المحادثة: https://wa.me/${wa}\n`;
      }

      if (item.mapLink) {
        msg += `📍 الموقع: ${item.mapLink}\n`;
      }

      msg += `\n`;
    });

    msg += `للبحث مرة أخرى، أرسل اسم شركة أو نوع نشاط آخر.`;
    return msg;
  }

  let msg = `Search results for: "${query}"\n`;
  msg += `Results found: ${results.length}\n\n`;

  results.forEach((item, index) => {
    msg += `#${index + 1} ${item.name || item.name_ar || "Unnamed business"}\n`;

    if (Array.isArray(item.category) && item.category.length) {
      msg += `🏷️ Category: ${item.category.join(" - ")}\n`;
    }

    if (item.description) {
      msg += `📝 Description: ${item.description}\n`;
    }

    if (item.whatsapp) {
      const wa = String(item.whatsapp).replace(/\D/g, "");
      msg += `💬 Chat: https://wa.me/${wa}\n`;
    }

    if (item.mapLink) {
      msg += `📍 Location: ${item.mapLink}\n`;
    }

    msg += `\n`;
  });

  msg += `Send another business name or category to search again.`;
  return msg;
}

export function formatNearestResults(results = [], lang = "ar") {
  if (!results.length) {
    return lang === "ar"
      ? "عذرًا، لم نجد أنشطة قريبة تحتوي على موقع محفوظ."
      : "Sorry, no nearby businesses with saved locations were found.";
  }

  let msg =
    lang === "ar"
      ? `أقرب النتائج لك:\n\n`
      : `Nearest results to you:\n\n`;

  results.forEach((item, index) => {
    msg += `#${index + 1} ${item.name_ar || item.name || "اسم غير متوفر"}\n`;

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

    if (item.whatsapp) {
      const wa = String(item.whatsapp).replace(/\D/g, "");
      msg += lang === "ar"
        ? `💬 المحادثة: https://wa.me/${wa}\n`
        : `💬 Chat: https://wa.me/${wa}\n`;
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
