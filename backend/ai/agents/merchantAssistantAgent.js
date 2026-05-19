// ============================================================================
// TrustedLinks AI - Merchant Assistant Agent
// ============================================================================

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
      !business?.latitude &&
      !business?.longitude &&
      !business?.mapLink,
    missingCategory: !business?.category,
    missingKeywords:
      !Array.isArray(business?.keywords) || business.keywords.length === 0,
    missingArabicKeywords:
      !Array.isArray(business?.keywords_ar) ||
      business.keywords_ar.length === 0,
  };

  return runSafeAI({
    role: "merchant",
    language,
    task: `
Explain the merchant page and provide practical recommendations.

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

      business: {
        name: business?.name,
        name_ar: business?.name_ar,
        category: business?.category,
        status: business?.status,
        wallet_balance: business?.wallet_balance,
        sponsored_balance: business?.sponsored_balance,
        wallet_currency: business?.wallet_currency,
        description: business?.description,
        description_ar: business?.description_ar,
        keywords: business?.keywords,
        keywords_ar: business?.keywords_ar,
      },

      reports: {
        totalLeads: reports?.total_billed_conversations,
        directLeads: reports?.direct_starts,
        categoryLeads: reports?.category_starts,
        nearbyLeads: reports?.nearby_starts,
        spending: reports?.estimated_revenue,
        currency: reports?.currency,
      },

      missingData,
    },
  });
}
