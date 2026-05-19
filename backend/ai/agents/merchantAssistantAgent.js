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
Act as a product guide for the merchant dashboard.

Explain this page step by step.

Focus on:
- What this page is for
- What the merchant can do here
- Which buttons or sections matter
- What action to take next
- Keep it simple and practical
`;

  focusedContext = {
    pageContext,
    pageGuide: getPageGuideContext(pageContext, language),
  };
}
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
        pageName: "تقارير الأداء",
        purpose: "فهم مصادر الليدز والإنفاق واتجاهات الأداء.",
        actions: [
          "راجع عدد الليدز حسب المصدر.",
          "تابع الإنفاق خلال الفترة.",
          "قارن الأداء بين 7 و30 و90 يوم.",
          "راقب أقوى مصدر لليدز.",
          "استخدم التحليلات لتحسين ميزانية النشاط.",
        ],
      },
      en: {
        pageName: "Performance Reports",
        purpose: "Understand lead sources, spending, and performance trends.",
        actions: [
          "Review leads by source.",
          "Track spending over time.",
          "Compare 7, 30, and 90 day periods.",
          "Identify your strongest lead source.",
          "Use insights to improve your budget.",
        ],
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
