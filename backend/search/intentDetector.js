export function detectNearbyIntent(text = "") {
  const t = String(text).toLowerCase().trim();

  if(
    t.includes("اقرب") ||
    t.includes("أقرب") ||
    t.includes("near") ||
    t.includes("closest")
  ){
    return true;
  }

  return false;
}
