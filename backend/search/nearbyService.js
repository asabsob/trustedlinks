import Business from "../models/Business.js";
import { expandTerms } from "./synonyms.js";

export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function findNearestBusinesses(lat, lng, limit = 5, categoryQuery = "") {
  const mongoQuery = {
    status: "Active",
    latitude: { $ne: null },
    longitude: { $ne: null },
  };

  let businesses = await Business.find(mongoQuery).lean();

  if (categoryQuery) {
    const terms = expandTerms(categoryQuery);
    const regexList = terms.map((term) => new RegExp(term, "i"));

    businesses = businesses.filter((b) => {
      const name = b.name || "";
      const nameAr = b.name_ar || "";
      const desc = b.description || "";
      const category = Array.isArray(b.category) ? b.category : [];
      const keywords = Array.isArray(b.keywords) ? b.keywords : [];

      return regexList.some((rx) => {
        return (
          rx.test(name) ||
          rx.test(nameAr) ||
          rx.test(desc) ||
          category.some((c) => rx.test(c)) ||
          keywords.some((k) => rx.test(k))
        );
      });
    });
  }

  const sorted = businesses
    .map((b) => ({
      ...b,
      distanceKm: distanceKm(lat, lng, b.latitude, b.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return sorted.slice(0, limit);
}
