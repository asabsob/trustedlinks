import Business from "../models/Business.js";
import { expandTerms } from "./synonyms.js";
import LeadToken from "../models/LeadToken.js";

export async function searchBusinesses(query){

  const terms = expandTerms(query);

  const regexList = terms.map(term => new RegExp(term,"i"));

  const results = await Business.find({
    status: "Active",
    $or:[
      {name:{$in:regexList}},
      {name_ar:{$in:regexList}},
      {description:{$in:regexList}},
      {keywords:{$in:regexList}},
      {category:{$in:regexList}}
    ]
  })
  .limit(10)
  .lean();
const enrichedResults = await Promise.all(
  results.map(async (item) => {
    const token = await LeadToken.create({
      businessId: String(item._id),
      businessPhone: item.whatsapp,
      query,
    });

    return {
      ...item,
      trackedLink: `${process.env.BASE_URL}/l/${token._id}`,
    };
  })
);

return enrichedResults;
