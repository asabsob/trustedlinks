import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function Search({ lang = "en" }) {
  const isArabic = lang === "ar";
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = (en, ar) => (isArabic ? ar : en);

  const metaCategories = useMemo(
    () => [
      { key: "AUTOMOTIVE", nameEn: "Automotive", nameAr: "سيارات" },
      { key: "BEAUTY_SPA_SALON", nameEn: "Beauty & Salon", nameAr: "تجميل وصالون" },
      { key: "CLOTHING_APPAREL", nameEn: "Clothing", nameAr: "ملابس وأزياء" },
      { key: "EDUCATION", nameEn: "Education", nameAr: "تعليم" },
      { key: "ENTERTAINMENT", nameEn: "Entertainment", nameAr: "ترفيه" },
      { key: "EVENT_PLANNING", nameEn: "Events", nameAr: "تنظيم فعاليات" },
      { key: "FINANCE_BANKING", nameEn: "Finance", nameAr: "تمويل وبنوك" },
      { key: "FOOD_GROCERY", nameEn: "Food & Grocery", nameAr: "طعام وبقالة" },
      { key: "BEVERAGES", nameEn: "Beverages", nameAr: "مشروبات" },
      { key: "PUBLIC_SERVICE", nameEn: "Public Service", nameAr: "خدمات عامة" },
      { key: "HOTEL_LODGING", nameEn: "Hotel & Lodging", nameAr: "فنادق وإقامة" },
      { key: "MEDICAL_HEALTH", nameEn: "Medical & Health", nameAr: "صحة وطبية" },
      { key: "OVER_THE_COUNTER_DRUGS", nameEn: "OTC Drugs", nameAr: "أدوية بدون وصفة" },
      { key: "NON_PROFIT", nameEn: "Non-profit", nameAr: "غير ربحي" },
      { key: "PROFESSIONAL_SERVICES", nameEn: "Professional Services", nameAr: "خدمات مهنية" },
      { key: "SHOPPING_RETAIL", nameEn: "Retail", nameAr: "تسوق وتجزئة" },
      { key: "TRAVEL_TRANSPORTATION", nameEn: "Travel & Transport", nameAr: "سفر ومواصلات" },
      { key: "RESTAURANT", nameEn: "Restaurant / Cafe", nameAr: "مطعم / مقهى" },
      { key: "OTHER", nameEn: "Other", nameAr: "أخرى" },
    ],
    []
  );

  const metaByKey = useMemo(
    () => Object.fromEntries(metaCategories.map((c) => [c.key, c])),
    [metaCategories]
  );

  const cityKeywords = useMemo(
    () => [
      { key: "amman", values: ["amman", "عمان"] },
      { key: "aqaba", values: ["aqaba", "العقبة", "aqabah"] },
      { key: "zarqa", values: ["zarqa", "الزرقاء"] },
      { key: "irbid", values: ["irbid", "إربد", "اربد"] },
      { key: "madaba", values: ["madaba", "مادبا"] },
      { key: "salt", values: ["salt", "السلط"] },
      { key: "jerash", values: ["jerash", "جرش"] },
      { key: "karak", values: ["karak", "الكرك"] },
      { key: "mafraq", values: ["mafraq", "المفرق"] },
    ],
    []
  );

  const smartCategoryMap = useMemo(
    () => ({
      RESTAURANT: [
        "restaurant",
        "restaurants",
        "cafe",
        "coffee",
        "burger",
        "pizza",
        "shawarma",
        "مطعم",
        "مطاعم",
        "كافيه",
        "كوفي",
        "قهوة",
        "مقهى",
        "مشروبات",
      ],
      BEAUTY_SPA_SALON: [
        "beauty",
        "salon",
        "spa",
        "makeup",
        "nails",
        "barber",
        "تجميل",
        "صالون",
        "سبا",
        "مكياج",
        "حلاقة",
        "أظافر",
      ],
      SHOPPING_RETAIL: [
        "shop",
        "shopping",
        "store",
        "retail",
        "mall",
        "متجر",
        "محل",
        "تسوق",
        "تجزئة",
      ],
      PROFESSIONAL_SERVICES: [
        "services",
        "service",
        "office",
        "agency",
        "consulting",
        "خدمات",
        "خدمة",
        "مكتب",
        "شركة",
        "استشارات",
      ],
      MEDICAL_HEALTH: [
        "medical",
        "doctor",
        "clinic",
        "hospital",
        "صيدلية",
        "طبي",
        "صحة",
        "عيادة",
        "مستشفى",
      ],
      AUTOMOTIVE: [
        "car",
        "cars",
        "auto",
        "automotive",
        "سيارات",
        "سيارة",
        "ميكانيك",
      ],
      EDUCATION: [
        "school",
        "university",
        "training",
        "education",
        "تعليم",
        "مدرسة",
        "جامعة",
        "تدريب",
      ],
      TRAVEL_TRANSPORTATION: [
        "travel",
        "transport",
        "taxi",
        "bus",
        "tourism",
        "سفر",
        "مواصلات",
        "نقل",
        "سياحة",
      ],
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadBusinesses() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/businesses`);
        const data = await res.json().catch(() => []);
        if (!cancelled) {
          setBusinesses(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setBusinesses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBusinesses();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalize = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي");

  const extractCategoryValues = (b) => {
    const raw = b.category ?? [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr
      .filter(Boolean)
      .map((v) => (typeof v === "string" ? v : v.key || v.name || ""))
      .map((v) => String(v).toUpperCase().trim());
  };

  const getBusinessTextBlob = (b) => {
    return normalize(
      [
        b.name,
        b.name_ar,
        b.description,
        b.locationText,
        b.countryName,
        b.city,
        b.address,
        ...(Array.isArray(b.keywords) ? b.keywords : []),
        ...extractCategoryValues(b),
      ].join(" ")
    );
  };

  const detectSmartCategory = (searchText) => {
    const normalized = normalize(searchText);

    for (const [categoryKey, keywords] of Object.entries(smartCategoryMap)) {
      if (keywords.some((word) => normalized.includes(normalize(word)))) {
        return categoryKey;
      }
    }

    return null;
  };

  const detectSmartCity = (searchText) => {
    const normalized = normalize(searchText);

    for (const city of cityKeywords) {
      if (city.values.some((word) => normalized.includes(normalize(word)))) {
        return city.key;
      }
    }

    return null;
  };

  const getCategoryLabel = (key) => {
    const hit = metaByKey[key];
    if (!hit) return key;
    return isArabic ? hit.nameAr : hit.nameEn;
  };

  const getBusinessCategoryLabel = (b) => {
    const vals = extractCategoryValues(b);
    if (!vals.length) return t("Uncategorized", "غير مصنف");
    return vals
      .map((v) => (metaByKey[v] ? getCategoryLabel(v) : v))
      .join(" • ");
  };

  const trackAction = async (endpoint, businessId) => {
    try {
      await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch {}
  };

  const filteredBusinesses = useMemo(() => {
    const typedCategory = detectSmartCategory(query);
    const typedCity = detectSmartCity(query);
    const selectedCategory = category !== "all" ? category : typedCategory;

    const ranked = businesses
      .map((b) => {
        const blob = getBusinessTextBlob(b);
        const businessCategories = extractCategoryValues(b);
        let score = 0;

        const q = normalize(query);

        if (!q) score += 1;

        if (q && normalize(b.name).includes(q)) score += 8;
        if (q && normalize(b.name_ar).includes(q)) score += 8;
        if (q && normalize(b.description).includes(q)) score += 3;
        if (q && normalize(b.locationText).includes(q)) score += 4;

        const words = q.split(/\s+/).filter(Boolean);
        words.forEach((word) => {
          if (blob.includes(word)) score += 1.2;
        });

        if (selectedCategory && businessCategories.includes(selectedCategory)) {
          score += 6;
        }

        if (typedCity) {
          const cityMatch = cityKeywords
            .find((c) => c.key === typedCity)
            ?.values.some((word) => blob.includes(normalize(word)));
          if (cityMatch) score += 5;
        }

        return { ...b, _smartScore: score };
      })
      .filter((b) => {
        const selectedCategory = category !== "all" ? category : detectSmartCategory(query);
        const typedCity = detectSmartCity(query);

        const businessCategories = extractCategoryValues(b);
        const blob = getBusinessTextBlob(b);

        const queryOk =
          !query.trim() ||
          b._smartScore > 0 ||
          blob.includes(normalize(query));

        const categoryOk =
          !selectedCategory || businessCategories.includes(selectedCategory);

        const cityOk =
          !typedCity ||
          cityKeywords
            .find((c) => c.key === typedCity)
            ?.values.some((word) => blob.includes(normalize(word)));

        return queryOk && categoryOk && cityOk;
      })
      .sort((a, b) => b._smartScore - a._smartScore);

    return ranked;
  }, [businesses, query, category]);

  const smartHint = useMemo(() => {
    const detectedCategory = detectSmartCategory(query);
    const detectedCity = detectSmartCity(query);

    if (!query.trim()) return null;
    if (!detectedCategory && !detectedCity) return null;

    return {
      category: detectedCategory ? getCategoryLabel(detectedCategory) : null,
      city: detectedCity,
    };
  }, [query, category]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px 16px 40px",
        fontFamily: isArabic ? "Tajawal, Inter, sans-serif" : "Inter, sans-serif",
        direction: isArabic ? "rtl" : "ltr",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            color: "#fff",
            borderRadius: 24,
            padding: "28px 22px",
            marginBottom: 20,
            boxShadow: "0 14px 35px rgba(34,197,94,0.18)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              textAlign: "center",
            }}
          >
            {t("Smart Business Search", "البحث الذكي عن الأنشطة")}
          </h1>

          <p
            style={{
              margin: "12px auto 0",
              maxWidth: 760,
              textAlign: "center",
              lineHeight: 1.9,
              color: "rgba(255,255,255,0.95)",
            }}
          >
            {t(
              "Search naturally by name, category, or city. Example: coffee in Amman",
              "ابحث بطريقة طبيعية بالاسم أو الفئة أو المدينة. مثال: مطعم في عمان"
            )}
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 18,
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 12,
            }}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "Search by name, category, or city",
                "ابحث بالاسم أو الفئة أو المدينة"
              )}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "1rem",
                background: "#fff",
                boxSizing: "border-box",
                direction: isArabic ? "rtl" : "ltr",
              }}
            >
              <option value="all">{t("All Categories", "كل الفئات")}</option>
              {metaCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {isArabic ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
          </div>

          {smartHint && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 12,
                background: "#f0fdf4",
                color: "#166534",
                fontSize: "0.95rem",
              }}
            >
              {isArabic ? "فهم البحث:" : "Search understood as:"}{" "}
              {smartHint.category ? `${smartHint.category} ` : ""}
              {smartHint.city ? `• ${smartHint.city}` : ""}
            </div>
          )}
        </div>

        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: "#475569", fontWeight: 600 }}>
            {loading
              ? t("Loading businesses...", "جارٍ تحميل الأنشطة...")
              : `${filteredBusinesses.length} ${
                  isArabic ? "نتيجة" : "results"
                }`}
          </div>

          <button
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
            style={{
              background: "#fff",
              border: "1px solid #dbe2ea",
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {t("Clear Filters", "مسح الفلاتر")}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: "30px 0" }}>
            {t("Loading...", "جارٍ التحميل...")}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "32px 20px",
              textAlign: "center",
              border: "1px solid #e5e7eb",
              color: "#64748b",
            }}
          >
            {t("No matching businesses found.", "لم يتم العثور على نتائج مطابقة.")}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            {filteredBusinesses.map((b) => {
              const businessId = b._id || b.id;
              const whatsappHref =
                b.whatsappLink ||
                `https://wa.me/${(b.whatsapp || "").toString().replace(/\D/g, "")}`;

              const mapHref =
                b.mapLink && String(b.mapLink).startsWith("http")
                  ? b.mapLink
                  : b.latitude && b.longitude
                  ? `https://www.google.com/maps?q=${b.latitude},${b.longitude}`
                  : null;

              return (
                <div
                  key={businessId}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: 170,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {b.logo ? (
                      <img
                        src={b.logo}
                        alt={b.name || b.name_ar || "Business"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div style={{ color: "#94a3b8", fontWeight: 600 }}>
                        {t("No logo", "لا يوجد شعار")}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: "1.12rem",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {b.name_ar || b.name || t("Business", "نشاط")}
                    </h3>

                    <div
                      style={{
                        display: "inline-block",
                        width: "fit-content",
                        background: "#16a34a",
                        color: "#fff",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      {getBusinessCategoryLabel(b)}
                    </div>

                    <p
                      style={{
                        color: "#475569",
                        lineHeight: 1.8,
                        margin: "0 0 10px",
                        fontSize: "0.95rem",
                        minHeight: 52,
                      }}
                    >
                      {b.description || t("No description available.", "لا يوجد وصف متاح.")}
                    </p>

                    {b.locationText && (
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "0.92rem",
                          marginBottom: 12,
                        }}
                      >
                        📍 {b.locationText}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: "auto",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => {
                          navigate(`/business/${businessId}`);
                          trackAction("/api/track-click", businessId);
                        }}
                        style={{
                          flex: "1 1 120px",
                          background: "#f1f5f9",
                          color: "#0f172a",
                          border: "none",
                          borderRadius: 12,
                          padding: "11px 12px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {t("Details", "التفاصيل")}
                      </button>

                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackAction("/api/track-whatsapp", businessId)}
                        style={{
                          flex: "1 1 120px",
                          textAlign: "center",
                          background: "#16a34a",
                          color: "#fff",
                          borderRadius: 12,
                          padding: "11px 12px",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        💬 {t("Chat", "تواصل")}
                      </a>

                      {mapHref && (
                        <a
                          href={mapHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackAction("/api/track-map", businessId)}
                          style={{
                            flex: "1 1 100%",
                            textAlign: "center",
                            background: "#ecfeff",
                            color: "#0f766e",
                            borderRadius: 12,
                            padding: "10px 12px",
                            textDecoration: "none",
                            fontWeight: 700,
                            marginTop: 2,
                          }}
                        >
                          📍 {t("Open Location", "فتح الموقع")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .smart-grid-mobile {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 820px) {
          div[style*="grid-template-columns: 2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
