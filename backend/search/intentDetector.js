export function parseNearbyIntent(text = "") {

  const q = String(text).toLowerCase().trim();

  const nearbyWords = [
    "اقرب",
    "أقرب",
    "قريب",
    "قريبة",
    "قريب مني",
    "قريبة مني",
    "near",
    "nearest",
    "closest"
  ];

  let isNearby = nearbyWords.some(word => q.includes(word));

  if (!isNearby) {
    return { isNearby: false };
  }

  // remove nearby words to extract category
  let categoryQuery = q;

  nearbyWords.forEach(word => {
    categoryQuery = categoryQuery.replace(word, "");
  });

  categoryQuery = categoryQuery.trim();

  return {
    isNearby: true,
    categoryQuery
  };
}
