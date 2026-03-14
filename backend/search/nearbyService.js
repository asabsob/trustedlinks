import Business from "../models/Business.js";
import { expandTerms } from "./synonyms.js";

export async function findNearestBusinesses(lat, lng, limit = 5, categoryQuery = "") {
  const nLat = Number(lat);
  const nLng = Number(lng);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 20));

  if (Number.isNaN(nLat) || Number.isNaN(nLng)) {
    return [];
  }

  const query = {
    status: "Active",
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [nLng, nLat],
        },
      },
    },
  };

  if (categoryQuery?.trim()) {
    const terms = expandTerms(categoryQuery.trim())
      .map((t) => t.trim())
      .filter(Boolean);

    query.$or = terms.flatMap((term) => {
      const rx = new RegExp(term, "i");
      return [
        { name: rx },
        { name_ar: rx },
        { description: rx },
        { category: rx },
        { keywords: rx },
      ];
    });
  }

  const businesses = await Business.find(query)
    .select("name name_ar description category keywords whatsapp city location")
    .limit(safeLimit)
    .lean();

  return businesses;
}
