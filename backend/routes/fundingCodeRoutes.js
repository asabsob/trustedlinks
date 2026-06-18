import express from "express";
import crypto from "crypto";

import supabase from "../db/postgres.js";


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

      if (
  campaign.status !== "active" ||
  campaign.approval_status !== "approved"
) {
  return res.status(403).json({
    error: "Campaign must be approved by admin before generating funding codes",
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

   const normalizedCode = String(code || "").trim().toUpperCase();

console.log("CLAIM CODE RAW:", code);
console.log("CLAIM CODE NORMALIZED:", normalizedCode);

const { data: fundingCode, error: fundingCodeError } = await supabase
  .from("funding_codes")
  .select("*")
  .ilike("code", normalizedCode)
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

    // update business
      const { data: pendingClaim, error: claimInsertError } = await supabase
      .from("campaign_claims")
      .insert({
        funding_code_id: fundingCode.id,
        campaign_id: fundingCode.campaign_id,
        business_id: business.id,
        code: fundingCode.code,
        claimed_amount: fundingCode.credit_amount,
        status: "pending_approval",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (claimInsertError) throw claimInsertError;

    return res.status(202).json({
      ok: true,
      status: "pending_approval",
      message: "Funding code request submitted and is pending funder approval",
      claim: pendingClaim,
    });

  } catch (err) {
    console.error("CLAIM FUNDING CODE ERROR:", err);

    return res.status(500).json({
      error: "Failed to claim funding code",
    });
  }
});

// =====================================
// LIST PENDING FUNDING CLAIMS
// =====================================
router.get("/claims/pending", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

   const { data, error } = await supabase
  .from("campaign_claims")
  .select("*")
  .eq("status", "pending_approval")
  .order("created_at", { ascending: false });
    
    if (error) throw error;

    const claims = (data || []).filter(
      (claim) => claim.campaigns?.owner_id === ownerId
    );

 return res.json({
  ok: true,
  claims: data || [],
});
  } catch (err) {
   console.error(
  "LIST PENDING FUNDING CLAIMS ERROR:",
  JSON.stringify(err, null, 2)
);
    return res.status(500).json({
      error: "Failed to load pending claims",
    });
  }
});

// =====================================
// APPROVE FUNDING CLAIM
// =====================================
router.post("/claims/:id/approve", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;
    const claimId = req.params.id;

    const { data: claim, error: claimError } = await supabase
      .from("campaign_claims")
      .select(`
        *,
        campaigns(id, owner_id),
        funding_codes(id, used_claims, max_claims)
      `)
      .eq("id", claimId)
      .maybeSingle();

    if (claimError) throw claimError;

    if (!claim) {
      return res.status(404).json({
        error: "Claim not found",
      });
    }

    if (claim.campaigns?.owner_id !== ownerId) {
      return res.status(403).json({
        error: "Not allowed to approve this claim",
      });
    }

    if (claim.status !== "pending_approval") {
      return res.status(400).json({
        error: "Claim is not pending approval",
      });
    }

    if (
      Number(claim.funding_codes?.used_claims || 0) >=
      Number(claim.funding_codes?.max_claims || 0)
    ) {
      return res.status(400).json({
        error: "Funding code limit reached",
      });
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, sponsored_balance")
      .eq("id", claim.business_id)
      .maybeSingle();

    if (businessError) throw businessError;

    if (!business) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    const newSponsoredBalance =
      Number(business.sponsored_balance || 0) +
      Number(claim.claimed_amount || 0);

    const { error: businessUpdateError } = await supabase
      .from("businesses")
      .update({
        sponsored_balance: newSponsoredBalance,
        sponsored_status: "active",
      })
      .eq("id", business.id);

    if (businessUpdateError) throw businessUpdateError;

    const { error: claimUpdateError } = await supabase
      .from("campaign_claims")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.id)
      .eq("status", "pending_approval");

    if (claimUpdateError) throw claimUpdateError;

    const { error: codeUpdateError } = await supabase
      .from("funding_codes")
      .update({
        used_claims: Number(claim.funding_codes?.used_claims || 0) + 1,
      })
      .eq("id", claim.funding_code_id);

    if (codeUpdateError) throw codeUpdateError;

    return res.json({
      ok: true,
      message: "Funding claim approved and credit applied",
      amount: claim.claimed_amount,
      balance: newSponsoredBalance,
    });
  } catch (err) {
    console.error("APPROVE FUNDING CLAIM ERROR:", err);
    return res.status(500).json({
      error: "Failed to approve funding claim",
    });
  }
});

// =====================================
// REJECT FUNDING CLAIM
// =====================================
router.post("/claims/:id/reject", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;
    const claimId = req.params.id;
    const { reason = "" } = req.body || {};

    const { data: claim, error: claimError } = await supabase
      .from("campaign_claims")
      .select(`
        *,
        campaigns(id, owner_id)
      `)
      .eq("id", claimId)
      .maybeSingle();

    if (claimError) throw claimError;

    if (!claim) {
      return res.status(404).json({
        error: "Claim not found",
      });
    }

    if (claim.campaigns?.owner_id !== ownerId) {
      return res.status(403).json({
        error: "Not allowed to reject this claim",
      });
    }

    if (claim.status !== "pending_approval") {
      return res.status(400).json({
        error: "Claim is not pending approval",
      });
    }

    const { error: updateError } = await supabase
      .from("campaign_claims")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claim.id)
      .eq("status", "pending_approval");

    if (updateError) throw updateError;

    return res.json({
      ok: true,
      message: "Funding claim rejected",
    });
  } catch (err) {
    console.error("REJECT FUNDING CLAIM ERROR:", err);
    return res.status(500).json({
      error: "Failed to reject funding claim",
    });
  }
});

export default router;
