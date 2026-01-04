// ============================================================================
// Trusted Links - Business Dashboard (Bilingual: EN + AR)
// ============================================================================

import React, { useEffect, useState } from "react";

export default function Dashboard() {
  // -------------------------------------------------------------------------
  // Language detection
  // -------------------------------------------------------------------------
  const lang = localStorage.getItem("lang") || "en";
  const isAr = lang === "ar";

  const t = (en, ar) => (isAr ? ar : en);

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------------------------------------------------------------------------
  // Initial Data Load
  // -------------------------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError(t("You are not logged in.", "أنت غير مسجل دخول."));
      setLoading(false);
      return;
    }

    // 1️⃣ Get user
    fetch("http://localhost:5175/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Auth failed");
        return res.json();
      })
      .then((data) => {
        setUser(data);

        if (!data.subscriptionPlan) {
          window.location.href = "/subscribe";
        }
      })
      .catch(() => {
        setError(
          t(
            "Authentication failed. Please log in again.",
            "فشل التحقق من الهوية. يرجى تسجيل الدخول مرة أخرى."
          )
        );
      });

    // 2️⃣ Get business
    fetch("http://localhost:5175/api/business/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setBusiness(data))
      .catch(() =>
        setError(t("Failed to load business info.", "فشل تحميل بيانات النشاط."))
      );

    // 3️⃣ Get performance reports
    fetch("http://localhost:5175/api/business/reports", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setReports(data))
      .catch(() =>
        setError(t("Failed to load reports.", "فشل تحميل التقارير."))
      )
      .finally(() => setLoading(false));
  }, []);

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // -------------------------------------------------------------------------
  // Loading & Error UI
  // -------------------------------------------------------------------------
  if (loading)
    return <p style={{ textAlign: "center" }}>{t("Loading...", "جارٍ التحميل...")}</p>;

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3>⚠️ {error}</h3>
        <p>{t("Please try again later.", "يرجى المحاولة لاحقاً.")}</p>
      </div>
    );

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------
  return (
    <div
      className="section container"
      style={{ padding: "20px", direction: isAr ? "rtl" : "ltr" }}
    >
      {/* ---------------------------------------------------------------------
         Header bar
      --------------------------------------------------------------------- */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "16px 24px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#166534" }}>
            {t("👋 Welcome,", "👋 أهلاً،")} {user?.email}
          </h3>
          <p style={{ marginTop: 4, color: "#555" }}>
            {t("Plan:", "الخطة:")}{" "}
            <strong style={{ color: "#22c55e" }}>
              {user?.subscriptionPlan}
            </strong>
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          {t("Logout", "تسجيل خروج")}
        </button>
      </div>

      {/* ---------------------------------------------------------------------
         Top banner
      --------------------------------------------------------------------- */}
      <div
        style={{
          background: "linear-gradient(135deg,#22c55e,#34d399)",
          color: "#fff",
          padding: "32px",
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <h2>{t("Business Dashboard", "لوحة تحكم النشاط")}</h2>
        <p>{t("Monitor your activity and insights", "تابع نشاطك وإحصاءاتك")}</p>
      </div>

      {/* ---------------------------------------------------------------------
         Business Info
      --------------------------------------------------------------------- */}
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          marginBottom: "16px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <h3 style={{ color: "#166534" }}>
          {t("Business Details", "بيانات النشاط التجاري")}
        </h3>

        {business ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "14px",
            }}
          >
            <div>
              <div style={{ fontWeight: "600" }}>{t("Name", "الاسم")}</div>
              <div>{business.nameAr || business.nameEn || business.name}</div>
            </div>
<div>
  <div style={{ fontWeight: "600" }}>{t("Category", "الفئة")}</div>
  <div>
    {typeof business.category === "object"
      ? (isAr ? business.category.nameAr : business.category.nameEn)
      : business.category || "N/A"}
  </div>
</div>

            <div>
              <div style={{ fontWeight: "600" }}>
                {t("Description", "الوصف")}
              </div>
              <div>{business.description || t("N/A", "لا يوجد")}</div>
            </div>

            <div>
              <div style={{ fontWeight: "600" }}>{t("WhatsApp", "واتساب")}</div>
              <div>{business.whatsapp || "N/A"}</div>
            </div>

            <div>
              <div style={{ fontWeight: "600" }}>{t("Address", "العنوان")}</div>
              <div>{business.addressAr || business.addressEn || "N/A"}</div>
            </div>
          </div>
        ) : (
          <p>{t("No business linked yet.", "لا يوجد نشاط مسجل بعد.")}</p>
        )}
      </div>

      {/* ---------------------------------------------------------------------
         Reports
      --------------------------------------------------------------------- */}
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <h3 style={{ marginBottom: 12, color: "#166534" }}>
          {t("Performance Summary", "ملخص الأداء")}
        </h3>

        {reports ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "16px",
              textAlign: "center",
            }}
          >
            {/* TOTAL CLICKS */}
            <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 10 }}>
              <h4>{t("Total Clicks", "إجمالي النقرات")}</h4>
              <p style={{ fontSize: 20, fontWeight: 600 }}>
                {reports.totalClicks}
              </p>
            </div>

            {/* TOTAL MESSAGES */}
            <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 10 }}>
              <h4>{t("Total Messages", "إجمالي الرسائل")}</h4>
              <p style={{ fontSize: 20, fontWeight: 600 }}>
                {reports.totalMessages}
              </p>
            </div>

            {/* WEEKLY GROWTH */}
            <div style={{ background: "#f0fdf4", padding: 16, borderRadius: 10 }}>
              <h4>{t("Weekly Growth", "نمو أسبوعي")}</h4>
              <p style={{ fontSize: 20, fontWeight: 600 }}>
                {reports.weeklyGrowth}%
              </p>
            </div>
          </div>
        ) : (
          <p>{t("No report data available.", "لا توجد بيانات تقارير متاحة.")}</p>
        )}
      </div>
    </div>
  );
}