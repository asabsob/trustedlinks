```js
import { runSafeAI } from "../gateway/aiGateway.js";

export async function merchantAssistantAgent({
  business,
  reports,
  pageContext = "dashboard",
  language = "ar",
  question = "",
}) {
  // ===========================================================================
  // Missing Data Detection
  // ===========================================================================

  const missingData = {
    missingDescription:
      !business?.description && !business?.description_ar,

    missingWhatsapp:
      !business?.whatsapp,

    missingLocation:
      !business?.latitude &&
      !business?.longitude &&
      !business?.mapLink,

    missingCategory:
      !business?.category,

    missingKeywords:
      !Array.isArray(business?.keywords) ||
      business.keywords.length === 0,

    missingArabicKeywords:
      !Array.isArray(business?.keywords_ar) ||
      business.keywords_ar.length === 0,
  };

  // ===========================================================================
  // Normalize Question
  // ===========================================================================

  const q = String(question || "").toLowerCase();

  let focusedContext = {};
  let taskPrompt = "";

  // ===========================================================================
  // Wallet Intent
  // ===========================================================================

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

    focusedContext = {
      wallet_balance: business?.wallet_balance,
      sponsored_balance: business?.sponsored_balance,
      wallet_currency: business?.wallet_currency,
    };
  }

  // ===========================================================================
  // Customer Growth Intent
  // ===========================================================================

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

    focusedContext = {
      directLeads: reports?.direct_starts,
      categoryLeads: reports?.category_starts,
      nearbyLeads: reports?.nearby_starts,
      totalLeads: reports?.total_billed_conversations,

      description: business?.description,
      description_ar: business?.description_ar,

      keywords: business?.keywords,
      keywords_ar: business?.keywords_ar,

      category: business?.category,

      missingData,
    };
  }

  // ===========================================================================
  // Low Leads Intent
  // ===========================================================================

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

    focusedContext = {
      directLeads: reports?.direct_starts,
      categoryLeads: reports?.category_starts,
      nearbyLeads: reports?.nearby_starts,

      missingData,

      keywords: business?.keywords,
      keywords_ar: business?.keywords_ar,

      description: business?.description,
      description_ar: business?.description_ar,
    };
  }

  // ===========================================================================
  // Search Visibility Intent
  // ===========================================================================

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

    focusedContext = {
      category: business?.category,

      description: business?.description,
      description_ar: business?.description_ar,

      keywords: business?.keywords,
      keywords_ar: business?.keywords_ar,

      missingData,
    };
  }

  // ===========================================================================
  // Default Dashboard Intent
  // ===========================================================================

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

    focusedContext = {
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
        totalLeads:
          reports?.total_billed_conversations,

        directLeads:
          reports?.direct_starts,

        categoryLeads:
          reports?.category_starts,

        nearbyLeads:
          reports?.nearby_starts,

        spending:
          reports?.estimated_revenue,

        currency:
          reports?.currency,
      },

      missingData,
    };
  }

  // ===========================================================================
  // Run AI
  // ===========================================================================

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
}
```
