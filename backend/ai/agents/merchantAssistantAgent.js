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

  if (q.includes("الرصيد") || q.includes("wallet")) {
  focusedContext = {
    wallet_balance: business?.wallet_balance,
    sponsored_balance: business?.sponsored_balance,
    wallet_currency: business?.wallet_currency,
  };
}

else if (
  q.includes("العملاء") ||
  q.includes("ليدز") ||
  q.includes("customers")
) {
  focusedContext = {
    directLeads: reports?.direct_starts,
    categoryLeads: reports?.category_starts,
    nearbyLeads: reports?.nearby_starts,
    totalLeads: reports?.total_billed_conversations,
  };
}

else if (
  q.includes("البحث") ||
  q.includes("الظهور") ||
  q.includes("visibility")
) {
  focusedContext = {
    description: business?.description,
    description_ar: business?.description_ar,
    keywords: business?.keywords,
    keywords_ar: business?.keywords_ar,
    category: business?.category,
    missingData,
  };
}

else {
  focusedContext = {
    business,
    reports,
    missingData,
  };
}
  
return runSafeAI({
  role: "merchant",
  language,

  task: `
${taskPrompt}

Page context:
${pageContext}

Merchant question:
${question || "Explain this page generally"}
`,

  input: {
    pageContext,
    focusedContext,
  },
});
