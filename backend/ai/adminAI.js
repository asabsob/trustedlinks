import express from "express";
import supabase from "../../db/postgres.js";
import { requireAdmin } from "../../middleware/auth.js";
import { buildSystemHealthInsights } from "../../ai/operations/buildSystemHealthInsights.js";
import { buildAdminOpsSummary } from "../../ai/operations/buildAdminOpsSummary.js";

const router = express.Router();

router.get("/admin/system-health", requireAdmin, async (req, res) => {
  try {
    const language = req.query.language || "ar";

    const { data: businesses } = await supabase
      .from("businesses")
      .select("id,name,name_ar,wallet_balance,wallet_currency,status")
      .limit(500);

    const { data: leadClicks } = await supabase
      .from("lead_clicks")
      .select("id,business_id,billing_applied,billing_amount,intent_type,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: transactions } = await supabase
      .from("business_transactions")
      .select("id,business_id,type,amount,currency,event_type,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const stats = {
      businessesCount: businesses?.length || 0,
      recentLeadClicks: leadClicks?.length || 0,
      paidLeadClicks:
        leadClicks?.filter((x) => x.billing_applied)?.length || 0,
      recentTransactions: transactions?.length || 0,
    };

    const alerts = buildSystemHealthInsights({
      businesses: businesses || [],
      leadClicks: leadClicks || [],
      transactions: transactions || [],
      aiLogs: [],
      webhookStats: {},
    });

    const aiSummary = await buildAdminOpsSummary({
      alerts,
      stats,
      language,
    });

    return res.json({
      success: true,
      stats,
      alerts,
      summary: aiSummary.success ? aiSummary.result : "",
    });
  } catch (error) {
    console.error("ADMIN_AI_SYSTEM_HEALTH_ERROR", error);

    return res.status(500).json({
      error: "Admin AI system health failed",
      details: error.message,
    });
  }
});

export default router;
