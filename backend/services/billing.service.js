import supabase from "../db/postgres.js";
import { getBusinessById } from "./pg/businesses.js";
import { deductBusinessWallet } from "./pg/businessWallet.js";
import { createBusinessEvent } from "./pg/businessEvents.js";

export function getBusinessPricing(business = {}) {
  const countryCode = String(
    business.countryCode || business.country_code || ""
  ).toUpperCase();

  const phone = String(business.whatsapp || "").replace(/\D/g, "");

  if (countryCode === "JO" || phone.startsWith("962")) {
    return { currency: "JOD", direct: 0.2, category: 0.25, nearby: 0.3 };
  }

  if (countryCode === "QA" || phone.startsWith("974")) {
    return { currency: "QAR", direct: 1, category: 1.25, nearby: 1.5 };
  }

  if (countryCode === "SA" || phone.startsWith("966")) {
    return { currency: "SAR", direct: 1, category: 1.25, nearby: 1.5 };
  }

  if (countryCode === "AE" || phone.startsWith("971")) {
    return { currency: "AED", direct: 1, category: 1.25, nearby: 1.5 };
  }

  return { currency: "USD", direct: 0.25, category: 0.3, nearby: 0.4 };
}

export function getConversationStartPrice(business, intentType) {
  const type = intentType || "category";
  const pricing = getBusinessPricing(business);

  if (type === "direct") return pricing.direct;
  if (type === "nearby") return pricing.nearby;

  return pricing.category;
}

export async function tryDeductFromCampaign({
  businessId,
  amount,
  intentType = "category",
  reference = "",
  meta = {},
}) {
  try {
    if (!businessId || !amount || amount <= 0) {
      return { ok: false, skipped: true };
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle();

    if (businessError) throw businessError;

    if (!business) {
      return { ok: false, error: "Business not found" };
    }

    const sponsoredBalance = Number(business.sponsored_balance || 0);

    if (sponsoredBalance < amount) {
      return { ok: false, skipped: true, reason: "No campaign balance" };
    }

    const { data: claims, error: claimsError } = await supabase
      .from("campaign_claims")
      .select(`
        id,
        funding_code_id,
        funding_codes (
          id,
          campaign_id,
          campaigns (
            id,
            remaining_budget,
            currency,
            status
          )
        )
      `)
      .eq("business_id", businessId)
      .order("claimed_at", { ascending: false })
      .limit(1);

    if (claimsError) throw claimsError;

    const claim = claims?.[0];
    const campaign = claim?.funding_codes?.campaigns;

    if (!campaign || campaign.status !== "active") {
      return { ok: false, skipped: true, reason: "No active campaign" };
    }

    const campaignRemaining = Number(campaign.remaining_budget || 0);

    if (campaignRemaining < amount) {
      return { ok: false, skipped: true, reason: "Campaign budget insufficient" };
    }

    const newSponsoredBalance = sponsoredBalance - amount;
    const newCampaignRemaining = campaignRemaining - amount;

    const { error: businessUpdateError } = await supabase
      .from("businesses")
      .update({ sponsored_balance: newSponsoredBalance })
      .eq("id", businessId);

    if (businessUpdateError) throw businessUpdateError;

    const { error: campaignUpdateError } = await supabase
      .from("campaigns")
      .update({ remaining_budget: newCampaignRemaining })
      .eq("id", campaign.id);

    if (campaignUpdateError) throw campaignUpdateError;

    const { error: txError } = await supabase
      .from("campaign_transactions")
      .insert({
        campaign_id: campaign.id,
        business_id: businessId,
        amount,
        currency: campaign.currency || "JOD",
        transaction_type: "campaign_lead_charge",
        reference_id: reference,
        metadata: {
          ...meta,
          intentType,
          source: "lead_billing",
        },
      });

    if (txError) throw txError;

    return {
      ok: true,
      chargedFrom: "campaign",
      amount,
      sponsoredBalanceAfter: newSponsoredBalance,
      campaignRemainingAfter: newCampaignRemaining,
      currency: campaign.currency || "JOD",
    };
  } catch (err) {
    console.error("CAMPAIGN DEDUCT ERROR:", err);
    return { ok: false, skipped: true, error: err.message };
  }
}

export async function deductWalletBalance({
  ownerUserId,
  businessId = null,
  intentType = "category",
  reason,
  reference = "",
  meta = {},
}) {
  try {
    if (!businessId) {
      return { ok: false, error: "businessId required" };
    }

    const business = await getBusinessById(businessId);

    if (!business) {
      return { ok: false, error: "Business not found" };
    }

    const finalIntentType = intentType || "category";
    const amount = getConversationStartPrice(business, finalIntentType);

    if (!amount || amount <= 0) {
      return { ok: true, skipped: true, reason: "No charge for this event" };
    }

    const campaignDeduct = await tryDeductFromCampaign({
      businessId,
      amount,
      intentType: finalIntentType,
      reference,
      meta: {
        ...meta,
        ownerUserId,
      },
    });

    if (campaignDeduct.ok) {
      return campaignDeduct;
    }

    const result = await deductBusinessWallet({
      businessId,
      amount,
      eventType: `conversation_start_${finalIntentType}`,
      note: reason,
      meta: {
        ...meta,
        reference,
        ownerUserId,
        intentType: finalIntentType,
      },
    });

    return {
      ok: true,
      amount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      currency: getBusinessPricing(business).currency,
      isNegative: Number(result.balanceAfter) < 0,
    };
  } catch (e) {
    if (e.message === "INSUFFICIENT_BALANCE") {
      return {
        ok: false,
        insufficient: true,
        balanceBefore: 0,
        balanceAfter: 0,
      };
    }

    console.error("deductWalletBalance error:", e);
    return { ok: false, error: "Deduction failed" };
  }
}

export async function logBusinessEvent({
  businessId,
  ownerUserId,
  type,
  source = "",
  meta = {},
}) {
  try {
    await createBusinessEvent({
      businessId,
      ownerUserId: String(ownerUserId || ""),
      type,
      source,
      meta,
    });
  } catch (e) {
    console.error("logBusinessEvent error:", e);
  }
}
