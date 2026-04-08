import { expandTerms } from "./synonyms.js";
import { listActiveBusinesses } from "../services/pg/businesses.js";

function matchesBusiness(item, regexList) {
  const fields = [
    item?.name || "",
    item?.name_ar || "",
    item?.description || "",
    ...(Array.isArray(item?.keywords) ? item.keywords : []),
    ...(Array.isArray(item?.keywords_ar) ? item.keywords_ar : []),
    ...(Array.isArray(item?.category) ? item.category : []),
  ].map((v) => String(v || ""));

  return regexList.some((rx) => fields.some((field) => rx.test(field)));
}

export async function searchBusinesses(query) {
  const terms = expandTerms(query || "");
  const regexList = terms.map((term) => new RegExp(term, "i"));

  const businesses = await listActiveBusinesses();

  const results = businesses
    .filter((item) => matchesBusiness(item, regexList))
    .slice(0, 10);

  return results;
}
