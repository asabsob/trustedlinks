export function formatResults(results){

 if(!results.length){

  return "لم نجد نتائج. جرب مطعم أو قهوة."

 }

 let msg="نتائج البحث:\n\n"

 results.forEach((b,i)=>{

 msg+=`${i+1}. ${b.name}

💬 https://wa.me/${b.whatsapp}
📍 ${b.mapLink}

`

 })

 return msg

}
