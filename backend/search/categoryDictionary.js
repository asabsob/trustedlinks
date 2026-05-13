import { normalizeSearchText } from "./textNormalizer.js";

export const CATEGORY_DICTIONARY = {
  RESTAURANT_CAFE: [
    "مطعم",
    "مطاعم",
    "شاورما",
    "برجر",
    "بيتزا",
    "مشاوي",
    "كباب",
    "ساندويش",
    "restaurant",
    "restaurants",
    "burger",
    "pizza",
    "shawarma",
    "bbq",
    "grill",
  ],

  BEVERAGES: [
    "قهوة",
    "قهوه",
    "كوفي",
    "كافيه",
    "مشروبات",
    "عصير",
    "بابل تي",
    "coffee",
    "cafe",
    "drinks",
    "bubble tea",
  ],

  CLOTHING: [
    "ازياء",
    "أزياء",
    "ملابس",
    "فساتين",
    "احذية",
    "أحذية",
    "شنط",
    "موضة",
    "fashion",
    "clothes",
    "dresses",
    "shoes",
    "bags",
  ],

  BEAUTY_SALON: [
    "صالون",
    "تجميل",
    "حلاق",
    "مكياج",
    "اظافر",
    "أظافر",
    "beauty",
    "salon",
    "barber",
    "nails",
  ],

  MEDICAL_HEALTH: [
    "عيادة",
    "عياده",
    "طبيب",
    "دكتور",
    "اسنان",
    "أسنان",
    "clinic",
    "doctor",
    "dentist",
    "medical",
  ],

  PHARMACY: [
    "صيدلية",
    "صيدليه",
    "دواء",
    "أدوية",
    "ادوية",
    "pharmacy",
    "medicine",
    "drugstore",
  ],

  PROFESSIONAL_SERVICES: [
    "خدمات",
    "تصميم",
    "استشارات",
    "محامي",
    "محاسبة",
    "خياطة",
    "طباعة",
    "services",
    "design",
    "consulting",
    "lawyer",
    "accounting",
    "printing",
  ],
};

export function detectCategoryKeyword(query = "") {
  const normalized = normalizeSearchText(query);

  for (const [category, words] of Object.entries(
    CATEGORY_DICTIONARY
  )) {
    const matched = words.some((word) =>
      normalized.includes(
        normalizeSearchText(word)
      )
    );

    if (matched) {
      return {
        matched: true,
        category,
      };
    }
  }

  return {
    matched: false,
    category: null,
  };
}
