export function buildAIFraudInsights({ signals = [], leadClicks = [] }) {
  const alerts = [];

  const paidClicks = leadClicks.filter((x) => x.billing_applied);

  if (paidClicks.length >= 100) {
    alerts.push({
      type: "fraud",
      severity: "high",
      title_ar: "ارتفاع غير معتاد في الطلبات المدفوعة",
      title_en: "Unusual Paid Lead Spike",
      message_ar: "يوجد ارتفاع كبير في طلبات التواصل المدفوعة خلال الفترة الأخيرة.",
      message_en: "A large spike in paid contact requests was detected recently.",
    });
  }

  const nearbyClicks = leadClicks.filter((x) => x.intent_type === "nearby");

  if (leadClicks.length > 20 && nearbyClicks.length / leadClicks.length > 0.85) {
    alerts.push({
      type: "fraud",
      severity: "medium",
      title_ar: "نشاط nearby غير طبيعي",
      title_en: "Abnormal Nearby Activity",
      message_ar: "نسبة طلبات البحث القريب مرتفعة بشكل غير معتاد.",
      message_en: "Nearby request ratio appears unusually high.",
    });
  }

  const repeatedPhones = {};
  for (const click of leadClicks) {
    const key = click.user_phone_hash;
    if (!key) continue;
    repeatedPhones[key] = (repeatedPhones[key] || 0) + 1;
  }

  const suspiciousRepeatedUsers = Object.values(repeatedPhones).filter(
    (count) => count >= 10
  ).length;

  if (suspiciousRepeatedUsers > 0) {
    alerts.push({
      type: "fraud",
      severity: "medium",
      title_ar: "تكرار مستخدمين مشبوه",
      title_en: "Suspicious Repeated Users",
      message_ar: "تم رصد مستخدمين لديهم تكرار مرتفع في فتح روابط التواصل.",
      message_en: "Some users show unusually repeated contact-link openings.",
    });
  }

  return alerts;
}
