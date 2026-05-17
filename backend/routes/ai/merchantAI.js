// ============================================================================
// TrustedLinks AI - Merchant Assistant Route
// ============================================================================

import express from "express";

import { merchantAssistantAgent } from "../../ai/agents/merchantAssistantAgent.js";

import { requireUser } from "../../middleware/auth.js";

import { getBusinessByOwnerUserId } from "../../services/pg/businesses.js";

import supabase from "../../db/postgres.js";

const router = express.Router();

// ============================================================================
// Merchant AI Assistant
// ============================================================================

router.post("/merchant/assistant", requireUser, async (req, res) => {
  try {
    const language = req.body.language || "ar";
    const pageContext = req.body.pageContext || "dashboard";

    // =========================================================================
    // Load business
    // =========================================================================

    const business = await getBusinessByOwnerUserId(
      String(req.user.id)
    );

    if (!business) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    // =========================================================================
    // Load reports
    // =========================================================================

    const { data: leadClicks } = await supabase
      .from("lead_clicks")
      .select(`
        intent_type,
        billing_applied,
        billing_amount,
        created_at
      `)
      .eq("business_id", business.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(100);

    const reports = {
      total_billed_conversations:
        leadClicks?.filter((x) => x.billing_applied)?.length || 0,

      direct_starts:
        leadClicks?.filter(
          (x) => x.intent_type === "direct"
        )?.length || 0,

      category_starts:
        leadClicks?.filter(
          (x) => x.intent_type === "category"
        )?.length || 0,

      nearby_starts:
        leadClicks?.filter(
          (x) => x.intent_type === "nearby"
        )?.length || 0,

      estimated_revenue:
        leadClicks?.reduce(
          (sum, x) => sum + Number(x.billing_amount || 0),
          0
        ) || 0,

      currency:
        business.wallet_currency || "JOD",
    };

    // =========================================================================
    // Run AI Assistant
    // =========================================================================

    const aiResult = await merchantAssistantAgent({
      business,
      reports,
      pageContext,
      language,
    });

    if (!aiResult.success) {
      return res.status(500).json({
        error: aiResult.error || "AI failed",
      });
    }

    return res.json({
      success: true,
      message: aiResult.result,
    });
  } catch (error) {
    console.error("MERCHANT_AI_ROUTE_ERROR", error);

    return res.status(500).json({
      error: "Merchant AI assistant failed",
      details: error.message,
    });
  }
});

export default router;
