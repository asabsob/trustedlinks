export function formatSearchResults(results = [], query = "", lang = "ar") {
  if (!Array.isArray(results) || results.length === 0) {
    return lang === "ar"
      ? `لم أجد نتائج مطابقة لـ "${query}".`
      : `No matching results found for "${query}".`;
  }

  const lines = [];

  lines.push(
    lang === "ar"
      ? `نتائج البحث عن: "${query}"`
      : `Results for: "${query}"`
  );

  lines.push(
    lang === "ar"
      ? `عدد النتائج: ${results.length}`
      : `Results count: ${results.length}`
  );

  results.forEach((item, index) => {
    const name = item.name_ar || item.name || "Business";
    const category = Array.isArray(item.category)
      ? item.category.join(", ")
      : String(item.category || "");
    const desc =
      (item.description_ar || item.description || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);

    lines.push("");
    lines.push(`${index + 1}) ${name}`);

    if (category) {
      lines.push(
        lang === "ar"
          ? `التصنيف: ${category}`
          : `Category: ${category}`
      );
    }

    if (desc) {
      lines.push(
        lang === "ar"
          ? `الوصف: ${desc}`
          : `Description: ${desc}`
      );
    }

    if (item.trackedLink) {
      lines.push(
        lang === "ar"
          ? `المحادثة: ${item.trackedLink}`
          : `Chat: ${item.trackedLink}`
      );
    }

    if (item.mapLink) {
      lines.push(
        lang === "ar"
          ? `الموقع: ${item.mapLink}`
          : `Location: ${item.mapLink}`
      );
    }
  });

  lines.push("");
  lines.push(
    lang === "ar"
      ? "أرسل اسمًا آخر أو اكتب: أقرب + نوع النشاط."
      : "Send another search or type: nearest + category."
  );

  return lines.join("\n");
}
export function formatNearestResults(results = [], lang = "ar", categoryQuery = "") {
  if (!Array.isArray(results) || results.length === 0) {
    return lang === "ar"
      ? "لم أجد نتائج قريبة."
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
    const name = item.name_ar || item.name || "Business";
    const distanceKm =
      item.distance != null ? (Number(item.distance) / 1000).toFixed(1) : null;

    lines.push("");
    lines.push(`${index + 1}) ${name}`);

    if (distanceKm) {
      lines.push(
        lang === "ar"
          ? `المسافة: ${distanceKm} كم`
          : `Distance: ${distanceKm} km`
      );
    }

    if (item.trackedLink) {
      lines.push(
        lang === "ar"
          ? `المحادثة: ${item.trackedLink}`
          : `Chat: ${item.trackedLink}`
      );
    }

    if (item.mapLink) {
      lines.push(
        lang === "ar"
          ? `الموقع: ${item.mapLink}`
          : `Location: ${item.mapLink}`
      );
    }
  });

  return lines.join("\n");
}
