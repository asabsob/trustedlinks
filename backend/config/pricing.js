export const PRICING_TIERS = {
  JO: {
    currency: "JOD",
    A: { direct: 0.75, category: 1.0, nearby: 1.25 },
    B: { direct: 0.4, category: 0.6, nearby: 0.8 },
    C: { direct: 0.25, category: 0.35, nearby: 0.45 },
    D: { direct: 0.2, category: 0.25, nearby: 0.3 },
  },

  QA: {
    currency: "QAR",
    A: { direct: 3.0, category: 4.0, nearby: 5.0 },
    B: { direct: 1.5, category: 2.0, nearby: 2.5 },
    C: { direct: 1.0, category: 1.25, nearby: 1.5 },
    D: { direct: 0.75, category: 1.0, nearby: 1.25 },
  },

  SA: {
    currency: "SAR",
    A: { direct: 3.0, category: 4.0, nearby: 5.0 },
    B: { direct: 1.5, category: 2.0, nearby: 2.5 },
    C: { direct: 1.0, category: 1.25, nearby: 1.5 },
    D: { direct: 0.75, category: 1.0, nearby: 1.25 },
  },

  AE: {
    currency: "AED",
    A: { direct: 3.0, category: 4.0, nearby: 5.0 },
    B: { direct: 1.5, category: 2.0, nearby: 2.5 },
    C: { direct: 1.0, category: 1.25, nearby: 1.5 },
    D: { direct: 0.75, category: 1.0, nearby: 1.25 },
  },

  DEFAULT: {
    currency: "USD",
    A: { direct: 0.75, category: 1.0, nearby: 1.25 },
    B: { direct: 0.4, category: 0.6, nearby: 0.8 },
    C: { direct: 0.25, category: 0.35, nearby: 0.45 },
    D: { direct: 0.2, category: 0.25, nearby: 0.3 },
  },
};

export const CATEGORY_PRICING_TIERS = {
  FINANCE_BANKING: "A",

  AUTOMOTIVE: "B",
  HOTEL_LODGING: "B",
  MEDICAL_HEALTH: "B",
  PROFESSIONAL_SERVICES: "B",
  TRAVEL_TRANSPORTATION: "B",

  BEAUTY_SPA_SALON: "C",
  BEVERAGES: "C",
  CLOTHING_APPAREL: "C",
  EDUCATION: "C",
  ENTERTAINMENT: "C",
  EVENT_PLANNING: "C",
  FOOD_GROCERY: "C",
  OVER_THE_COUNTER_DRUGS: "C",
  RESTAURANT: "C",
  SHOPPING_RETAIL: "C",

  NON_PROFIT: "D",
  PUBLIC_SERVICE: "D",
  OTHER: "D",
};

export const DEFAULT_PRICING_TIER = "C";
