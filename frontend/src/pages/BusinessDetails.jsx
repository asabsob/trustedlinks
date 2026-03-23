import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function BusinessDetails({ lang = "en" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isArabic = lang === "ar";

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = (en, ar) => (isArabic ? ar : en);

  const metaCategories = useMemo(
    () => ({
      RESTAURANT: { en: "Restaurant", ar: "مطعم / مقهى" },
      SHOPPING_RETAIL: { en: "Retail", ar: "تجزئة" },
      PROFESSIONAL_SERVICES: { en: "Services", ar: "خدمات" },
      BEAUTY_SPA_SALON: { en: "Beauty", ar: "تجميل" },
      AUTOMOTIVE: { en: "Automotive", ar: "سيارات" },
      EDUCATION: { en: "Education", ar: "تعليم" },
      ENTERTAINMENT: { en: "Entertainment", ar: "ترفيه" },
      FINANCE_BANKING: { en: "Finance", ar: "تمويل وبنوك" },
      FOOD_GROCERY: { en: "Food & Grocery", ar: "طعام وبقالة" },
      BEVERAGES: { en: "Beverages", ar: "مشروبات" },
      HOTEL_LODGING: { en: "Hotel & Lodging", ar: "فنادق وإقامة" },
      MEDICAL_HEALTH: { en: "Medical & Health", ar: "صحة وطبية" },
      TRAVEL_TRANSPORTATION: { en: "Travel & Transport", ar: "سفر ومواصلات" },
      OTHER: { en: "Other", ar: "أخرى" },
    }),
    []
  );

  const getCategoryLabel = (category) => {
    if (!category) return t("Uncategorized", "غير مصنف");

    const arr = Array.isArray(category) ? category : [category];
    
const getBusinessDisplayName = (b) => {
  if (!b) return "";
  if (isArabic) return b.name_ar || b.name || "";
  return b.name || b.name_ar || "";
};
    
    return arr
      .map((c) => {
        const key = String(c).toUpperCase().trim();
        return metaCategories[key]
          ? isArabic
            ? metaCategories[key].ar
            : metaCategories[key].en
          : c;
      })
      .join(" • ");
  };

  const getLogoUrl = (b) => {
    if (!b) return "";

    if (b.logo) return b.logo;

    if (
      b.mediaLink &&
      /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(String(b.mediaLink))
    ) {
      return b.mediaLink;
    }

    if (b.name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        b.name
      )}&background=22c55e&color=fff&size=128`;
    }

    return "";
  };

  const fixUrl = (url) => {
    if (!url) return "";
    return String(url).startsWith("http") ? url : `https://${url}`;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadBusiness() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/business/${id}`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          if (!cancelled) setBusiness(null);
          return;
        }

        if (!cancelled) setBusiness(data);
      } catch {
        if (!cancelled) setBusiness(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBusiness();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const whatsappUrl =
    business?.whatsappLink ||
    `https://wa.me/${(business?.whatsapp || "").toString().replace(/\D/g, "")}`;

  const mapUrl =
    business?.mapLink ||
    (business?.latitude && business?.longitude
      ? `https://www.google.com/maps?q=${business.latitude},${business.longitude}`
      : null);

  const instagramUrl =
    business?.mediaLink && String(business.mediaLink).includes("instagram")
      ? business.mediaLink
      : null;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          fontFamily: isArabic ? "Tajawal, Inter, sans-serif" : "Inter, sans-serif",
        }}
      >
        <div style={{ color: "#64748b", fontWeight: 600 }}>
          {t("Loading...", "جارٍ التحميل...")}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: 20,
          fontFamily: isArabic ? "Tajawal, Inter, sans-serif" : "Inter, sans-serif",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 28,
            textAlign: "center",
            color: "#64748b",
          }}
        >
          {t("Business not found.", "لم يتم العثور على النشاط.")}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px 16px 40px",
        direction: isArabic ? "rtl" : "ltr",
        fontFamily: isArabic ? "Tajawal, Inter, sans-serif" : "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "1px solid #dbe2ea",
              background: "#fff",
              cursor: "pointer",
              borderRadius: 12,
              padding: "10px 14px",
              color: "#0f172a",
              fontWeight: 700,
            }}
          >
            ← {t("Back", "رجوع")}
          </button>

          <div style={{ color: "#64748b", fontSize: 14 }}>
            {t("Business Details", "تفاصيل النشاط")}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "28px 22px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 108,
              height: 108,
              margin: "0 auto 16px",
              borderRadius: 24,
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              background: "#fff",
              boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
            }}
          >
            <img
              src={getLogoUrl(business)}
              alt={business.name || "logo"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>

          <h1
  style={{
    margin: "0 0 8px",
    fontSize: "clamp(1.6rem, 4vw, 2rem)",
    color: "#0f172a",
    fontWeight: 800,
    lineHeight: 1.3,
  }}
>
  {getBusinessDisplayName(business)}
</h1>

          <div
            style={{
              display: "inline-block",
              background: "#16a34a",
              color: "#fff",
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 14,
              marginBottom: 16,
              fontWeight: 700,
            }}
          >
            {getCategoryLabel(business.category)}
          </div>

          <p
            style={{
              color: "#475569",
              margin: "0 auto 16px",
              maxWidth: 620,
              lineHeight: 1.9,
              fontSize: 15,
            }}
          >
            {business.description || t("No description available.", "لا يوجد وصف متاح.")}
          </p>

          {business.locationText && (
            <div
              style={{
                color: "#0f766e",
                background: "#ecfeff",
                border: "1px solid #cffafe",
                borderRadius: 14,
                padding: "12px 14px",
                display: "inline-block",
                marginBottom: 20,
                fontWeight: 600,
              }}
            >
              📍 {business.locationText}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 8,
            }}
          >
            {mapUrl && (
              <a
                href={fixUrl(mapUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#f1f5f9",
                  padding: 14,
                  borderRadius: 14,
                  textDecoration: "none",
                  color: "#111827",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                📍 {t("Location", "الموقع")}
              </a>
            )}

            <a
              href={fixUrl(whatsappUrl)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#22c55e",
                color: "#fff",
                padding: 14,
                borderRadius: 14,
                textDecoration: "none",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              💬 {t("Chat on WhatsApp", "تواصل عبر واتساب")}
            </a>

            {instagramUrl && (
              <a
                href={fixUrl(instagramUrl)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#fdf2f8",
                  color: "#be185d",
                  padding: 14,
                  borderRadius: 14,
                  textDecoration: "none",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                📸 {t("Instagram", "إنستغرام")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
