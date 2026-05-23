export const systemMap = {
  services: {
    search: {
      name: "Search Service",

      responsibilities: [
        "business search",
        "nearby search",
        "category search",
        "search ranking",
      ],

      endpoints: [
        "/api/search",
      ],

      dependsOn: [
        "supabase",
        "ai_parser",
      ],
    },

    whatsapp: {
      name: "WhatsApp Service",

      responsibilities: [
        "incoming webhooks",
        "OTP delivery",
        "message delivery",
        "CTA messages",
      ],

      providers: [
        "JAVNA",
      ],

      dependsOn: [
        "javna_api",
      ],
    },

    billing: {
      name: "Billing Service",

      responsibilities: [
        "wallet deduction",
        "lead charging",
        "campaign credits",
      ],

      dependsOn: [
        "supabase",
      ],
    },

    ai: {
      name: "AI Operations Service",

      responsibilities: [
        "merchant assistant",
        "incident analysis",
        "ops summaries",
        "insights",
      ],

      dependsOn: [
        "openai",
        "supabase",
      ],
    },

    fraud: {
      name: "Fraud Detection",

      responsibilities: [
        "duplicate prevention",
        "lead charge locks",
        "risk analysis",
      ],
    },
  },
};
