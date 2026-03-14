export const SEARCH_SYNONYMS = {
  beverages: ["قهوة","كوفي","coffee","cafe","شاي","tea","مشروبات","drinks","beverages","juice","عصير"],
  restaurant: ["مطعم","مطاعم","restaurant","restaurants","food","اكل","وجبات"],
  pharmacy: ["صيدلية","صيدليات","pharmacy","drugstore","medicine","دواء"],
  dessert: ["حلويات","dessرت","dessert","sweets","cake","pastry"],
  grill: ["مشاوي","grill","bbq","kebab"]
};

export function expandTerms(query){
  const q = String(query || "").toLowerCase().trim();

  for(const key in SEARCH_SYNONYMS){
    const list = SEARCH_SYNONYMS[key].map(v => v.toLowerCase());
    if(list.includes(q)){
      // نرجع الفئة + كل المرادفات
      return [key, ...SEARCH_SYNONYMS[key]];
    }
  }

  return [q];
}
