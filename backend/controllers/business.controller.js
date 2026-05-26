import { getBusinessByOwnerUserId } from "../services/pg/businesses.js";

function getBusinessPricing(business = {}) {
  const countryCode = String(
    business.countryCode ||
    business.country_code ||
    ""
  ).toUpperCase();

  const phone = String(
    business.whatsapp ||
    ""
  ).replace(/\D/g, "");

  if (countryCode === "JO" || phone.startsWith("962")) {
    return {
      currency: "JOD",
      direct: 0.2,
      category: 0.25,
      nearby: 0.3,
    };
  }

  if (countryCode === "QA" || phone.startsWith("974")) {
    return {
      currency: "QAR",
      direct: 1,
      category: 1.25,
      nearby: 1.5,
    };
  }

  if (countryCode === "SA" || phone.startsWith("966")) {
    return {
      currency: "SAR",
      direct: 1,
      category: 1.25,
      nearby: 1.5,
    };
  }

  if (countryCode === "AE" || phone.startsWith("971")) {
    return {
      currency: "AED",
      direct: 1,
      category: 1.25,
      nearby: 1.5,
    };
  }

  return {
    currency: "USD",
    direct: 0.25,
    category: 0.3,
    nearby: 0.4,
  };
}

export async function getCurrentBusiness(req, res) {
  try {
    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    const pricing = getBusinessPricing(business);

    const walletBalance = Number(
      business?.wallet?.balance ?? 0
    );

    const sponsoredBalance = Number(
      business?.sponsoredBalance ??
      business?.sponsored_balance ??
      0
    );

    const currency =
      business?.wallet?.currency ||
      business?.walletCurrency ||
      business?.wallet_currency ||
      pricing.currency ||
      "JOD";

    const formatted = {
      ...business,

      wallet_balance: walletBalance,
      wallet_currency: currency,
      wallet_status:
        business?.wallet?.status || "active",

      sponsored_balance: sponsoredBalance,

      sponsored_campaign_name:
        business?.sponsoredCampaignName ??
        business?.sponsored_campaign_name ??
        null,

      sponsored_status:
        business?.sponsoredStatus ??
        business?.sponsored_status ??
        "none",

      sponsored_credit_expires_at:
        business?.sponsoredCreditExpiresAt ??
        business?.sponsored_credit_expires_at ??
        null,

      total_available_balance:
        walletBalance + sponsoredBalance,

      pricing: {
        currency,
        direct: pricing.direct,
        category: pricing.category,
        nearby: pricing.nearby,
      },

      logo:
        business.logo ||
        (business.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(
          String(business.mediaLink)
        )
          ? business.mediaLink
          : null),

      whatsappLink: business.whatsapp
        ? `https://wa.me/${String(
            business.whatsapp
          ).replace(/\D/g, "")}`
        : null,
    };

    return res.json(formatted);

  } catch (e) {
    console.error("business/me error:", e);

    return res.status(500).json({
      error: "Failed to load business",
    });
  }
}
