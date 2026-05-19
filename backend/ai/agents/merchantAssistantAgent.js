import { runSafeAI } from "../gateway/aiGateway.js";

export async function merchantAssistantAgent({
  business,
  reports,
  pageContext = "dashboard",
  language = "ar",
  question = "",
}) {
  const missingData = {
    missingDescription: !business?.description && !business?.description_ar,
    missingWhatsapp: !business?.whatsapp,
    missingLocation:
      !business?.latitude && !business?.longitude && !business?.mapLink,
    missingCategory: !business?.category,
    missingKeywords:
      !Array.isArray(business?.keywords) || business.keywords.length === 0,
    missingArabicKeywords:
      !Array.isArray(business?.keywords_ar) ||
      business.keywords_ar.length === 0,
  };

  const q = String(question || "").toLowerCase();

  let focusedContext = {};
  let taskPrompt = "";

if (
  q.includes("الرصيد") ||
  q.includes("wallet")
) {
  taskPrompt = `
Explain the merchant wallet balance.

Focus on:
- Current balance
- Sponsored balance
- Low balance risk
- Recharge recommendation
- Keep answer short
`;
}

else if (
  q.includes("العملاء") ||
  q.includes("ليدز") ||
  q.includes("more customers") ||
  q.includes("customers")
) {
  taskPrompt = `
Analyze customer acquisition opportunities.

Focus on:
- Lead generation
- Search visibility
- Improving business profile
- Keywords
- Nearby search optimization
- Give practical marketing advice
`;
}

else if (
  q.includes("منخفضة") ||
  q.includes("low") ||
  q.includes("ضعيف")
) {
  taskPrompt = `
Analyze why lead generation may be low.

Focus on:
- Missing business data
- Weak keywords
- Missing location
- Category visibility
- Search optimization
- Competition possibility
`;
}

else if (
  q.includes("البحث") ||
  q.includes("الظهور") ||
  q.includes("search") ||
  q.includes("visibility")
) {
  taskPrompt = `
Explain how to improve search visibility.

Focus on:
- Keywords
- Category relevance
- Description quality
- Nearby visibility
- Arabic and English optimization
`;
}

else {
  taskPrompt = `
Explain the merchant dashboard.

Focus on:
- KPIs
- Wallet
- Leads
- Performance
- Recommendations
`;
}
  return runSafeAI({
    role: "merchant",
    language,
 task: taskPrompt,

Page context: ${pageContext}

Merchant question:
${question || "Explain this page generally"}

Focus on:
- Explain current page
- Explain KPIs
- Explain wallet/leads/reports if available
- Detect missing business data
- Suggest visibility improvements
- Suggest search optimization
- Keep response short and practical
`,
    input: {
      pageContext,
      focusedContext,
    },
  });
}
