export function buildSystemHealthInsights({
  businesses = [],
  leadClicks = [],
  transactions = [],
  aiLogs = [],
  webhookStats = {},
}) {
  const alerts = [];

  const lowWalletBusinesses = businesses.filter(
    (b) => Number(b.wallet_balance || 0) < 5
  );

  if (lowWalletBusinesses.length > 0) {
    alerts.push({
      type: "wallet",
      level: lowWalletBusinesses.length >= 10 ? "high" : "medium",
      title_ar: "أنشطة برصيد منخفض",
      title_en: "Low Wallet Businesses",
      message_ar: `${lowWalletBusinesses.length} نشاط قد يتوقف عن استقبال طلبات التواصل المدفوعة.`,
      message_en: `${lowWalletBusinesses.length} businesses may stop receiving paid contact requests.`,
    });
  }

  const recentPaidLeads = leadClicks.filter((x) => x.billing_applied);

  if (recentPaidLeads.length === 0) {
    alerts.push({
      type: "leads",
      level: "medium",
      title_ar: "لا توجد طلبات مدفوعة حديثة",
      title_en: "No Recent Paid Leads",
      message_ar: "قد يكون هناك ضعف في البحث أو مشكلة في تتبع الروابط.",
      message_en: "This may indicate weak search activity or link tracking issues.",
    });
  }

  const failedAI = aiLogs.filter((x) => x.status === "failed");

  if (failedAI.length > 0) {
    alerts.push({
      type: "ai",
      level: "medium",
      title_ar: "فشل في طلبات الذكاء الاصطناعي",
      title_en: "AI Failures Detected",
      message_ar: `${failedAI.length} طلب AI فشل مؤخرًا.`,
      message_en: `${failedAI.length} AI requests failed recently.`,
    });
  }

  if (Number(webhookStats.failed || 0) > 0) {
    alerts.push({
      type: "whatsapp",
      level: "high",
      title_ar: "مشاكل في WhatsApp Webhook",
      title_en: "WhatsApp Webhook Issues",
      message_ar: "يوجد فشل في بعض طلبات الويب هوك.",
      message_en: "Some webhook requests are failing.",
    });
  }

  return alerts;
}
