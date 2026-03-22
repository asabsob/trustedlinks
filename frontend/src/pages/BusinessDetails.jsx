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
      RESTAURANT: { en: "Restaurant", ar: "مطعم" },
      SHOPPING_RETAIL: { en: "Retail", ar: "تجزئة" },
      PROFESSIONAL_SERVICES: { en: "Services", ar: "خدمات" },
      BEAUTY_SPA_SALON: { en: "Beauty", ar: "تجميل" },
      OTHER: { en: "Other", ar: "أخرى" },
    }),
    []
  );

  const getCategoryLabel = (category) => {
    if (!category) return t("Uncategorized", "غير مصنف");

    const arr = Array.isArray(category) ? category : [category];

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

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>;
  }

  if (!business) {
    return <p style={{ textAlign: "center", padding: 40 }}>Business not found.</p>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 20,
        direction: isArabic ? "rtl" : "ltr",
        fontFamily: isArabic ? "Tajawal, Inter, sans-serif" : "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 20,
          padding: 30,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            marginBottom: 14,
            color: "#16a34a",
            fontWeight: 700,
          }}
        >
          ← {t("Back", "رجوع")}
        </button>

       {getLogoUrl(business) ? (
  <img
    src={getLogoUrl(business)}
    alt={business.name || "logo"}
    style={{
      width: 96,
      height: 96,
      borderRadius: 20,
      objectFit: "cover",
      marginBottom: 14,
      border: "1px solid #e5e7eb",
    }}
  />
) : (
  <div
    style={{
      width: 96,
      height: 96,
      borderRadius: 20,
      background: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 14px",
      fontSize: 28,
      fontWeight: 800,
      color: "#64748b",
    }}
  >
    {(business.name || "B")[0]}
  </div>
)}
        <h2 style={{ marginBottom: 8 }}>
          {business.name_ar || business.name}
        </h2>

        <div
          style={{
            background: "#22c55e",
            color: "#fff",
            display: "inline-block",
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {getCategoryLabel(business.category)}
        </div>

        <p style={{ color: "#555", marginBottom: 14 }}>
          {business.description || t("No description", "لا يوجد وصف")}
        </p>

        {business.locationText && (
          <div style={{ color: "#16a34a", marginBottom: 18 }}>
            📍 {business.locationText}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                background: "#f1f5f9",
                padding: 12,
                borderRadius: 10,
                textDecoration: "none",
                color: "#111827",
                fontWeight: 700,
              }}
            >
              📍 {t("Location", "الموقع")}
            </a>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              background: "#22c55e",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            💬 {t("Chat", "تواصل")}
          </a>
        </div>
      </div>
    </div>
  );
}
