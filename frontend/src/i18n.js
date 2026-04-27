export const translations = {
  en: {
    businessDashboard: "Business Dashboard",
    welcomeBack: "Welcome back",
    dashboardSubtitle: "Manage your business profile, wallet, and performance from one place.",
    walletBalance: "Wallet Balance",
    active: "Active",
    lowBalance: "Low balance",
    outOfBalance: "Out of balance",
    directLeads: "Direct Leads",
    categoryLeads: "Category Leads",
    nearbyLeads: "Nearby Leads",
    spending: "Spending",
    businessDetails: "Business Details",
    businessDetailsDesc: "Basic information for your registered business.",
    businessName: "Business Name",
    category: "Category",
    whatsapp: "WhatsApp",
    description: "Description",
    map: "Map",
    openLocation: "Open location",
    coordinates: "Coordinates",
    performanceSummary: "Performance Summary",
    performanceSummaryDesc: "Quick overview of paid lead activity for your business.",
    totalLeads: "Total Leads",
    notAvailable: "N/A",
  },

  ar: {
    businessDashboard: "لوحة تحكم النشاط",
    welcomeBack: "مرحبًا بعودتك",
    dashboardSubtitle: "تابع ملف نشاطك، رصيدك، وأداءك من مكان واحد.",
    walletBalance: "الرصيد الحالي",
    active: "نشط",
    lowBalance: "رصيد منخفض",
    outOfBalance: "لا يوجد رصيد",
    directLeads: "طلبات مباشرة",
    categoryLeads: "طلبات حسب الفئة",
    nearbyLeads: "طلبات قريبة",
    spending: "الإنفاق",
    businessDetails: "بيانات النشاط",
    businessDetailsDesc: "المعلومات الأساسية لنشاطك المسجل.",
    businessName: "اسم النشاط",
    category: "الفئة",
    whatsapp: "واتساب",
    description: "الوصف",
    map: "الخريطة",
    openLocation: "فتح الموقع",
    coordinates: "الإحداثيات",
    performanceSummary: "ملخص الأداء",
    performanceSummaryDesc: "نظرة سريعة على طلبات التواصل المدفوعة لنشاطك.",
    totalLeads: "إجمالي الطلبات",
    notAvailable: "غير متوفر",
  },
};

export const categoryLabels = {
  BEVERAGES: { en: "Beverages", ar: "مشروبات" },
  RESTAURANT: { en: "Restaurant / Cafe", ar: "مطعم / مقهى" },
  SHOPPING_RETAIL: { en: "Retail", ar: "تسوق وتجزئة" },
  PROFESSIONAL_SERVICES: { en: "Professional Services", ar: "خدمات مهنية" },
  BEAUTY_SPA_SALON: { en: "Beauty & Salon", ar: "تجميل وصالون" },
  AUTOMOTIVE: { en: "Automotive", ar: "سيارات" },
  EDUCATION: { en: "Education", ar: "تعليم" },
  MEDICAL_HEALTH: { en: "Medical & Health", ar: "صحة وطبية" },
  OTHER: { en: "Other", ar: "أخرى" },
};

export function getText(lang, key) {
  return translations[lang]?.[key] || translations.en[key] || key;
}

export function getCategoryLabel(value, lang = "en") {
  if (!value) return getText(lang, "notAvailable");

  const key = Array.isArray(value) ? value[0] : value;
  const normalized = String(key || "").toUpperCase().trim();

  return categoryLabels[normalized]?.[lang] || String(key);
}
