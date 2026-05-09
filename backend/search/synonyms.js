import { normalizeSearchText } from "./textNormalizer.js";

export const SEARCH_SYNONYMS = {
  automotive: [
    "Automotive", "سيارات", "سيارة", "سياره", "معرض سيارات", "كراج",
    "صيانة سيارات", "قطع غيار", "غسيل سيارات", "اطارات", "إطارات",
    "car", "cars", "auto", "garage", "mechanic", "spare parts", "tires",
  ],

  beauty_salon: [
    "Beauty & Salon", "تجميل وصالون", "صالون", "تجميل", "حلاقة",
    "اظافر", "أظافر", "مكياج", "شعر", "سبا",
    "beauty", "salon", "barber", "nails", "spa",
  ],

  clothing: [
    "Clothing", "ملابس وأزياء", "ملابس", "أزياء", "ازياء", "موضة",
    "احذية", "أحذية", "شنط",
    "clothing", "fashion", "clothes", "shoes",
  ],

  education: [
    "Education", "تعليم", "مدرسة", "مدرسه", "جامعة", "جامعه",
    "تدريب", "دورات", "معهد",
    "education", "school", "university", "training", "courses",
  ],

  entertainment: [
    "Entertainment", "ترفيه", "العاب", "ألعاب", "سينما",
    "entertainment", "games", "cinema",
  ],

  events: [
    "Events", "تنظيم فعاليات", "فعاليات", "حفلات", "مناسبات",
    "events", "event planning",
  ],

  finance: [
    "Finance", "تمويل وبنوك", "تمويل", "بنك", "بنوك", "تأمين", "تامين",
    "finance", "bank", "banks", "insurance",
  ],

  food_grocery: [
    "Food & Grocery", "طعام وبقالة", "طعام", "بقالة", "بقاله",
    "سوبرماركت", "مواد غذائية", "غذائية",
    "food", "grocery", "supermarket",
  ],

  beverages: [
    "Beverages", "مشروبات", "مشروب", "مشاريب", "قهوة", "قهوه",
    "كوفي", "شاي", "عصير", "عصائر", "بابل تي", "بوبل تي",
    "beverages", "coffee", "cafe", "tea", "juice", "drinks",
  ],

  public_service: [
    "Public Service", "خدمات عامة", "خدمات عامه", "خدمة عامة",
    "حكومي", "حكومة",
    "public service", "government",
  ],

  hotel_lodging: [
    "Hotel & Lodging", "فنادق وإقامة", "فنادق واقامة", "فندق",
    "فنادق", "إقامة", "اقامة", "سكن",
    "hotel", "hotels", "lodging", "accommodation",
  ],

  medical_health: [
    "Medical & Health", "صحة وطبية", "صحه وطبيه", "صحة", "صحه",
    "طبي", "طبية", "طبيه", "عيادة", "عياده", "عيادات",
    "طبيب", "دكتور", "مركز طبي", "اسنان", "جلدية", "جلديه",
    "medical", "health", "clinic", "doctor", "dentist", "dermatology",
  ],

  otc_drugs: [
    "OTC Drugs", "أدوية بدون وصفة", "ادوية بدون وصفة",
    "صيدلية", "صيدليه", "صيدليات", "دواء", "أدوية", "ادوية",
    "pharmacy", "medicine", "drugs",
  ],

  nonprofit: [
    "Non-profit", "غير ربحي", "جمعية", "جمعيه", "منظمة", "منظمه",
    "خيري", "خيرية",
    "nonprofit", "ngo", "charity",
  ],

  professional_services: [
    "Professional Services", "خدمات مهنية", "خدمات مهنيه",
    "محامي", "قانون", "محاسبة", "محاسبه", "استشارات", "تسويق",
    "تصميم", "خدمات",
    "professional services", "legal", "accounting", "consulting", "marketing",
  ],

  shopping_retail: [
    "Shopping & Retail", "تسوق وتجزئة", "تسوق وتجزئه",
    "تسوق", "تجزئة", "تجزئه", "ريتيل", "متجر", "متاجر",
    "محل", "محلات", "سوق", "مول",
    "shopping", "retail", "shop", "store", "market", "mall",
  ],

  travel_transport: [
    "Travel & Transportation", "سفر ومواصلات", "سفر", "مواصلات",
    "نقل", "تكسي", "تاكسي", "طيران", "رحلات", "تذاكر",
    "travel", "transportation", "transport", "taxi", "flight", "tickets",
  ],

  restaurant_cafe: [
    "Restaurant / Cafe", "مطعم / مقهى", "مطعم", "مطاعم",
    "مقهى", "مقهي", "كافيه", "اكل", "أكل", "وجبات",
    "برغر", "بيتزا", "شاورما", "مشاوي",
    "restaurant", "cafe", "food", "meal", "burger", "pizza", "shawarma",
  ],

  other: [
    "Other", "أخرى", "اخرى", "غير ذلك", "عام", "متنوع",
    "other", "general", "misc",
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
      expanded.add(normalizeSearchText(groupKey));
      normalizedSynonyms.forEach((term) => expanded.add(term));
    }
  }

  return [...expanded];
}
