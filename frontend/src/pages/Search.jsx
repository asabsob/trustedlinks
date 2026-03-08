import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function Search({ lang = "en" }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [businesses, setBusinesses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);
  const navigate = useNavigate();

  const metaCategories = useMemo(
    () => [
      { key: "AUTOMOTIVE", nameEn: "Automotive", nameAr: "سيارات" },
      { key: "BEAUTY_SPA_SALON", nameEn: "Beauty, Spa and Salon", nameAr: "تجميل وصالون" },
      { key: "CLOTHING_APPAREL", nameEn: "Clothing and Apparel", nameAr: "ملابس وأزياء" },
      { key: "EDUCATION", nameEn: "Education", nameAr: "تعليم" },
      { key: "ENTERTAINMENT", nameEn: "Entertainment", nameAr: "ترفيه" },
      { key: "EVENT_PLANNING", nameEn: "Event Planning and Service", nameAr: "تنظيم الفعاليات والخدمات" },
      { key: "FINANCE_BANKING", nameEn: "Finance and Banking", nameAr: "تمويل وبنوك" },
      { key: "FOOD_GROCERY", nameEn: "Food and Grocery", nameAr: "طعام وبقالة" },
      { key: "BEVERAGES", nameEn: "Beverages", nameAr: "مشروبات" },
      { key: "PUBLIC_SERVICE", nameEn: "Public Service", nameAr: "خدمات عامة" },
      { key: "HOTEL_LODGING", nameEn: "Hotel and Lodging", nameAr: "فنادق وإقامة" },
      { key: "MEDICAL_HEALTH", nameEn: "Medical and Health", nameAr: "صحة وطبية" },
      { key: "OVER_THE_COUNTER_DRUGS", nameEn: "Over-the-Counter Drugs", nameAr: "أدوية بدون وصفة" },
      { key: "NON_PROFIT", nameEn: "Non-profit", nameAr: "غير ربحي" },
      { key: "PROFESSIONAL_SERVICES", nameEn: "Professional Services", nameAr: "خدمات مهنية" },
      { key: "SHOPPING_RETAIL", nameEn: "Shopping and Retail", nameAr: "تسوق وتجزئة" },
      { key: "TRAVEL_TRANSPORTATION", nameEn: "Travel and Transportation", nameAr: "سفر ومواصلات" },
      { key: "RESTAURANT", nameEn: "Restaurant", nameAr: "مطعم / مقهى" },
      { key: "OTHER", nameEn: "Other", nameAr: "أخرى" },
    ],
    []
  );

  const metaByKey = useMemo(
    () => Object.fromEntries(metaCategories.map((c) => [c.key, c])),
    [metaCategories]
  );

  const labelForKey = (key) => {
    const hit = metaByKey[key];
    if (!hit) return key;
    return lang === "ar" ? hit.nameAr : hit.nameEn;
  };

  const extractCategoryValues = (b) => {
    const raw = b.category ?? [];
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr
      .filter(Boolean)
      .map((v) => (typeof v === "string" ? v : v.key || v.name || ""));
  };

  const businessHasCategory = (b, selectedKey) => {
    if (selectedKey === "all") return true;

    const vals = extractCategoryValues(b).map((s) => s.toUpperCase().trim());
    if (vals.includes(selectedKey)) return true;

    const selectedLabelEn = metaByKey[selectedKey]?.nameEn?.toLowerCase();
    const selectedLabelAr = metaByKey[selectedKey]?.nameAr?.toLowerCase();

    return extractCategoryValues(b).some((v) => {
      const s = (v || "").toString().toLowerCase();
      return (
        (selectedLabelEn && s.includes(selectedLabelEn)) ||
        (selectedLabelAr && s.includes(selectedLabelAr))
      );
    });
  };

  const displayCategoryChip = (b) => {
    const vals = extractCategoryValues(b);
    if (vals.length === 0) return lang === "ar" ? "غير مصنّف" : "Uncategorized";

    return vals
      .map((v) => {
        const upper = v.toUpperCase().trim();
        return metaByKey[upper] ? labelForKey(upper) : v;
      })
      .join(", ");
  };

  useEffect(() => {
    let cancelled = false;

    async function loadBusinesses() {
      try {
        const res = await fetch(`${API_BASE}/api/businesses`);
        const data = await res.json().catch(() => []);

        if (!res.ok) throw new Error(data?.error || "Failed to load businesses");
        if (cancelled) return;

        const safeData = Array.isArray(data) ? data : [];
        setBusinesses(safeData);
        setFiltered(safeData);
      } catch {
        if (cancelled) return;
        setBusinesses([]);
        setFiltered([]);
      }
    }

    loadBusinesses();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = () => {
    let results = businesses;

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (b) =>
          (b.name || "").toLowerCase().includes(q) ||
          (b.name_ar || "").toLowerCase().includes(q) ||
          (b.description || "").toLowerCase().includes(q)
      );
    }

    if (category !== "all") {
      results = results.filter((b) => businessHasCategory(b, category));
    }

    setFiltered(results);
  };

  const trackClick = async (businessId) => {
    try {
      await fetch(`${API_BASE}/api/track-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch {}
  };

  const trackMedia = async (businessId) => {
    try {
      await fetch(`${API_BASE}/api/track-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch {}
  };

  const trackWhatsapp = async (businessId) => {
    try {
      await fetch(`${API_BASE}/api/track-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch {}
  };

  const trackMap = async (businessId) => {
    try {
      await fetch(`${API_BASE}/api/track-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch {}
  };

  const getMapUrl = (b) => {
    if (b.mapLink && b.mapLink.trim().startsWith("http")) {
      return b.mapLink.trim();
    }
    return null;
  };

  return (
    <div
      className="section"
      style={{
        padding: "40px 20px",
        fontFamily: lang === "ar" ? "Tajawal, sans-serif" : "Inter, sans-serif",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "32px",
        }}
      >
        <div style={{ minWidth: 260 }}>
          <label style={{ display: "block", marginBottom: 4, color: "#555" }}>
            {lang === "ar" ? "ابحث عن الأنشطة" : "Search for businesses"}
          </label>
          <input
            type="text"
            placeholder={
              lang === "ar"
                ? "أدخل اسم النشاط أو كلمة مفتاحية..."
                : "Enter business name or keyword..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ minWidth: 260 }}>
          <label style={{ display: "block", marginBottom: 4, color: "#555" }}>
            {lang === "ar" ? "تصفية حسب الفئة" : "Filter by Category"}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              direction: lang === "ar" ? "rtl" : "ltr",
              textAlign: lang === "ar" ? "right" : "left",
            }}
          >
            <option value="all">{lang === "ar" ? "كل الفئات" : "All Categories"}</option>
            {metaCategories.map((c) => (
              <option key={c.key} value={c.key}>
                {lang === "ar" ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          style={{
            background: "#22c55e",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: "500",
            height: "fit-content",
            marginTop: "22px",
          }}
        >
          {lang === "ar" ? "بحث" : "Search"}
        </button>
      </div>

      <div className="container">
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          {lang === "ar" ? "الأنشطة الموثقة" : "Verified Businesses"}
        </h2>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            {lang === "ar"
              ? "لم يتم العثور على نتائج مطابقة."
              : "No matching businesses found."}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {filtered.map((b) => {
              const businessId = b._id || b.id;
              const mapUrl = getMapUrl(b);
              const isActive = activeLocation === businessId;

              return (
                <div
                  key={businessId}
                  className="card"
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "180px",
                      borderRadius: "10px 10px 0 0",
                      background: "#f9fafb",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {b.mediaLink ? (
                      /instagram\.com/.test(b.mediaLink) ? (
                        <div
                          onClick={() => trackMedia(businessId)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                            alt="Instagram"
                            style={{ width: 36, height: 36 }}
                          />
                          <a
                            href={b.mediaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "13px",
                              color: "#22c55e",
                              textDecoration: "underline",
                              cursor: "pointer",
                            }}
                          >
                            {lang === "ar" ? "عرض على إنستغرام" : "View on Instagram"}
                          </a>
                        </div>
                      ) : /\.(jpg|jpeg|png|gif|webp)$/i.test(b.mediaLink) ? (
                        <img
                          onClick={() => trackMedia(businessId)}
                          src={b.mediaLink}
                          alt={b.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "10px 10px 0 0",
                          }}
                        />
                      ) : (
                        <iframe
                          src={b.mediaLink}
                          title={b.name}
                          width="100%"
                          height="180"
                          onLoad={() => trackMedia(businessId)}
                          style={{
                            borderRadius: "10px 10px 0 0",
                            border: "none",
                          }}
                        />
                      )
                    ) : (
                      <div style={{ color: "#aaa" }}>
                        {lang === "ar" ? "لا يوجد محتوى" : "No media"}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "16px" }}>
                    <h3 style={{ marginBottom: 8 }}>{b.name || b.name_ar}</h3>

                    <div
                      style={{
                        background: "#22c55e",
                        color: "white",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        display: "inline-block",
                        marginBottom: "8px",
                      }}
                    >
                      {displayCategoryChip(b)}
                    </div>

                    <p style={{ color: "#555", fontSize: "15px", marginBottom: 8 }}>
                      {b.description || (lang === "ar" ? "لا يوجد وصف" : "No description")}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: 10,
                        marginBottom: 12,
                      }}
                    >
                      {mapUrl ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(mapUrl, "_blank", "noopener,noreferrer");
                            setActiveLocation(businessId);
                            trackMap(businessId);
                          }}
                          title="Open in Google Maps"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            border: "1.5px solid #22c55e",
                            background: isActive ? "#22c55e" : "#f0fdf4",
                            color: isActive ? "#fff" : "#22c55e",
                            fontSize: "18px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          📍
                        </button>
                      ) : (
                        <span style={{ color: "#999" }}>📍 —</span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "space-between",
                      }}
                    >
                      <button
                        onClick={() => {
                          navigate(`/business/${businessId}`);
                          trackClick(businessId);
                        }}
                        style={{
                          flex: 1,
                          background: "#f3f4f6",
                          border: "none",
                          borderRadius: "6px",
                          padding: "10px 0",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        {lang === "ar" ? "عرض التفاصيل" : "View Details"}
                      </button>

                      <a
                        href={
                          b.whatsappLink ||
                          `https://wa.me/${(b.whatsapp || "").toString().replace(/\D/g, "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          trackWhatsapp(businessId);
                        }}
                        style={{
                          flex: 1,
                          textAlign: "center",
                          background: "#22c55e",
                          color: "white",
                          borderRadius: "6px",
                          padding: "10px 0",
                          textDecoration: "none",
                          fontWeight: "500",
                        }}
                      >
                        💬 {lang === "ar" ? "تواصل الآن" : "Chat Now"}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
