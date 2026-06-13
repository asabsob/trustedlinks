import { normalizeSearchText } from "./textNormalizer.js";

export const CATEGORY_DICTIONARY = {
  restaurant_cafe: [
    "مطعم", "مطاعم", "جوعان", "اكل", "أكل", "غداء", "غدا", "عشاء", "عشا",
    "فطور", "افطار", "شاورما", "برجر", "برغر", "بيتزا", "مشاوي", "كباب",
    "restaurant", "restaurants", "burger", "pizza", "shawarma", "bbq", "grill",
  ],

  beverages: [
    "قهوة", "قهوه", "كوفي", "كافيه", "مشروبات", "مشاريب", "عصير", "عصائر",
    "بوبا", "بوبه", "بابل تي", "بوبل تي", "ببل تي",
    "coffee", "cafe", "drinks", "juice", "bubble tea", "boba", "milk tea",
  ],

  clothing: [
    "ازياء", "أزياء", "ملابس", "فساتين", "احذية", "أحذية", "شنط", "موضة",
    "fashion", "clothes", "dresses", "shoes", "bags",
  ],

  beauty_salon: [
    "صالون", "تجميل", "حلاق", "حلاقة", "مكياج", "ميكب", "اظافر", "أظافر",
    "نسائي", "رجالي", "beauty", "salon", "barber", "nails", "makeup",
  ],

  medical_health: [
    "عيادة", "عياده", "طبيب", "دكتور", "اسنان", "أسنان", "جلدية", "عيون",
    "clinic", "doctor", "dentist", "medical", "dermatology",
  ],

  otc_drugs: [
    "صيدلية", "صيدليه", "دواء", "أدوية", "ادوية",
    "pharmacy", "medicine", "drugstore",
  ],

  professional_services: [
    "خدمات", "تصميم", "استشارات", "محامي", "محاسبة", "خياطة", "طباعة",
    "services", "design", "consulting", "lawyer", "accounting", "printing",
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
