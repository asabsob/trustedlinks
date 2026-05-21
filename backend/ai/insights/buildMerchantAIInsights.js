export function buildMerchantAIInsights({
  business,
  reports,
  liveContext = {},
}) {
  const insights = [];

  // ===========================================================================
  // Missing Description
  // ===========================================================================

  if (!business?.description && !business?.description_ar) {
    insights.push({
      type: "warning",
      priority: "high",

      title_ar: "الوصف ناقص",
      title_en: "Missing Description",

      text_ar:
        "أضف وصفًا واضحًا لنشاطك لتحسين الظهور داخل TrustedLinks.",

      text_en:
        "Add a clear business description to improve visibility inside TrustedLinks.",
    });
  }

  // ===========================================================================
  // Missing Location
  // ===========================================================================

  if (
    !business?.mapLink &&
    !business?.latitude &&
    !business?.longitude
  ) {
    insights.push({
      type: "warning",
      priority: "high",

      title_ar: "الموقع غير مكتمل",
      title_en: "Missing Location",

      text_ar:
        "إضافة الموقع تساعدك على الظهور في البحث القريب داخل TrustedLinks.",

      text_en:
        "Adding your location improves nearby visibility inside TrustedLinks.",
    });
  }

  // ===========================================================================
  // Nearby Leads Low
  // ===========================================================================

  if (
    Number(reports?.nearby_starts || 0) === 0
  ) {
    insights.push({
      type: "opportunity",
      priority: "medium",

      title_ar: "الظهور القريب منخفض",
      title_en: "Low Nearby Visibility",

      text_ar:
        "لا توجد طلبات nearby حاليًا. ننصح بتحسين الموقع والكلمات المحلية.",

      text_en:
        "No nearby requests detected. Improve location and local keywords.",
    });
  }

  // ===========================================================================
  // Strong Direct Performance
  // ===========================================================================

  if (
    Number(reports?.direct_starts || 0) >= 10
  ) {
    insights.push({
      type: "success",
      priority: "low",

      title_ar: "العلامة التجارية قوية",
      title_en: "Strong Brand Recognition",

      text_ar:
        "طلبات direct مرتفعة، مما يدل أن العملاء يبحثون باسم النشاط مباشرة.",

      text_en:
        "Direct requests are strong, meaning customers search your business name directly.",
    });
  }

  // ===========================================================================
  // Wallet Low
  // ===========================================================================

  if (
    Number(business?.wallet_balance || 0) < 5
  ) {
    insights.push({
      type: "wallet",
      priority: "critical",

      title_ar: "الرصيد منخفض",
      title_en: "Low Wallet Balance",

      text_ar:
        "اشحن المحفظة لتجنب توقف استقبال طلبات التواصل المدفوعة.",

      text_en:
        "Recharge wallet to avoid interruption in paid contact requests.",
    });
  }

  // ===========================================================================
  // Performance Score
  // ===========================================================================

  if (
    Number(liveContext?.performanceScore || 0) >= 80
  ) {
    insights.push({
      type: "success",
      priority: "low",

      title_ar: "أداء ممتاز",
      title_en: "Excellent Performance",

      text_ar:
        "أداء النشاط قوي داخل TrustedLinks مقارنة بالفترة الحالية.",

      text_en:
        "Business performance is strong inside TrustedLinks.",
    });
  }

  return insights.slice(0, 6);
}
