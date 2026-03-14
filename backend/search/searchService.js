import Business from "../models/Business.js";
import { expandTerms } from "./synonyms.js";

export async function searchBusinesses(query) {
  const rawQuery = String(query || "").trim();
  if (!rawQuery) return [];

  const terms = expandTerms(rawQuery).filter(Boolean);

  const escapedTerms = terms.map((term) =>
    String(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  const regexList = escapedTerms.map((term) => new RegExp(term, "i"));
  const mainRegex = new RegExp(
    rawQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i"
  );

  const results = await Business.find({
    status: "Active",
    $or: [
      { name: mainRegex },
      { name_ar: mainRegex },
      { description: mainRegex },
      { keywords: { $in: regexList } },
      { category: { $in: regexList } },
    ],
  })
    .limit(10)
    .lean();

  return results;
}
