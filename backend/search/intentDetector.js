function parseNearbyIntent(text = "") {
  const raw = String(text || "").trim();
  const q = raw.toLowerCase();

  const nearbyWords = [
    "أقرب",
    "اقرب",
    "قريب",
    "قريبة",
    "near",
    "nearest",
    "closest",
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

  nearbyWords.forEach((word) => {
    const rx = new RegExp(word, "ig");
    categoryQuery = categoryQuery.replace(rx, " ");
  });

  removeWords.forEach((word) => {
    const rx = new RegExp(word, "ig");
    categoryQuery = categoryQuery.replace(rx, " ");
  });

  categoryQuery = categoryQuery.replace(/\s+/g, " ").trim();

  return {
    isNearby: true,
    categoryQuery,
  };
}
