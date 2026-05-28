import { getBusinessByOwnerUserId } from "../services/pg/businesses.js";
import supabase from "../db/postgres.js";

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

function toSafeCategoryValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "").trim();
}

export async function getBusinessReports(req, res) {
  try {
    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const businessId = String(business.id);

    const { data: rows, error } = await supabase
      .from("transactions")
      .select("type, amount, reason, event_type, created_at, status, currency")
      .eq("business_id", businessId)
      .eq("type", "debit")
      .eq("status", "completed")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("business/reports transactions fetch error:", error);
      return res.status(500).json({ error: "Failed to load reports" });
    }

    const safeRows = Array.isArray(rows) ? rows : [];

    let directStarts = 0;
    let categoryStarts = 0;
    let nearbyStarts = 0;
    let estimatedRevenue = 0;

    const activityMap = {};

    for (const row of safeRows) {
      const amount = Number(row.amount || 0);
      estimatedRevenue += amount;

      const eventType = String(row.event_type || "").toLowerCase();
      const reason = String(row.reason || "").toLowerCase();

      let intent = "direct";

      if (eventType.includes("category") || reason.includes("category")) {
        intent = "category";
      } else if (eventType.includes("nearby") || reason.includes("nearby")) {
        intent = "nearby";
      }

      if (intent === "direct") directStarts += 1;
      if (intent === "category") categoryStarts += 1;
      if (intent === "nearby") nearbyStarts += 1;

      const date = new Date(row.created_at).toISOString().slice(0, 10);

      if (!activityMap[date]) {
        activityMap[date] = {
          date,
          direct: 0,
          category: 0,
          nearby: 0,
          total: 0,
        };
      }

      activityMap[date][intent] += 1;
      activityMap[date].total += 1;
    }

    const totalBilledConversations =
      directStarts + categoryStarts + nearbyStarts;

    const activity = Object.values(activityMap);
    const pricing = getBusinessPricing(business);

    return res.json({
      business: business.name || "Business",

      logo:
        business.logo ||
        (business.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(
          String(business.mediaLink)
        )
          ? business.mediaLink
          : null),

      category: Array.isArray(business.category)
        ? business.category.join(", ")
        : toSafeCategoryValue(business.category) || "Category",

      direct_starts: directStarts,
      category_starts: categoryStarts,
      nearby_starts: nearbyStarts,
      total_billed_conversations: totalBilledConversations,
      estimated_revenue: Number(estimatedRevenue.toFixed(2)),
      currency: business.wallet_currency || business.wallet?.currency || "USD",

      pricing: {
        currency: pricing.currency,
        direct: pricing.direct,
        category: pricing.category,
        nearby: pricing.nearby,
      },

      activity,
      hourly: [],
      keywords: [],
      peakHour: null,
      peakDay: null,
      weeklyGrowth: 0,

      sources: [
        { name_en: "Direct", name_ar: "مباشر", value: directStarts },
        { name_en: "Category", name_ar: "فئة", value: categoryStarts },
        { name_en: "Nearby", name_ar: "قريب", value: nearbyStarts },
      ],
    });
  } catch (e) {
    console.error("business/reports error:", e);
    return res.status(500).json({ error: "Failed" });
  }
}
