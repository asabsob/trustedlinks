import { listActiveBusinesses } from "../services/pg/businesses.js";
import { expandTerms } from "./synonyms.js";
import geolib from "geolib";

function matchesCategory(item, regexList) {
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

export async function findNearestBusinesses(
  lat,
  lng,
  limit = 5,
  categoryQuery = ""
) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 20));

  if (Number.isNaN(nLat) || Number.isNaN(nLng)) {
    return [];
  }

  let businesses = await listActiveBusinesses();

  // =========================
  // Filter by category (optional)
  // =========================
  if (categoryQuery?.trim()) {
    const terms = expandTerms(categoryQuery.trim())
      .map((t) => t.trim())
      .filter(Boolean);

    const regexList = terms.map((term) => new RegExp(term, "i"));

    businesses = businesses.filter((b) =>
      matchesCategory(b, regexList)
    );
  }

  // =========================
  // Distance calculation
  // =========================
  const userLocation = {
    latitude: nLat,
    longitude: nLng,
  };

  const withDistance = businesses
    .map((b) => {
      if (!b.latitude || !b.longitude) {
        return { ...b, distance: null };
      }

      const distance = geolib.getDistance(userLocation, {
        latitude: Number(b.latitude),
        longitude: Number(b.longitude),
      });

      return { ...b, distance };
    })
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    .slice(0, safeLimit);

  return withDistance;
}
