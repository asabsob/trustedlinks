import express from "express";
import crypto from "crypto";

import supabase from "../db/postgres.js";
import { requireUser } from "../middleware/auth.js";

import {
  requireCampaignManager,
  requireUser,
} from "../middleware/auth.js";

const router = express.Router();

function generateCode(prefix = "CODE") {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${prefix}-${random}`;
}

// =====================================
// GENERATE FUNDING CODE
// =====================================
router.post(
  "/generate",
  requireCampaignManager,
  async (req, res) => {
    try {
      const ownerId = req.campaignOwner.ownerId;

      const {
        campaignId,
        prefix = "CAMPAIGN",
        creditAmount = 20,
        maxClaims = 100,
        expiresAt = null,
      } = req.body || {};

      if (!campaignId) {
        return res.status(400).json({
          error: "campaignId is required",
        });
      }

      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .eq("owner_id", ownerId)
        .maybeSingle();

      if (campaignError) throw campaignError;

      if (!campaign) {
        return res.status(404).json({
          error: "Campaign not found",
        });
      }

      const code = generateCode(prefix);

      const { data: fundingCode, error } = await supabase
        .from("funding_codes")
        .insert({
          campaign_id: campaignId,
          code,
          credit_amount: Number(creditAmount || 20),
          max_claims: Number(maxClaims || 100),
          used_claims: 0,
          status: "active",
          expires_at: expiresAt,
        })
        .select("*")
        .single();

      if (error) throw error;

      return res.status(201).json({
        ok: true,
        fundingCode,
      });
    } catch (err) {
      console.error("GENERATE FUNDING CODE ERROR:", err);

      return res.status(500).json({
        error: "Failed to generate funding code",
      });
    }
  }
);

// =====================================
// LIST FUNDING CODES
// =====================================
router.get("/", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("owner_id", ownerId);

    if (campaignsError) throw campaignsError;

    const campaignIds = (campaigns || []).map((c) => c.id);

    if (!campaignIds.length) {
      return res.json({
        ok: true,
        fundingCodes: [],
      });
    }

    const { data: fundingCodes, error } = await supabase
      .from("funding_codes")
      .select("*")
      .in("campaign_id", campaignIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      ok: true,
      fundingCodes: fundingCodes || [],
    });
  } catch (err) {
    console.error("LIST FUNDING CODES ERROR:", err);

    return res.status(500).json({
      error: "Failed to load funding codes",
    });
  }
});

// =====================================
// CLAIM FUNDING CODE
// =====================================
router.post("/claim", requireUser, async (req, res) => {
  try {
    const { code } = req.body || {};

    if (!code) {
      return res.status(400).json({
        error: "Funding code is required",
      });
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_user_id", req.user.id)
      .maybeSingle();

    if (businessError) throw businessError;

    if (!business) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    const { data: fundingCode, error: fundingCodeError } = await supabase
      .from("funding_codes")
      .select("*")
      .eq("code", String(code).trim().toUpperCase())
      .maybeSingle();

    if (fundingCodeError) throw fundingCodeError;

    if (!fundingCode) {
      return res.status(404).json({
        error: "Funding code not found",
      });
    }

    if (fundingCode.status !== "active") {
      return res.status(400).json({
        error: "Funding code is not active",
      });
    }

    if (
      fundingCode.expires_at &&
      new Date(fundingCode.expires_at) < new Date()
    ) {
      return res.status(400).json({
        error: "Funding code expired",
      });
    }

    if (
      Number(fundingCode.used_claims || 0) >=
      Number(fundingCode.max_claims || 0)
    ) {
      return res.status(400).json({
        error: "Funding code limit reached",
      });
    }

    const { data: existingClaim, error: claimCheckError } = await supabase
      .from("campaign_claims")
      .select("id")
      .eq("funding_code_id", fundingCode.id)
      .eq("business_id", business.id)
      .maybeSingle();

    if (claimCheckError) throw claimCheckError;

    if (existingClaim) {
      return res.status(400).json({
        error: "Funding code already claimed",
      });
    }

    const currentSponsoredBalance = Number(
      business.sponsored_balance || 0
    );

    const newBalance =
      currentSponsoredBalance +
      Number(fundingCode.credit_amount || 0);

    // update business
    const { error: businessUpdateError } = await supabase
      .from("businesses")
      .update({
        sponsored_balance: newBalance,
        sponsored_status: "active",
      })
      .eq("id", business.id);

    if (businessUpdateError) throw businessUpdateError;

    // insert claim
    const { error: claimInsertError } = await supabase
      .from("campaign_claims")
      .insert({
        funding_code_id: fundingCode.id,
        business_id: business.id,
        claimed_amount: fundingCode.credit_amount,
      });

    if (claimInsertError) throw claimInsertError;

    // update code usage
    const { error: usageError } = await supabase
      .from("funding_codes")
      .update({
        used_claims: Number(fundingCode.used_claims || 0) + 1,
      })
      .eq("id", fundingCode.id);

    if (usageError) throw usageError;

    return res.json({
      ok: true,
      message: "Funding code claimed successfully",
      amount: fundingCode.credit_amount,
      balance: newBalance,
    });
  } catch (err) {
    console.error("CLAIM FUNDING CODE ERROR:", err);

    return res.status(500).json({
      error: "Failed to claim funding code",
    });
  }
});

export default router;
