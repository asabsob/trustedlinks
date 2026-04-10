import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function Search({ lang = "en" }) {
  const navigate = useNavigate();
  const isArabic = lang === "ar";
  const dir = isArabic ? "rtl" : "ltr";

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

  useEffect(() => {
    let cancelled = false;
    
async function loadBusinesses() {
  try {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/businesses`);
    const data = await res.json().catch(() => null);

    if (!cancelled) {
      setBusinesses(Array.isArray(data?.results) ? data.results : []);
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

  const getCategoryLabel = (key) => {
    const hit = metaByKey[key];
    if (!hit) return key;
    return isArabic ? hit.nameAr : hit.nameEn;
  };

  const getBusinessCategoryLabel = (b) => {
    const vals = extractCategoryValues(b);
    if (!vals.length) return t("Uncategorized", "غير مصنف");
    return vals.map((v) => (metaByKey[v] ? getCategoryLabel(v) : v)).join(" • ");
  };

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
        "أظافر",
        "حلاقة",
      ],
      SHOPPING_RETAIL: [
        "shop",
        "shopping",
        "store",
        "retail",
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
        "خدمه",
        "مكتب",
        "استشارات",
        "شركة",
      ],
      BEVERAGES: [
        "bubble tea",
        "tea",
        "drinks",
        "juice",
        "smoothie",
        "beverage",
        "شاي",
        "مشروبات",
        "عصير",
        "بوبل تي",
        "بابل تي",
      ],
    }),
    []
  );

  const detectSmartCategory = (searchText) => {
    const normalized = normalize(searchText);
    for (const [categoryKey, keywords] of Object.entries(smartCategoryMap)) {
      if (keywords.some((word) => normalized.includes(normalize(word)))) {
        return categoryKey;
      }
    }
    return null;
  };

const getDisplayName = (b) => {
  if (isArabic) return String(b.name_ar || "").trim();
  return String(b.name || "").trim();
};

const getDisplayDescription = (b) => {
  if (isArabic) return b.description_ar || "";
  return b.description || "";
};
  
const getDisplayKeywords = (b) => {
  if (isArabic) {
    return Array.isArray(b.keywords_ar)
      ? b.keywords_ar.map((x) => String(x).trim()).filter(Boolean)
      : [];
  }

  return Array.isArray(b.keywords)
    ? b.keywords.map((x) => String(x).trim()).filter(Boolean)
    : [];
};

 const getSearchBlob = (b) =>
  normalize(
    [
      getDisplayName(b),
      getDisplayDescription(b),
      ...getDisplayKeywords(b),
    ].join(" ")
  );

 const filteredBusinesses = useMemo(() => {
  const typedCategory = detectSmartCategory(query);
  const selectedCategory = category !== "all" ? category : typedCategory;
  const q = normalize(query);

  return businesses
    .map((b) => {
      const blob = getSearchBlob(b);
      const categories = extractCategoryValues(b);
      const displayName = getDisplayName(b);
      const displayDescription = getDisplayDescription(b);
      const displayLocation = getDisplayLocation(b);

      let score = 0;

      if (!q) score += 1;

      if (q && normalize(displayName).includes(q)) score += 10;
      if (q && normalize(displayDescription).includes(q)) score += 4;
      if (q && normalize(displayLocation).includes(q)) score += 3;

      if (isArabic) {
        if (q && normalize(b.name_ar || "").includes(q)) score += 6;
        if (q && normalize(b.description_ar || "").includes(q)) score += 4;
      } else {
        if (q && normalize(b.name || "").includes(q)) score += 6;
        if (q && normalize(b.description || "").includes(q)) score += 4;
      }

      q
        .split(/\s+/)
        .filter(Boolean)
        .forEach((word) => {
          if (blob.includes(word)) score += 1.2;
        });

      if (selectedCategory && categories.includes(selectedCategory)) {
        score += 6;
      }

      return { ...b, _score: score };
    })
    .filter((b) => {
      const categories = extractCategoryValues(b);
      const selectedCategory =
        category !== "all" ? category : detectSmartCategory(query);

      const queryOk = !q || b._score > 0;
      const categoryOk =
        !selectedCategory || categories.includes(selectedCategory);

      return queryOk && categoryOk;
    })
    .filter((b) => {
      return Boolean(b.name_ar || b.description_ar || b.name || b.description);
    })
    .sort((a, b) => b._score - a._score);
}, [businesses, query, category, isArabic]);

  const trackAction = async (endpoint, businessId) => {
    try {
      await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch {}
  };

  const getWhatsappUrl = (b) => {
  if (b.lead_link) return b.lead_link;

  if (b.whatsappLink) return b.whatsappLink;

  const phone = (b.whatsapp || "").toString().replace(/\D/g, "");
  return phone ? `https://wa.me/${phone}` : "#";
};

  const getMapUrl = (b) => {
    if (b.mapLink && String(b.mapLink).startsWith("http")) return b.mapLink;
    if (b.latitude && b.longitude) {
      return `https://www.google.com/maps?q=${b.latitude},${b.longitude}`;
    }
    return null;
  };

  const getLogoUrl = (b) => {
    if (b.logo) return b.logo;

    if (
      b.mediaLink &&
      /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(String(b.mediaLink))
    ) {
      return b.mediaLink;
    }

    const displayName = getDisplayName(b);

    if (displayName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        displayName
      )}&background=22c55e&color=fff&size=128`;
    }
    return "";
  };

  const fixUrl = (url) => {
    if (!url) return "";
    return String(url).startsWith("http") ? url : `https://${url}`;
  };

 const getDisplayLocation = (b) => {
  if (isArabic) {
    return String(b.locationText_ar || b.locationText || b.locationText_en || "").trim();
  }
  return String(b.locationText_en || b.locationText || b.locationText_ar || "").trim();
};

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "20px 14px 40px",
        fontFamily: isArabic ? "Tajawal, Inter, sans-serif" : "Inter, sans-serif",
        direction: dir,
      }}
    >
      <div style={{ maxWidth: 1220, margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            borderRadius: 26,
            padding: "30px 20px",
            color: "#fff",
            marginBottom: 18,
            boxShadow: "0 16px 36px rgba(34,197,94,0.18)",
          }}
        >
          <h1
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: "clamp(1.9rem, 4vw, 2.9rem)",
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {t("Discover Trusted Businesses", "اكتشف الأنشطة الموثوقة")}
          </h1>

          <p
            style={{
              margin: "12px auto 0",
              maxWidth: 760,
              textAlign: "center",
              lineHeight: 1.9,
              color: "rgba(255,255,255,0.96)",
              fontSize: "0.98rem",
            }}
          >
            {t(
              "Search by business name, category, or city and connect instantly.",
              "ابحث باسم النشاط أو الفئة أو المدينة وتواصل مباشرة."
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
            className="search-top-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.7fr 1fr auto",
              gap: 12,
              alignItems: "center",
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
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "1rem",
                boxSizing: "border-box",
                textAlign: isArabic ? "right" : "left",
              }}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "1rem",
                background: "#fff",
                boxSizing: "border-box",
                direction: dir,
              }}
            >
              <option value="all">{t("All Categories", "كل الفئات")}</option>
              {metaCategories.map((c) => (
                <option key={c.key} value={c.key}>
                  {isArabic ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              style={{
                background: "#f8fafc",
                border: "1px solid #dbe2ea",
                borderRadius: 14,
                padding: "14px 16px",
                cursor: "pointer",
                fontWeight: 700,
                color: "#0f172a",
                whiteSpace: "nowrap",
              }}
            >
              {t("Clear Filters", "مسح الفلاتر")}
            </button>
          </div>
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
          <div style={{ color: "#475569", fontWeight: 700 }}>
            {loading
              ? t("Loading businesses...", "جارٍ تحميل الأنشطة...")
              : `${filteredBusinesses.length} ${t("results", "نتيجة")}`}
          </div>
        </div>

        {loading ? (
          <div style={emptyStateStyle}>
            {t("Loading...", "جارٍ التحميل...")}
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div style={emptyStateStyle}>
            {t("No matching businesses found.", "لم يتم العثور على نتائج مطابقة.")}
          </div>
        ) : (
          <div
            className="cards-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: 18,
            }}
          >
            {filteredBusinesses.map((b) => {
              const businessId = b.id || b.custom_id || b._id;
              const logoUrl = getLogoUrl(b);
              const whatsappUrl = getWhatsappUrl(b);
              const mapUrl = getMapUrl(b);
              const instagramUrl =
                b.mediaLink && String(b.mediaLink).includes("instagram")
                  ? b.mediaLink
                  : null;
              const displayName = getDisplayName(b) || (isArabic ? "نشاط" : "Business");
   const displayDescription =
  getDisplayDescription(b) ||
  (isArabic
    ? "تفاصيل النشاط غير محدثة بعد"
    : "Business details will be updated soon");
              return (
                <div
                  key={businessId}
                  style={{
                    background: "#fff",
                    borderRadius: 22,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "0.2s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "22px 18px 14px",
                      background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      minHeight: 170,
                    }}
                  >
                    <img
                      src={logoUrl}
                      alt={displayName}
                      style={{
                        width: 84,
                        height: 84,
                        objectFit: "cover",
                        borderRadius: 18,
                        border: "1px solid #e2e8f0",
                        background: "#fff",
                        boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                      }}
                    />

                    <div style={{ textAlign: "center", width: "100%" }}>
                      <h3
                        style={{
                          margin: "0 0 8px",
                          fontSize: "1.12rem",
                          fontWeight: 800,
                          color: "#0f172a",
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        {displayName}
                      </h3>

                      <div
                        style={{
                          display: "inline-block",
                          background: "#16a34a",
                          color: "#fff",
                          borderRadius: 999,
                          padding: "5px 12px",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        {getBusinessCategoryLabel(b)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <p
                      style={{
                        color: "#475569",
                        lineHeight: 1.8,
                        margin: "0 0 10px",
                        fontSize: "0.95rem",
                        minHeight: 74,
                        textAlign: isArabic ? "right" : "left",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {displayDescription}
                    </p>

                  {getDisplayLocation(b) ? (
  <div
    style={{
      color: "#64748b",
      fontSize: "0.92rem",
      marginBottom: 14,
      textAlign: isArabic ? "right" : "left",
    }}
  >
    📍 {getDisplayLocation(b)}
  </div>
) : (
  <div
    style={{
      color: "#94a3b8",
      fontSize: "0.92rem",
      marginBottom: 14,
      textAlign: isArabic ? "right" : "left",
    }}
  >
    📍 {t("Location not added", "الموقع غير مضاف")}
  </div>
)}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginTop: "auto",
                      }}
                    >
                      <button
                        onClick={() => {
                          navigate(`/business/${businessId}`);
                          trackAction("/api/track-click", businessId);
                        }}
                        style={{
                          background: "#f1f5f9",
                          color: "#0f172a",
                          border: "none",
                          borderRadius: 12,
                          padding: "12px 14px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {t("View Details", "عرض التفاصيل")}
                      </button>

                      <a
                        href={fixUrl(whatsappUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackAction("/api/track-whatsapp", businessId)}
                        style={{
                          textAlign: "center",
                          background: "#16a34a",
                          color: "#fff",
                          borderRadius: 12,
                          padding: "12px 14px",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        💬 {t("Chat Now", "تواصل الآن")}
                      </a>
                    </div>

                    {mapUrl && (
                      <a
                        href={fixUrl(mapUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackAction("/api/track-map", businessId)}
                        style={{
                          marginTop: 10,
                          textAlign: "center",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          borderRadius: 12,
                          padding: "11px 14px",
                          textDecoration: "none",
                          fontWeight: 700,
                          display: "block",
                        }}
                      >
                        📍 {t("Open Location", "فتح الموقع")}
                      </a>
                    )}

                    {instagramUrl && (
                      <a
                        href={fixUrl(instagramUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackAction("/api/track-media", businessId)}
                        style={{
                          marginTop: 10,
                          textAlign: "center",
                          background: "#fdf2f8",
                          color: "#be185d",
                          borderRadius: 12,
                          padding: "11px 14px",
                          textDecoration: "none",
                          fontWeight: 700,
                          display: "block",
                        }}
                      >
                        📸 {t("Instagram", "إنستغرام")}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .search-top-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const emptyStateStyle = {
  background: "#fff",
  borderRadius: 18,
  padding: "32px 20px",
  textAlign: "center",
  border: "1px solid #e5e7eb",
  color: "#64748b",
};
