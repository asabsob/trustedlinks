import React, { useEffect, useMemo, useState } from "react";
import WhatsAppVerify from "../components/WhatsAppVerify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function ManageLinks({ lang = "en" }) {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token") || "";

  // ---------------- Meta Categories ----------------
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
          desc: "Update your profile, category, media link, map location, and WhatsApp contact details.",
          details: "Business Details",
          verified: "Verification Status",
          verified_yes: "✅ Verified on Meta",
          verified_no: "⛔ Hidden until verification",
          verified_pending: "🕓 Pending review",
          map: "Google Maps Location",
          media: "Media / Instagram Link",
          whatsapp: "Update WhatsApp Number",
          actions: "Account Actions",
          suspend: "Suspend Link",
          reactivate: "Reactivate Link",
          delete: "Delete Business",
          update: "Save Changes",
          success: "✅ Updated successfully!",
          update_failed: "❌ Update failed.",
          load_failed: "❌ Failed to load business info.",
        },
        ar: {
          title: "إدارة معلومات نشاطك التجاري",
          desc: "قم بتحديث الفئة، رابط الوسائط، موقع الخريطة، ورقم واتساب.",
          details: "تفاصيل النشاط التجاري",
          verified: "حالة التحقق",
          verified_yes: "✅ تم التحقق من النشاط على Meta",
          verified_no: "⛔ مخفي حتى يتم التحقق",
          verified_pending: "🕓 قيد المراجعة",
          map: "رابط موقع خرائط Google",
          media: "رابط الوسائط أو إنستغرام",
          whatsapp: "تحديث رقم واتساب",
          actions: "إجراءات الحساب",
          suspend: "تعليق الرابط",
          reactivate: "إعادة تفعيل الرابط",
          delete: "حذف النشاط",
          update: "حفظ التغييرات",
          success: "✅ تم التحديث بنجاح!",
          update_failed: "❌ فشل التحديث.",
          load_failed: "❌ فشل تحميل بيانات النشاط.",
        },
      }[lang] || {}),
    [lang]
  );

  // ✅ Load Business Info
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
      const res = await fetch(`${API_BASE}/api/business/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");

      setBusiness(data);
      setForm(data);
      alert(t.success);
    } catch (err) {
      console.error(err);
      alert(t.update_failed);
    }
  };

  const deleteBusiness = async () => {
    if (!window.confirm(isAr ? "هل أنت متأكد؟" : "⚠️ Are you sure?")) return;

    try {
      await fetch(`${API_BASE}/api/business/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      localStorage.removeItem("token");
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
      alert(`Status: ${data.status || "updated"}`);
      setBusiness((prev) => ({ ...(prev || {}), status: data.status }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>{isAr ? "جارٍ التحميل..." : "Loading..."}</p>;

  const verifiedFlag = business?.verified;
  const verificationState = business?.verification || business?.verificationStatus;

  const verificationText =
    verifiedFlag === true
      ? t.verified_yes
      : verificationState === "pending"
      ? t.verified_pending
      : t.verified_no;

  const categoryValue =
    typeof form.category === "object" ? form.category.key : form.category || "";

  return (
    <div style={{ maxWidth: 950, margin: "0 auto", paddingBottom: 50, direction: dir, textAlign: isAr ? "right" : "left" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#22c55e,#34d399)",
          color: "#fff",
          padding: "32px",
          borderRadius: 14,
          marginBottom: 20,
        }}
      >
        <h2>{t.title}</h2>
        <p>{t.desc}</p>
      </div>

      {/* Business Verification Status */}
      <div
        style={{
          background: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 700, color: "#166534" }}>
          {t.verified}: {verificationText}
        </span>

        {business?.status && (
          <span style={{ fontWeight: 600, color: "#166534" }}>
            {isAr ? "الحالة" : "Status"}: {business.status}
          </span>
        )}
      </div>

      {/* Main Card */}
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        }}
      >
        <h3 style={{ marginBottom: 14, color: "#111827" }}>{t.details}</h3>

        <input
          name="name"
          value={form.name || ""}
          onChange={handleChange}
          placeholder={isAr ? "اسم النشاط التجاري" : "Business Name"}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
            textAlign: isAr ? "right" : "left",
          }}
        />

        {/* Category */}
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
          {isAr ? "الفئة" : "Category"}
        </label>

        <select
          value={categoryValue}
          onChange={(e) => {
            const selected = metaCategories.find((c) => c.key === e.target.value);
            if (!selected) return;

            // Keep shape similar to your current storage (object)
            setForm((prev) => ({
              ...prev,
              category: {
                key: selected.key,
                name: isAr ? selected.ar : selected.en,
              },
            }));
          }}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 12,
            textAlign: isAr ? "right" : "left",
          }}
        >
          <option value="">{isAr ? "اختر الفئة" : "Select category"}</option>
          {metaCategories.map((c) => (
            <option key={c.key} value={c.key}>
              {isAr ? c.ar : c.en}
            </option>
          ))}
        </select>

        {/* Media */}
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>{t.media}</label>
        <input
          name="mediaLink"
          value={form.mediaLink || ""}
          onChange={handleChange}
          placeholder="https://instagram.com/..."
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 12,
            textAlign: isAr ? "right" : "left",
          }}
        />

        {/* Map */}
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>{t.map}</label>
        <input
          name="mapLink"
          value={form.mapLink || ""}
          onChange={handleChange}
          placeholder="https://maps.google.com/..."
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 16,
            textAlign: isAr ? "right" : "left",
          }}
        />

        <button
          onClick={updateBusiness}
          style={{
            background: "#22c55e",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {t.update}
        </button>
      </div>

      {/* WhatsApp Update with OTP component */}
      <div style={{ marginTop: 30 }}>
        <h3>{t.whatsapp}</h3>
        <WhatsAppVerify
          lang={lang}
          token={token}
          businessName={business?.name || ""}
          currentWhatsapp={business?.whatsapp || ""}
          onVerified={(updatedBusiness) => {
            setBusiness(updatedBusiness);
            setForm((prev) => ({
              ...prev,
              whatsapp: updatedBusiness.whatsapp,
              verified: updatedBusiness.verified,
            }));
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ marginTop: 30 }}>
        <h3>{t.actions}</h3>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          <button
            onClick={toggleStatus}
            style={{
              background: "#eab308",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {business?.status === "Suspended" ? t.reactivate : t.suspend}
          </button>

          <button
            onClick={deleteBusiness}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
