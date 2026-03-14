export const SEARCH_SYNONYMS = {
  قهوة:["قهوة","كوفي","coffee","cafe"],
  مطعم:["مطعم","restaurant","food"],
  صيدلية:["صيدلية","pharmacy"],
  حلويات:["حلويات","dessert","sweets"],
  مشاوي:["مشاوي","grill","bbq"]
}

export function expandTerms(query){

 for(const key in SEARCH_SYNONYMS){

   if(SEARCH_SYNONYMS[key].includes(query)){

     return SEARCH_SYNONYMS[key]

   }

 }

 return [query]

}
