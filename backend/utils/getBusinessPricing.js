import { COUNTRY_PRICING } from "../config/pricing.js";

export function getBusinessPricing(business = {}) {
  const country =
    String(
      business.countryCode ||
      business.country_code ||
      ""
    ).toUpperCase();

  return (
    COUNTRY_PRICING[country] ||
    COUNTRY_PRICING.DEFAULT
  );
}
