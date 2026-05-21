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
  // Intent
  // ===========================================================================
if (
  q.includes("ماذا أفعل") ||
  q.includes("هذه الصفحة") ||
  q.includes("استخدم") ||
  q.includes("what can i do") ||
  q.includes("how to use")
) {
  taskPrompt = `
Act as a TrustedLinks merchant product guide.

Important rules:
- Do NOT mention Facebook ads.
- Do NOT mention Google ads.
- Do NOT mention external ad campaigns.
- Leads mean WhatsApp contact requests generated inside TrustedLinks.
- Spending means wallet deductions for paid WhatsApp contact requests.
- Explain the page using TrustedLinks terminology only.

Explain:
- What this page is for
- What the merchant can do here
- Which sections matter
- What action to take next

Keep it practical and easy to understand.
`;

  focusedContext = {
    pageContext,
    pageGuide: getPageGuideContext(pageContext, language),
  };
}

else if (
  q.includes("كيف أزيد") ||
  q.includes("زيادة العملاء") ||
  q.includes("more customers")
) {
 taskPrompt = `
Analyze customer growth opportunities inside TrustedLinks only.

Important TrustedLinks rules:
- Do NOT mention Google Maps.
- Do NOT mention Facebook ads.
- Do NOT mention Instagram ads.
- Do NOT mention external ads or social media campaigns.
- Give advice only inside TrustedLinks.
- Leads mean WhatsApp contact requests generated through TrustedLinks.
- Search visibility means visibility inside TrustedLinks search and WhatsApp search flow.
- Spending means wallet deductions for paid WhatsApp contact requests.

Focus on:
- Improving the business profile inside TrustedLinks
- Better Arabic and English keywords
- Clearer business description
- Correct category selection
- Accurate location for nearby search
- WhatsApp readiness
- How to get more:
  - direct requests
  - category requests
  - nearby requests
- Keep answer practical and short
`;

  focusedContext = {
    directLeads: reports?.direct_starts,
    categoryLeads: reports?.category_starts,
    nearbyLeads: reports?.nearby_starts,

    description: business?.description,
    description_ar: business?.description_ar,

    keywords: business?.keywords,
    keywords_ar: business?.keywords_ar,

    category: business?.category,

    missingData,
  };
}

else if (
  q.includes("اشرح الأداء") ||
  q.includes("performance")
) {
  taskPrompt = `
Explain the merchant performance metrics.

Focus on:
- Direct leads
- Category leads
- Nearby leads
- Overall performance
- Business growth insights
`;

  focusedContext = {
    reports,
    businessName: business?.name,
  };
}

else if (
  q.includes("لماذا الليدز منخفضة") ||
  q.includes("low leads")
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
    reports,
    missingData,

    keywords: business?.keywords,
    keywords_ar: business?.keywords_ar,

    description: business?.description,
    description_ar: business?.description_ar,
  };
}

else if (
  q.includes("البحث") ||
  q.includes("الظهور") ||
  q.includes("visibility") ||
  q.includes("search")
) {
 taskPrompt = `
Explain how to improve visibility inside TrustedLinks search.

Important TrustedLinks rules:
- Do NOT mention Google SEO.
- Do NOT mention Google Maps.
- Do NOT mention Facebook or Instagram marketing.
- Visibility means appearing more often inside TrustedLinks results.

Focus on:
- Better Arabic keywords
- Better English keywords
- Strong category matching
- Better business description
- Nearby search optimization
- WhatsApp readiness
- Profile completeness
- Keep answer practical and short
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

else if (
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
  liveContext,
},
  });
}

function getPageGuideContext(pageContext, language = "ar") {
  const isAr = language === "ar";

  const guides = {
    business_dashboard: {
      ar: {
        pageName: "لوحة تحكم النشاط",
        purpose: "متابعة أداء النشاط، الرصيد، الليدز، وحالة الحساب.",
        actions: [
          "راجع إجمالي الرصيد.",
          "تابع عدد الليدز المباشرة ومن الفئة والقريبة.",
          "راقب حالة الرصيد إذا كان منخفضًا.",
          "استخدم زر الشحن عند الحاجة.",
          "راجع تفاصيل النشاط وتأكد من اكتمالها.",
        ],
      },
      en: {
        pageName: "Business Dashboard",
        purpose: "Track business performance, wallet, leads, and account status.",
        actions: [
          "Review your total balance.",
          "Check direct, category, and nearby leads.",
          "Watch low-balance warnings.",
          "Recharge when needed.",
          "Review business details and complete missing information.",
        ],
      },
    },

    manage_links: {
      ar: {
        pageName: "إدارة معلومات النشاط",
        purpose: "تعديل بيانات النشاط وتحسين ظهوره في البحث.",
        actions: [
          "عدّل اسم النشاط والوصف.",
          "أضف كلمات مفتاحية عربية وإنجليزية.",
          "تأكد من اختيار الفئة الصحيحة.",
          "حدّث موقع النشاط على الخريطة.",
          "وثّق رقم واتساب.",
          "استخدم AI Optimization لتحسين الوصف والكلمات المفتاحية.",
          "بعد تطبيق اقتراحات AI اضغط حفظ التغييرات.",
        ],
      },
      en: {
        pageName: "Manage Business Information",
        purpose: "Edit your business profile and improve search visibility.",
        actions: [
          "Edit business name and description.",
          "Add Arabic and English keywords.",
          "Choose the correct category.",
          "Update map location.",
          "Verify WhatsApp number.",
          "Use AI Optimization to improve description and keywords.",
          "After applying AI suggestions, click Save Changes.",
        ],
      },
    },

 reports: {
  ar: {
    pageName: "تقارير أداء TrustedLinks",
    purpose:
      "هذه الصفحة مخصصة لفهم أداء نشاطك داخل منصة TrustedLinks من خلال طلبات التواصل عبر واتساب، مصادر البحث داخل المنصة، والخصومات من المحفظة.",
    actions: [
      "راجع عدد طلبات التواصل المباشرة عندما يبحث العميل عن اسم نشاطك داخل TrustedLinks.",
      "راجع طلبات الفئة عندما يبحث العميل عن نوع الخدمة أو المنتج داخل المنصة.",
      "راجع الطلبات القريبة عندما يبحث العميل عن نشاط قريب من موقعه.",
      "تابع الإنفاق، وهو المبلغ الذي يتم خصمه من المحفظة عند فتح العملاء لرابط واتساب الخاص بنشاطك.",
      "قارن الأداء بين آخر 7 أو 30 أو 90 يوم.",
      "راقب أقوى مصدر للطلبات لتحسين وصف نشاطك والكلمات المفتاحية داخل TrustedLinks.",
    ],
    importantTerms: {
      directLeads: "طلبات مباشرة عندما يبحث العميل عن اسم النشاط.",
      categoryLeads: "طلبات ناتجة عن البحث حسب الفئة أو نوع الخدمة.",
      nearbyLeads: "طلبات ناتجة عن البحث القريب حسب موقع العميل.",
      spending:
        "مبلغ يتم خصمه من المحفظة مقابل طلبات التواصل المدفوعة داخل TrustedLinks.",
    },
  },

  en: {
    pageName: "TrustedLinks Performance Reports",
    purpose:
      "This page helps merchants understand their performance inside TrustedLinks through WhatsApp contact requests, search sources, and wallet deductions.",
    actions: [
      "Review direct requests when customers search for your business name inside TrustedLinks.",
      "Review category requests when customers search by product or service type.",
      "Review nearby requests when customers search for businesses near their location.",
      "Track spending, which represents wallet deductions when customers open your WhatsApp contact link.",
      "Compare performance across the last 7, 30, or 90 days.",
      "Monitor your strongest request source to improve your description and keywords inside TrustedLinks.",
    ],
    importantTerms: {
      directLeads:
        "Requests generated when customers search for your business name.",
      categoryLeads:
        "Requests generated from category or service searches.",
      nearbyLeads:
        "Requests generated from nearby/location-based searches.",
      spending:
        "Wallet deductions for paid WhatsApp contact requests inside TrustedLinks.",
    },
  },
},

    wallet: {
      ar: {
        pageName: "المحفظة",
        purpose: "إدارة الرصيد وشحن الحساب ومراجعة آخر الحركات.",
        actions: [
          "راجع الرصيد الحالي.",
          "تابع حالة الحساب.",
          "اشحن الرصيد عند انخفاضه.",
          "راجع آخر الحركات.",
          "تأكد من الرصيد الترويجي إن وجد.",
        ],
      },
      en: {
        pageName: "Wallet",
        purpose: "Manage balance, top-ups, and recent activity.",
        actions: [
          "Review current balance.",
          "Check account status.",
          "Top up when balance is low.",
          "Review recent transactions.",
          "Check sponsored credit if available.",
        ],
      },
    },

    transactions: {
      ar: {
        pageName: "كشف الحركات",
        purpose: "مراجعة كل الخصومات والإيداعات على حساب النشاط.",
        actions: [
          "راجع نوع الحركة.",
          "تأكد من مبلغ الخصم أو الإيداع.",
          "افهم سبب الحركة.",
          "استخدم الفلاتر لعرض الإيداعات أو الخصومات فقط.",
        ],
      },
      en: {
        pageName: "Transactions",
        purpose: "Review all credits and debits for your business.",
        actions: [
          "Review transaction type.",
          "Check debit or credit amount.",
          "Understand the transaction reason.",
          "Use filters to show credits or debits only.",
        ],
      },
    },
  };

  const guide = guides[pageContext] || guides.business_dashboard;

  return isAr ? guide.ar : guide.en;
}
