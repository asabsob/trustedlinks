import { normalizeSearchText } from "./textNormalizer.js";

export const SEARCH_SYNONYMS = {
  beverages: [
    "مشروبات", "مشروب", "مشاريب", "قهوة", "قهوه", "كوفي", "كافيه", "كافيهات",
    "شاي", "عصير", "عصائر", "بوبل تي", "بابل تي",
    "coffee", "cafe", "tea", "juice", "drinks", "drink", "beverages", "bubble tea",
  ],

  restaurant_food: [
    "مطعم", "مطاعم", "اكل", "أكل", "طعام", "وجبات", "وجبه", "غداء", "عشاء",
    "فطور", "افطار", "برغر", "برجر", "شاورما", "بيتزا", "مشاوي", "كباب",
    "restaurant", "restaurants", "food", "meal", "burger", "pizza", "shawarma", "grill", "bbq",
  ],

  sweets_dessert: [
    "حلويات", "حلو", "كيك", "كيكة", "معجنات", "مخبز", "مخابز", "بوظة", "ايس كريم",
    "dessert", "desserts", "sweets", "cake", "bakery", "pastry", "ice cream",
  ],

  health_medical: [
    "صحة", "صحه", "طبي", "طبية", "طبيه", "عيادة", "عياده", "عيادات",
    "طبيب", "دكتور", "دكتورة", "مركز طبي", "مختبر", "تحاليل", "اسنان", "أسنان",
    "جلدية", "جلديه", "تجميل", "صيدلية", "صيدليه", "صيدليات", "دواء", "ادوية", "أدوية",
    "health", "medical", "clinic", "clinics", "doctor", "pharmacy", "medicine",
    "dental", "dentist", "lab", "laboratory", "dermatology", "beauty clinic",
  ],

  shopping_retail: [
    "تسوق", "تسوّق", "متجر", "متاجر", "محل", "محلات", "سوق", "مول",
    "بيع", "تجزئة", "ريتيل", "ملابس", "احذية", "أحذية", "اكسسوارات", "هدايا",
    "shopping", "shop", "store", "stores", "retail", "market", "mall",
    "fashion", "clothes", "shoes", "accessories", "gifts",
  ],

  beauty_salon: [
    "صالون", "تجميل", "حلاقة", "حلاق", "نسائي", "رجالي", "اظافر", "أظافر",
    "مكياج", "ميك اب", "شعر", "سبا", "مساج",
    "salon", "beauty", "barber", "hair", "nails", "makeup", "spa", "massage",
  ],

  electronics_technology: [
    "الكترونيات", "إلكترونيات", "موبايل", "موبايلات", "هاتف", "هواتف",
    "كمبيوتر", "لابتوب", "اجهزة", "أجهزة", "تقنية", "تكنولوجيا", "اتصالات",
    "electronics", "mobile", "phone", "phones", "computer", "laptop",
    "devices", "technology", "telecom", "communications",
  ],

  services_company: [
    "شركة", "شركه", "شركات", "مؤسسة", "مؤسسه", "خدمات", "ادارة", "إدارة",
    "استشارات", "تطوير", "اعمال", "أعمال", "حلول",
    "company", "enterprise", "business", "services", "management",
    "consulting", "development", "solutions",
  ],

  education_training: [
    "تعليم", "تدريب", "مدرسة", "مدرسه", "مدارس", "جامعة", "جامعه",
    "معهد", "دورات", "كورس", "تعلم", "حضانه", "حضانة",
    "education", "training", "school", "university", "academy",
    "institute", "courses", "course", "kindergarten", "nursery",
  ],

  fitness_sports: [
    "رياضة", "رياضه", "جيم", "نادي", "لياقة", "لياقه", "تمارين",
    "كمال اجسام", "سباحة", "سباحه",
    "gym", "fitness", "sport", "sports", "workout", "training", "swimming",
  ],

  automotive: [
    "سيارات", "سيارة", "سياره", "كراج", "صيانة", "صيانه", "غسيل سيارات",
    "قطع غيار", "اطارات", "إطارات",
    "car", "cars", "auto", "automotive", "garage", "maintenance",
    "car wash", "spare parts", "tires",
  ],

  home_furniture: [
    "منزل", "بيت", "اثاث", "أثاث", "مفروشات", "ديكور", "مطابخ",
    "ادوات منزلية", "أدوات منزلية",
    "home", "furniture", "decor", "kitchen", "household",
  ],

  travel_hotel: [
    "سفر", "سياحة", "سياحه", "فندق", "فنادق", "حجز", "طيران", "تذاكر",
    "رحلات", "تأمين سفر", "تامين سفر",
    "travel", "tourism", "hotel", "hotels", "booking", "flight",
    "tickets", "trips", "travel insurance",
  ],

  real_estate: [
    "عقار", "عقارات", "شقة", "شقه", "شقق", "اراضي", "أراضي", "ايجار",
    "إيجار", "بيع عقار",
    "real estate", "property", "properties", "apartment", "rent", "sale",
  ],

  finance_legal: [
    "محامي", "محاماة", "محاماه", "قانون", "قانوني", "محاسبة", "محاسبه",
    "ضريبة", "ضريبه", "تمويل", "تأمين", "تامين",
    "lawyer", "legal", "law", "accounting", "tax", "finance", "insurance",
  ],
};

function uniqueTerms(terms = []) {
  return [...new Set(terms.map((t) => normalizeSearchText(t)).filter(Boolean))];
}

export function expandTerms(query = "") {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  const expanded = new Set([normalizedQuery, ...queryWords]);

  for (const [groupKey, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    const normalizedSynonyms = uniqueTerms([groupKey, ...synonyms]);

    const matched = normalizedSynonyms.some((term) => {
      return (
        normalizedQuery.includes(term) ||
        term.includes(normalizedQuery) ||
        queryWords.includes(term)
      );
    });

    if (matched) {
      normalizedSynonyms.forEach((term) => expanded.add(term));
    }
  }

  return [...expanded];
}
