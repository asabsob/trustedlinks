import supabase from "../../db/postgres.js";
import { runSafeAI } from "../gateway/aiGateway.js";

export async function generateDailyAISummary({
  language = "ar",
}) {
  try {
    // =========================================================================
    // Load recent AI logs
    // =========================================================================

    const { data: logs } = await supabase
      .from("ai_operation_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    // =========================================================================
    // Load recent lead activity
    // =========================================================================

    const { data: leadClicks } = await supabase
      .from("lead_clicks")
      .select(`
        billing_applied,
        intent_type,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    // =========================================================================
    // Build statistics
    // =========================================================================

    const stats = {
      totalLogs: logs?.length || 0,

      failedAI:
        logs?.filter((x) => x.status === "failed")?.length || 0,

      successfulAI:
        logs?.filter((x) => x.status === "success")?.length || 0,

      paidLeads:
        leadClicks?.filter((x) => x.billing_applied)?.length || 0,

      directLeads:
        leadClicks?.filter((x) => x.intent_type === "direct")?.length || 0,

      categoryLeads:
        leadClicks?.filter((x) => x.intent_type === "category")?.length || 0,

      nearbyLeads:
        leadClicks?.filter((x) => x.intent_type === "nearby")?.length || 0,
    };

    // =========================================================================
    // Generate AI Summary
    // =========================================================================

    const aiResult = await runSafeAI({
      role: "admin_operations",
      language,

      task: `
Act as TrustedLinks AI Operations Analyst.

Rules:
- Analyze TrustedLinks platform activity only.
- Do not mention external advertising platforms.
- Focus on operational insights.
- Focus on risks, trends, and opportunities.
- Keep summary concise and executive-friendly.

Explain:
- AI system stability
- Lead activity trends
- Search trends
- Platform health
- Operational risks
- Suggested operational focus
`,

      input: {
        stats,
      },
    });

    return {
      success: true,
      stats,
      summary: aiResult?.result || "",
    };
  } catch (error) {
    console.error("DAILY_AI_SUMMARY_ERROR", error);

    return {
      success: false,
      error: error.message,
    };
  }
}
