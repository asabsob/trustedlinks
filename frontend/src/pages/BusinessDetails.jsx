import React, { useEffect, useState, useMemo } from "react";
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
        const key = String(c).toUpperCase();
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

    async function load() {
      try {
        setLoading(true);
       fetch(`${API_BASE}/api/business/${id}`)
        const data = await res.json();
        if (!cancelled) setBusiness(data);
      } catch {
        if (!cancelled) setBusiness(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => (cancelled = true);
  }, [id]);

  const getLogo = () => {
    if (business?.logo) return business.logo;
    return "";
  };

  const whatsappUrl =
    business?.whatsappLink ||
    `https://wa.me/${(business?.whatsapp || "").replace(/\D/g, "")}`;

  const mapUrl =
    business?.mapLink ||
    (business?.latitude && business?.longitude
      ? `https://www.google.com/maps?q=${business.latitude},${business.longitude}`
      : null);

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!business) return <p style={{ textAlign: "center" }}>Not found</p>;

  return (
    <div style={container(isArabic)}>
      <div style={card}>
        
        {/* 🔝 Header */}
        <div style={header}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            ← {t("Back", "رجوع")}
          </button>

          {getLogo() ? (
            <img src={getLogo()} style={logo} />
          ) : (
            <div style={logoFallback}>
              {(business.name || "B")[0]}
            </div>
          )}

          <h2 style={title}>
            {business.name_ar || business.name}
          </h2>

          <div style={category}>
            {getCategoryLabel(business.category)}
          </div>
        </div>

        {/* 📄 Description */}
        <p style={desc}>
          {business.description || t("No description", "لا يوجد وصف")}
        </p>

        {/* 📍 Location */}
        {business.locationText && (
          <div style={location}>
            📍 {business.locationText}
          </div>
        )}

        {/* 🔘 Actions */}
        <div style={actions}>
          {mapUrl && (
            <a href={mapUrl} target="_blank" style={btnLight}>
              📍 {t("Location", "الموقع")}
            </a>
          )}

          <a href={whatsappUrl} target="_blank" style={btnPrimary}>
            💬 {t("Chat", "تواصل")}
          </a>
        </div>
      </div>
    </div>
  );
}

/* 🎨 Styles */

const container = (rtl) => ({
  minHeight: "100vh",
  background: "#f8fafc",
  padding: 20,
  direction: rtl ? "rtl" : "ltr",
});

const card = {
  maxWidth: 600,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 20,
  padding: 30,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  textAlign: "center",
};

const header = {
  marginBottom: 20,
};

const backBtn = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  marginBottom: 10,
  color: "#16a34a",
};

const logo = {
  width: 90,
  height: 90,
  borderRadius: 20,
  objectFit: "cover",
  marginBottom: 12,
};

const logoFallback = {
  width: 90,
  height: 90,
  borderRadius: 20,
  background: "#eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: "bold",
  margin: "0 auto 12px",
};

const title = {
  marginBottom: 6,
};

const category = {
  background: "#22c55e",
  color: "#fff",
  display: "inline-block",
  padding: "6px 14px",
  borderRadius: 20,
  fontSize: 14,
};

const desc = {
  color: "#555",
  marginTop: 16,
};

const location = {
  marginTop: 10,
  color: "#16a34a",
};

const actions = {
  display: "flex",
  gap: 10,
  marginTop: 20,
};

const btnPrimary = {
  flex: 1,
  background: "#22c55e",
  color: "#fff",
  padding: 12,
  borderRadius: 10,
  textDecoration: "none",
};

const btnLight = {
  flex: 1,
  background: "#f1f5f9",
  padding: 12,
  borderRadius: 10,
  textDecoration: "none",
};
