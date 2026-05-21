// ============================================================================
// TrustedLinks AI - Merchant Assistant Route
// ============================================================================

import express from "express";
import { merchantAssistantAgent } from "../../ai/agents/merchantAssistantAgent.js";
import { requireUser } from "../../middleware/auth.js";
import { getBusinessByOwnerUserId } from "../../services/pg/businesses.js";
import supabase from "../../db/postgres.js";

const router = express.Router();

router.post("/merchant/assistant", requireUser, async (req, res) => {
  try {
    const language = req.body.language || "ar";
    const pageContext = req.body.pageContext || "dashboard";
    const question = req.body.question || "";
    const liveContext = req.body.liveContext || {};

    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    const { data: leadClicks } = await supabase
      .from("lead_clicks")
      .select(`
        intent_type,
        billing_applied,
        billing_amount,
        created_at
      `)
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const reports = {
      total_billed_conversations:
        leadClicks?.filter((x) => x.billing_applied)?.length || 0,

      direct_starts:
        leadClicks?.filter((x) => x.intent_type === "direct")?.length || 0,

      category_starts:
        leadClicks?.filter((x) => x.intent_type === "category")?.length || 0,

      nearby_starts:
        leadClicks?.filter((x) => x.intent_type === "nearby")?.length || 0,

      estimated_revenue:
        leadClicks?.reduce(
          (sum, x) => sum + Number(x.billing_amount || 0),
          0
        ) || 0,

      currency: business.wallet_currency || "JOD",
    };

    const aiResult = await merchantAssistantAgent({
      business,
      reports,
      pageContext,
      language,
      question,
      liveContext,
    });

    if (!aiResult.success) {
      return res.status(500).json({
        error: aiResult.error || "AI failed",
      });
    }

    return res.json({
      success: true,
      message: aiResult.result,
      insights: buildMerchantInsights({ business, reports }),
    });
  } catch (error) {
    console.error("MERCHANT_AI_ROUTE_ERROR", error);

    return res.status(500).json({
      error: "Merchant AI assistant failed",
      details: error.message,
    });
  }
});

function buildMerchantInsights({ business, reports }) {
  const insights = [];

  if (!business?.description && !business?.description_ar) {
    insights.push({
      type: "warning",
      title: "الوصف ناقص",
      text: "أضف وصفًا واضحًا لنشاطك لتحسين الظهور في البحث.",
    });
  }

  if (!business?.mapLink && !business?.latitude && !business?.longitude) {
    insights.push({
      type: "warning",
      title: "الموقع غير مكتمل",
      text: "إضافة الموقع تساعدك على الظهور في نتائج البحث القريبة.",
    });
  }

  if (Number(reports?.nearby_starts || 0) > 0) {
    insights.push({
      type: "success",
      title: "ظهور محلي جيد",
      text: "لديك طلبات من البحث القريب، وهذا مؤشر جيد لموقع النشاط.",
    });
  }

  if (
    Number(reports?.category_starts || 0) >
    Number(reports?.direct_starts || 0)
  ) {
    insights.push({
      type: "opportunity",
      title: "فرصة تحسين الكلمات",
      text: "طلبات الفئة أعلى من المباشرة، حسّن الكلمات المفتاحية لزيادة الظهور.",
    });
  }

  if (Number(business?.wallet_balance || 0) < 5) {
    insights.push({
      type: "wallet",
      title: "الرصيد منخفض",
      text: "اشحن الرصيد لتجنب توقف استقبال العملاء المحتملين.",
    });
  }

  return insights.slice(0, 4);
}

export default router;
