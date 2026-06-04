import {
  PRICING_TIERS,
  CATEGORY_PRICING_TIERS,
  DEFAULT_PRICING_TIER,
} from "../config/pricing.js";

function normalizeCategory(category) {
  if (Array.isArray(category)) {
    return String(category[0] || "").trim().toUpperCase();
  }

  return String(category || "").trim().toUpperCase();
}

function detectCountryCode(business = {}) {
  const countryCode = String(
    business.countryCode ||
      business.country_code ||
      ""
  ).toUpperCase();

  const phone = String(business.whatsapp || "").replace(/\D/g, "");

  if (countryCode) return countryCode;

  if (phone.startsWith("962")) return "JO";
  if (phone.startsWith("974")) return "QA";
  if (phone.startsWith("966")) return "SA";
  if (phone.startsWith("971")) return "AE";

  return "DEFAULT";
}

export function getBusinessPricing(business = {}) {
  const countryCode = detectCountryCode(business);
  const countryPricing =
    PRICING_TIERS[countryCode] || PRICING_TIERS.DEFAULT;

  const categoryKey = normalizeCategory(
    business.category ||
      business.category_key ||
      business.metaCategory ||
      business.meta_category
  );

  const tier =
    CATEGORY_PRICING_TIERS[categoryKey] ||
    DEFAULT_PRICING_TIER;

  const prices =
    countryPricing[tier] ||
    countryPricing[DEFAULT_PRICING_TIER] ||
    PRICING_TIERS.DEFAULT[DEFAULT_PRICING_TIER];

  return {
    currency: countryPricing.currency,
    tier,
    categoryKey: categoryKey || "OTHER",
    direct: prices.direct,
    category: prices.category,
    nearby: prices.nearby,
  };
}
