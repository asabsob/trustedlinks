import express from "express";
import supabase from "../db/postgres.js";

import {
  requireCampaignManager,
} from "../middleware/auth.js";

const router = express.Router();

// ========================================
// FINANCE OVERVIEW
// ========================================
router.get(
  "/finance",
  requireCampaignManager,
  async (req, res) => {
    try {
      const ownerId = req.campaignOwner.ownerId;

      // campaigns
      const { data: campaigns, error: campaignsError } =
        await supabase
          .from("campaigns")
          .select("*")
          .eq("owner_id", ownerId);

      if (campaignsError) throw campaignsError;

      const campaignIds = (campaigns || []).map((c) => c.id);

      let fundingCodes = [];
      let claims = [];
      let transactions = [];

      if (campaignIds.length) {
        // funding codes
        const { data: codesData } = await supabase
          .from("funding_codes")
          .select("*")
          .in("campaign_id", campaignIds);

        fundingCodes = codesData || [];

        // transactions
        const { data: txData } = await supabase
          .from("campaign_transactions")
          .select("*")
          .in("campaign_id", campaignIds);

        transactions = txData || [];

        // claims
        const codeIds = fundingCodes.map((f) => f.id);

        if (codeIds.length) {
          const { data: claimsData } = await supabase
            .from("campaign_claims")
            .select("*")
            .in("funding_code_id", codeIds);

          claims = claimsData || [];
        }
      }

      // calculations
      const totalBudget = campaigns.reduce(
        (sum, c) => sum + Number(c.total_budget || 0),
        0
      );

      const remainingBudget = campaigns.reduce(
        (sum, c) => sum + Number(c.remaining_budget || 0),
        0
      );

      const usedBudget =
        totalBudget - remainingBudget;

      const totalClaims = claims.length;

      const totalFundingCodes =
        fundingCodes.length;

      const activeFundingCodes =
        fundingCodes.filter(
          (f) => f.status === "active"
        ).length;

      const totalParticipants =
        new Set(
          claims.map((c) => c.business_id)
        ).size;

      const totalTransactions =
        transactions.length;

      const totalSpent = transactions
        .filter(
          (t) =>
            t.transaction_type ===
            "campaign_lead_charge"
        )
        .reduce(
          (sum, t) =>
            sum + Number(t.amount || 0),
          0
        );

      return res.json({
        ok: true,

        finance: {
          totalBudget,
          remainingBudget,
          usedBudget,
          totalSpent,
        },

        analytics: {
          totalCampaigns: campaigns.length,
          totalFundingCodes,
          activeFundingCodes,
          totalClaims,
          totalParticipants,
          totalTransactions,
        },
      });
    } catch (err) {
      console.error(
        "CAMPAIGN FINANCE ERROR:",
        err
      );

      return res.status(500).json({
        error:
          "Failed to load campaign finance analytics",
      });
    }
  }
);

// ========================================
// PARTICIPANTS
// ========================================
router.get(
  "/participants",
  requireCampaignManager,
  async (req, res) => {
    try {
      const ownerId = req.campaignOwner.ownerId;

      // campaigns
      const { data: campaigns } =
        await supabase
          .from("campaigns")
          .select("id")
          .eq("owner_id", ownerId);

      const campaignIds = (campaigns || []).map(
        (c) => c.id
      );

      if (!campaignIds.length) {
        return res.json({
          ok: true,
          participants: [],
        });
      }

      // codes
      const { data: fundingCodes } =
        await supabase
          .from("funding_codes")
          .select("id")
          .in("campaign_id", campaignIds);

      const codeIds = (fundingCodes || []).map(
        (f) => f.id
      );

      if (!codeIds.length) {
        return res.json({
          ok: true,
          participants: [],
        });
      }

      // claims
      const { data: claims } =
        await supabase
          .from("campaign_claims")
          .select("*")
          .in("funding_code_id", codeIds);

      const businessIds = [
        ...new Set(
          (claims || []).map(
            (c) => c.business_id
          )
        ),
      ];

      if (!businessIds.length) {
        return res.json({
          ok: true,
          participants: [],
        });
      }

      // businesses
      const { data: businesses } =
        await supabase
          .from("businesses")
          .select("*")
          .in("id", businessIds);

      return res.json({
        ok: true,
        participants: businesses || [],
      });
    } catch (err) {
      console.error(
        "CAMPAIGN PARTICIPANTS ERROR:",
        err
      );

      return res.status(500).json({
        error:
          "Failed to load participants",
      });
    }
  }
);

export default router;
