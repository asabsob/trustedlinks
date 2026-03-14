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
import { expandTerms } from "./synonyms.js";

export function detectNearbyCategory(text=""){
  const words = String(text).split(" ");

  for(const w of words){
    const terms = expandTerms(w);
    if(terms.length > 1){
      return terms[0]; // category key
    }
  }

  return null;
}
