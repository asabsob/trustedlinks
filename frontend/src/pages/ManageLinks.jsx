import React, { useEffect, useMemo, useState } from "react";
import WhatsAppVerify from "../components/WhatsAppVerify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function ManageLinks({ lang = "en" }) {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const token = localStorage.getItem("token") || "";

  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const metaCategories = useMemo(
    () => [
      { key: "AUTOMOTIVE", en: "Automotive", ar: "سيارات" },
      { key: "BEAUTY_SPA_SALON", en: "Beauty, Spa and Salon", ar: "تجميل وصالون" },
      { key: "CLOTHING_APPAREL", en: "Clothing and Apparel", ar: "ملابس وأزياء" },
      { key: "EDUCATION", en: "Education", ar: "تعليم" },
      { key: "ENTERTAINMENT", en: "Entertainment", ar: "ترفيه" },
      { key: "EVENT_PLANNING", en: "Event Planning and Service", ar: "تنظيم الفعاليات والخدمات" },
      { key: "FINANCE_BANKING", en: "Finance and Banking", ar: "تمويل وبنوك" },
      { key: "FOOD_GROCERY", en: "Food and Grocery", ar: "طعام وبقالة" },
      { key: "BEVERAGES", en: "Beverages", ar: "مشروبات" },
      { key: "PUBLIC_SERVICE", en: "Public Service", ar: "خدمات عامة" },
      { key: "HOTEL_LODGING", en: "Hotel and Lodging", ar: "فنادق وإقامة" },
      { key: "MEDICAL_HEALTH", en: "Medical and Health", ar: "صحة وطبية" },
      { key: "NON_PROFIT", en: "Non-profit", ar: "غير ربحي" },
      { key: "PROFESSIONAL_SERVICES", en: "Professional Services", ar: "خدمات مهنية" },
      { key: "SHOPPING_RETAIL", en: "Shopping and Retail", ar: "تسوق وتجزئة" },
      { key: "TRAVEL_TRANSPORTATION", en: "Travel and Transportation", ar: "سفر ومواصلات" },
      { key: "RESTAURANT", en: "Restaurant / Cafe", ar: "مطعم / مقهى" },
      { key: "OTHER", en: "Other", ar: "أخرى" },
    ],
    []
  );

  const t = useMemo(
    () =>
      ({
        en: {
          title: "Manage Your Business Information",
          desc: "Update your business profile, category, media link, map location, and WhatsApp details.",
          statusTitle: "Visibility Status",
          visible_yes: "✅ Live and visible in search",
          visible_pending: "🕓 Pending review",
          visible_no: "⛔ Hidden from search",
          status: "Status",
          details: "Business Details",
          detailsDesc: "Edit the core information displayed for your business profile.",
          name: "Business Name",
          category: "Category",
          media: "Media / Instagram Link",
          map: "Map Location Link",
          openLocation: "Open location",
          save: "Save Changes",
          success: "✅ Updated successfully!",
          update_failed: "❌ Update failed.",
          load_failed: "❌ Failed to load business info.",
          whatsappTitle: "Update WhatsApp Number",
          whatsappDesc: "Verify and update the WhatsApp number connected to this business.",
          actions: "Account Actions",
          actionsDesc: "Careful actions that affect your business visibility or account presence.",
          suspend: "Suspend Link",
          reactivate: "Reactivate Link",
          delete: "Delete Business",
          confirmDelete: "Are you sure?",
          loading: "Loading...",
        },
        ar: {
          title: "إدارة معلومات نشاطك",
          desc: "قم بتحديث ملف نشاطك، الفئة، رابط الوسائط، موقع الخريطة، وتفاصيل واتساب.",
          statusTitle: "حالة الظهور",
          visible_yes: "✅ ظاهر ومتاح في البحث",
          visible_pending: "🕓 قيد المراجعة",
          visible_no: "⛔ مخفي من البحث",
          status: "الحالة",
          details: "بيانات النشاط",
          detailsDesc: "عدّل المعلومات الأساسية الظاهرة في ملف نشاطك.",
          name: "اسم النشاط",
          category: "الفئة",
          media: "رابط الوسائط أو إنستغرام",
          map: "رابط موقع النشاط",
          openLocation: "فتح الموقع",
          save: "حفظ التغييرات",
          success: "✅ تم التحديث بنجاح!",
          update_failed: "❌ فشل التحديث.",
          load_failed: "❌ فشل تحميل بيانات النشاط.",
          whatsappTitle: "تحديث رقم واتساب",
          whatsappDesc: "قم بتوثيق وتحديث رقم واتساب المرتبط بهذا النشاط.",
          actions: "إجراءات الحساب",
          actionsDesc: "إجراءات حساسة تؤثر على ظهور النشاط أو وجوده في المنصة.",
          suspend: "تعليق الرابط",
          reactivate: "إعادة التفعيل",
          delete: "حذف النشاط",
          confirmDelete: "هل أنت متأكد؟",
          loading: "جارٍ التحميل...",
        },
      }[lang] || {}),
    [lang]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const r = await fetch(`${API_BASE}/api/business/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();

        if (cancelled) return;
        setBusiness(data);
        setForm(data || {});
      } catch (err) {
        console.error("❌ Failed to load business info:", err);
        if (!cancelled) {
          setBusiness(null);
          setForm({});
          alert(t.load_failed || "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!token) {
      setLoading(false);
      setBusiness(null);
      setForm({});
      return;
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, t.load_failed]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateBusiness = async () => {
    try {
      const payload = {
        ...form,
        category:
          typeof form.category === "object" && form.category?.key
            ? [form.category.key]
            : Array.isArray(form.category)
            ? form.category
            : form.category
            ? [form.category]
            : [],
      };

      const res = await fetch(`${API_BASE}/api/business/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");

      const updatedBusiness = data.business || data;
      setBusiness(updatedBusiness);
      setForm(updatedBusiness);
      alert(t.success);
    } catch (err) {
      console.error(err);
      alert(t.update_failed);
    }
  };

  const deleteBusiness = async () => {
    if (!window.confirm(t.confirmDelete)) return;

    try {
      await fetch(`${API_BASE}/api/business/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("pendingBusiness");
      localStorage.removeItem("otpToken");
      window.location.href = "/";
    }
  };

  const toggleStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/business/toggle-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");

      setBusiness((prev) => ({ ...(prev || {}), status: data.status }));
      setForm((prev) => ({ ...(prev || {}), status: data.status }));
      alert(`${t.status}: ${data.status || "updated"}`);
    } catch (err) {
      console.error(err);
    }
  };

  const visibilityText =
    business?.status === "Active"
      ? t.visible_yes
      : business?.status === "Pending"
      ? t.visible_pending
      : t.visible_no;

  const categoryValue = Array.isArray(form.category)
    ? form.category[0] || ""
    : typeof form.category === "object"
    ? form.category.key || ""
    : form.category || "";

  if (loading) {
    return (
      <div style={pageWrap(dir)}>
        <div style={loadingCard}>{t.loading}</div>
      </div>
    );
  }

  return (
    <div style={pageWrap(dir)}>
      {/* Hero */}
      <section style={heroCard}>
        <div style={heroBadge}>{t.details}</div>
        <h1 style={heroTitle}>{t.title}</h1>
        <p style={heroSubtitle}>{t.desc}</p>
      </section>

      {/* Status */}
      <section style={statusCard}>
        <div style={{ fontWeight: 700, color: "#166534" }}>
          {t.statusTitle}: {visibilityText}
        </div>
        {business?.status && (
          <div style={{ fontWeight: 700, color: "#166534" }}>
            {t.status}: {business.status}
          </div>
        )}
      </section>

      {/* Main Grid */}
      <section style={mainGrid}>
        {/* Business Details */}
        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>{t.details}</h3>
            <p style={panelDesc}>{t.detailsDesc}</p>
          </div>

          <div style={formGrid}>
            <div style={fieldBlock}>
              <label style={labelStyle}>{t.name}</label>
              <input
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                placeholder={t.name}
                style={inputStyle(isAr)}
              />
            </div>

            <div style={fieldBlock}>
              <label style={labelStyle}>{t.category}</label>
              <select
                value={categoryValue}
                onChange={(e) => {
                  const selected = metaCategories.find((c) => c.key === e.target.value);
                  if (!selected) return;

                  setForm((prev) => ({
                    ...prev,
                    category: [selected.key],
                  }));
                }}
                style={inputStyle(isAr)}
              >
                <option value="">{isAr ? "اختر الفئة" : "Select category"}</option>
                {metaCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {isAr ? c.ar : c.en}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldBlock}>
              <label style={labelStyle}>{t.media}</label>
              <input
                name="mediaLink"
                value={form.mediaLink || ""}
                onChange={handleChange}
                placeholder="https://instagram.com/..."
                style={inputStyle(isAr)}
              />
            </div>

            <div style={fieldBlock}>
              <label style={labelStyle}>{t.map}</label>
              <input
                name="mapLink"
                value={form.mapLink || ""}
                onChange={handleChange}
                placeholder="https://maps.google.com/..."
                style={inputStyle(isAr)}
              />
              {form.mapLink ? (
                <a
                  href={form.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  style={linkStyle}
                >
                  {t.openLocation}
                </a>
              ) : null}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button onClick={updateBusiness} style={primaryBtn}>
              {t.save}
            </button>
          </div>
        </div>

        {/* WhatsApp Update */}
        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>{t.whatsappTitle}</h3>
            <p style={panelDesc}>{t.whatsappDesc}</p>
          </div>

          <WhatsAppVerify
            lang={lang}
            token={token}
            businessName={business?.name || ""}
            currentWhatsapp={business?.whatsapp || ""}
            onVerified={(result) => {
              setForm((prev) => ({
                ...prev,
                whatsapp: result?.whatsapp || prev.whatsapp,
              }));
            }}
          />
        </div>
      </section>

      {/* Actions */}
      <section style={panelCard}>
        <div style={panelHeader}>
          <h3 style={panelTitle}>{t.actions}</h3>
          <p style={panelDesc}>{t.actionsDesc}</p>
        </div>

        <div style={actionsWrap}>
          <button onClick={toggleStatus} style={warningBtn}>
            {business?.status === "Suspended" ? t.reactivate : t.suspend}
          </button>

          <button onClick={deleteBusiness} style={dangerBtn}>
            {t.delete}
          </button>
        </div>
      </section>
    </div>
  );
}

const pageWrap = (dir) => ({
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "24px",
  direction: dir,
});

const heroCard = {
  background: "linear-gradient(135deg, #16a34a 0%, #34d399 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "28px",
  marginBottom: "18px",
  boxShadow: "0 10px 30px rgba(22, 163, 74, 0.18)",
};

const heroBadge = {
  display: "inline-block",
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.25)",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "14px",
};

const heroTitle = {
  margin: "0 0 8px",
  fontSize: "30px",
  fontWeight: 800,
};

const heroSubtitle = {
  margin: 0,
  maxWidth: "760px",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.95)",
};

const statusCard = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: "16px",
  padding: "16px 20px",
  marginBottom: "18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1.15fr 1fr",
  gap: "18px",
  marginBottom: "18px",
};

const panelCard = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
};

const panelHeader = {
  marginBottom: "16px",
};

const panelTitle = {
  margin: "0 0 6px",
  fontSize: "22px",
  color: "#111827",
};

const panelDesc = {
  margin: 0,
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const fieldBlock = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px",
  color: "#111827",
};

const inputStyle = (isAr) => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  background: "#fff",
  boxSizing: "border-box",
  textAlign: isAr ? "right" : "left",
  fontSize: "15px",
});

const linkStyle = {
  display: "inline-block",
  marginTop: "8px",
  color: "#16a34a",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
};

const actionsWrap = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const primaryBtn = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const warningBtn = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerBtn = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const loadingCard = {
  minHeight: "40vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#374151",
  fontSize: "18px",
  fontWeight: 600,
};
