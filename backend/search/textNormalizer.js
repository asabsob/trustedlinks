export function normalizeSearchText(text=""){

 let t = text.toLowerCase().trim()

 const removeWords=[
  "شركة",
  "مؤسسة",
  "مطعم",
  "كوفي",
  "كافيه",
  "shop",
  "company"
 ]

 removeWords.forEach(w=>{
  t=t.replace(w,"")
 })

 return t.trim()
}
