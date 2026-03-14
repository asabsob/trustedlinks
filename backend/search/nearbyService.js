import Business from "../models/Business.js"

export function distanceKm(lat1, lon1, lat2, lon2) {

  const R = 6371

  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}


export async function findNearestBusinesses(lat, lng, limit = 5) {

  const businesses = await Business.find({
    status: "Active",
    latitude: { $ne: null },
    longitude: { $ne: null }
  }).lean()

  const sorted = businesses
    .map(b => {

      const d = distanceKm(
        lat,
        lng,
        b.latitude,
        b.longitude
      )

      return {
        ...b,
        distanceKm: d
      }

    })
    .sort((a, b) => a.distanceKm - b.distanceKm)

  return sorted.slice(0, limit)

}
