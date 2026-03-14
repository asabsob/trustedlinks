function parseNearbyIntent(text = "") {
  const raw = String(text || "").trim();
  const q = raw.toLowerCase();

  const nearbyWords = [
    "قريبة مني",
    "قريب مني",
    "أقرب",
    "اقرب",
    "قريبة",
    "قريب",
    "near me",
    "nearest",
    "closest",
    "near",
  ];

  const removeWords = [
    "مني",
    "عندي",
    "حولي",
    "بالقرب",
    "around",
    "me",
  ];

  const isNearby = nearbyWords.some((word) => q.includes(word.toLowerCase()));

  if (!isNearby) {
    return { isNearby: false, categoryQuery: "" };
  }

  let categoryQuery = raw;

  // remove longer phrases first
  [...nearbyWords, ...removeWords]
    .sort((a, b) => b.length - a.length)
    .forEach((word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "ig");
      categoryQuery = categoryQuery.replace(rx, " ");
    });

  categoryQuery = categoryQuery.replace(/\s+/g, " ").trim();

  return {
    isNearby: true,
    categoryQuery,
  };
}
