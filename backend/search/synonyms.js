export const SEARCH_SYNONYMS = {

  قهوة: ["قهوة","كوفي","coffee","cafe","beverages","مشروبات","drinks"],
  
  شاي: ["شاي","tea","beverages","مشروبات","drinks"],

  مطعم: ["مطعم","restaurant","food","eat","meals"],

  صيدلية: ["صيدلية","pharmacy","medicine","drugstore"],

  حلويات: ["حلويات","dessert","sweets","cake","pastry"],

  مشاوي: ["مشاوي","grill","bbq","kebab"],

  مشروبات: ["مشروبات","beverages","drinks","coffee","tea","juice"]

}


export function expandTerms(query){

  const q = String(query || "").trim().toLowerCase()

  for(const key in SEARCH_SYNONYMS){

    const words = SEARCH_SYNONYMS[key].map(v => v.toLowerCase())

    if(words.includes(q)){

      return SEARCH_SYNONYMS[key]

    }

  }

  return [query]

}
