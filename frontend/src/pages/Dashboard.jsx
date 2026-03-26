// ============================================================================
// Trusted Links - Business Dashboard (Clean + Bilingual)
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function Dashboard({ lang = "en" }) {
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError(t("You are not logged in.", "أنت غير مسجل دخول."));
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);
        setError("");

        const meRes = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json().catch(() => null);

        if (!meRes.ok) {
          throw new Error(meData?.error || "Auth failed");
        }

        if (cancelled) return;
        setUser(meData);

        const [bizRes, repRes] = await Promise.all([
          fetch(`${API_BASE}/api/business/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/business/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const bizData = await bizRes.json().catch(() => null);
        const repData = await repRes.json().catch(() => null);

        if (cancelled) return;

        setBusiness(bizRes.ok ? bizData : null);
        if (bizRes.ok && bizData?._id) {
  localStorage.setItem("businessId", bizData._id);
}
        setReports(repRes.ok ? repData : null);
      } catch (e) {
        if (cancelled) return;
        setError(
          t(
            "Unable to load dashboard data. Please log in again.",
            "تعذر تحميل بيانات لوحة التحكم. يرجى تسجيل الدخول مرة أخرى."
          )
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const businessName = useMemo(() => {
    if (!business) return t("Your Business", "نشاطك التجاري");
    return business.name_ar || business.name || t("Your Business", "نشاطك التجاري");
  }, [business, lang]);

  const categoryText = useMemo(() => {
    if (!business?.category) return t("N/A", "غير متوفر");
    if (Array.isArray(business.category)) return business.category.join(", ");
    return business.category;
  }, [business, lang]);

  const walletText = useMemo(() => {
    if (!user) return "0 USD";
    const balance = typeof user.walletBalance === "number" ? user.walletBalance : 0;
    const currency = user.currency || "USD";
    return `${balance} ${currency}`;
  }, [user]);

  const walletStatus = useMemo(() => {
    if (!user) return "active";

    const balance = Number(user.walletBalance || 0);

    if (balance <= 0) return "out";
    if (balance < 5) return "low";
    return "active";
  }, [user]);

  const shortMapLink = useMemo(() => {
    if (!business?.mapLink) return null;
    try {
      const url = new URL(business.mapLink);
      return url.hostname.replace("www.", "");
    } catch {
      return business.mapLink;
    }
  }, [business]);

  if (loading) {
    return (
      <div style={pageWrap(isAr)}>
        <div style={loadingCard}>
          <div style={spinnerStyle} />
          <p style={{ margin: 0 }}>{t("Loading dashboard...", "جارٍ تحميل لوحة التحكم...")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageWrap(isAr)}>
        <div style={errorCard}>
          <h3 style={{ marginTop: 0 }}>⚠️ {t("Something went wrong", "حدث خطأ")}</h3>
          <p>{error}</p>
          <button onClick={() => navigate("/login")} style={primaryBtn}>
            {t("Go to Login", "الذهاب إلى تسجيل الدخول")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap(isAr)}>
      {/* Hero */}
      <section style={heroCard}>
        <div>
          <div style={heroBadge}>{t("Business Dashboard", "لوحة تحكم النشاط")}</div>
          <h1 style={heroTitle}>
            {t("Welcome back", "مرحبًا بعودتك")} {businessName}
          </h1>
          <p style={heroSubtitle}>
            {t(
              "Manage your business profile, wallet, and performance from one place.",
              "تابع ملف نشاطك، رصيدك، وأداءك من مكان واحد."
            )}
          </p>
        </div>
      </section>

      {walletStatus !== "active" && (
        <div
          style={{
            background: walletStatus === "out" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${walletStatus === "out" ? "#fecaca" : "#fed7aa"}`,
            borderRadius: 16,
            padding: "16px",
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            <strong style={{ color: walletStatus === "out" ? "#b91c1c" : "#c2410c" }}>
              {walletStatus === "out"
                ? t("No balance available", "لا يوجد رصيد")
                : t("Low balance warning", "تحذير: الرصيد منخفض")}
            </strong>

            <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              {walletStatus === "out"
                ? t(
                    "Your business is not receiving leads. Please recharge.",
                    "لن تستقبل طلبات جديدة. يرجى شحن الرصيد."
                  )
                : t(
                    "Your balance is almost finished. Recharge to continue.",
                    "رصيدك أوشك على الانتهاء. يرجى الشحن."
                  )}
            </div>
          </div>

          <button
            onClick={() => navigate("/wallet")}
            style={{
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("Recharge Now", "اشحن الآن")}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section style={statsGrid}>
        <StatCard
          title={t("Wallet Balance", "الرصيد الحالي")}
          value={walletText}
          subtitle={
            walletStatus === "out"
              ? t("Out of balance", "لا يوجد رصيد")
              : walletStatus === "low"
              ? t("Low balance", "رصيد منخفض")
              : t("Active", "نشط")
          }
          highlight={
            walletStatus === "out"
              ? "#ef4444"
              : walletStatus === "low"
              ? "#f59e0b"
              : "#16a34a"
          }
        />
        <StatCard
          title={t("Total Clicks", "إجمالي النقرات")}
          value={reports?.totalClicks ?? 0}
          subtitle={t("Business interactions", "تفاعلات النشاط")}
        />
        <StatCard
          title={t("Total Messages", "إجمالي الرسائل")}
          value={reports?.totalMessages ?? 0}
          subtitle={t("WhatsApp conversations", "محادثات واتساب")}
        />
        <StatCard
          title={t("Weekly Growth", "النمو الأسبوعي")}
          value={`${reports?.weeklyGrowth ?? 0}%`}
          subtitle={t("Performance trend", "اتجاه الأداء")}
        />
      </section>

      {/* Main Content */}
      <section style={mainGrid}>
        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>{t("Business Details", "بيانات النشاط")}</h3>
            <p style={panelDesc}>
              {t(
                "Basic information for your registered business.",
                "المعلومات الأساسية لنشاطك المسجل."
              )}
            </p>
          </div>

          {business ? (
            <div style={detailsGrid}>
              <InfoItem
                label={t("Business Name", "اسم النشاط")}
                value={business.name_ar || business.name || t("N/A", "غير متوفر")}
              />
              <InfoItem label={t("Category", "الفئة")} value={categoryText} />
              <InfoItem
                label={t("WhatsApp", "واتساب")}
                value={business.whatsapp || t("N/A", "غير متوفر")}
              />
              <InfoItem
                label={t("Description", "الوصف")}
                value={business.description || t("N/A", "غير متوفر")}
                fullWidth
              />
              <InfoItem
                label={t("Map", "الخريطة")}
                value={
                  business.mapLink ? (
                    <a
                      href={business.mapLink}
                      target="_blank"
                      rel="noreferrer"
                      style={linkStyle}
                    >
                      {t("Open location", "فتح الموقع")} · {shortMapLink}
                    </a>
                  ) : (
                    t("N/A", "غير متوفر")
                  )
                }
              />
              <InfoItem
                label={t("Coordinates", "الإحداثيات")}
                value={
                  business.latitude != null && business.longitude != null
                    ? `${business.latitude}, ${business.longitude}`
                    : t("N/A", "غير متوفر")
                }
              />
            </div>
          ) : (
            <EmptyState
              title={t("No business found", "لا يوجد نشاط مسجل")}
              text={t(
                "Your account is active, but no business profile is linked yet.",
                "حسابك نشط، لكن لا يوجد ملف نشاط مرتبط به حتى الآن."
              )}
            />
          )}
        </div>

        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>{t("Performance Summary", "ملخص الأداء")}</h3>
            <p style={panelDesc}>
              {t(
                "Quick overview of engagement on your business profile.",
                "نظرة سريعة على التفاعل مع ملف نشاطك."
              )}
            </p>
          </div>

          {reports ? (
            <div style={miniStatsGrid}>
              <MiniStat title={t("Views", "المشاهدات")} value={reports.views ?? 0} />
              <MiniStat title={t("Clicks", "النقرات")} value={reports.totalClicks ?? 0} />
              <MiniStat
                title={t("Messages", "الرسائل")}
                value={reports.totalMessages ?? 0}
              />
              <MiniStat
                title={t("Media Views", "مشاهدات الوسائط")}
                value={reports.mediaViews ?? 0}
              />
            </div>
          ) : (
            <EmptyState
              title={t("No report data yet", "لا توجد بيانات أداء بعد")}
              text={t(
                "Your analytics will appear here once users start interacting with your business.",
                "ستظهر إحصاءاتك هنا بمجرد بدء تفاعل المستخدمين مع نشاطك."
              )}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, subtitle, highlight = "#111827" }) {
  const statValueDynamic = {
    fontSize: "28px",
    fontWeight: 800,
    color: highlight,
    marginBottom: "6px",
  };

  return (
    <div style={statCard}>
      <div style={statTitle}>{title}</div>
      <div style={statValueDynamic}>{value}</div>
      <div style={statSubtitle}>{subtitle}</div>
    </div>
  );
}

function MiniStat({ title, value }) {
  return (
    <div style={miniStatCard}>
      <div style={miniStatTitle}>{title}</div>
      <div style={miniStatValue}>{value}</div>
    </div>
  );
}

function InfoItem({ label, value, fullWidth = false }) {
  return (
    <div style={{ ...infoItemCard, gridColumn: fullWidth ? "1 / -1" : "auto" }}>
      <div style={infoLabel}>{label}</div>
      <div style={infoValue}>{value}</div>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div style={emptyStateCard}>
      <h4 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h4>
      <p style={{ margin: 0, color: "#6b7280" }}>{text}</p>
    </div>
  );
}

const pageWrap = (isAr) => ({
  padding: "24px",
  maxWidth: "1280px",
  margin: "0 auto",
  direction: isAr ? "rtl" : "ltr",
});

const heroCard = {
  background: "linear-gradient(135deg, #16a34a 0%, #34d399 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "28px",
  marginBottom: "22px",
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
  maxWidth: "720px",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.95)",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "22px",
};

const statCard = {
  background: "#fff",
  borderRadius: "18px",
  padding: "20px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
};

const statTitle = {
  color: "#6b7280",
  fontSize: "14px",
  marginBottom: "10px",
};

const statSubtitle = {
  color: "#9ca3af",
  fontSize: "13px",
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: "18px",
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
  fontSize: "20px",
  color: "#111827",
};

const panelDesc = {
  margin: 0,
  color: "#6b7280",
  fontSize: "14px",
};

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const infoItemCard = {
  background: "#f9fafb",
  border: "1px solid #eef2f7",
  borderRadius: "14px",
  padding: "14px 16px",
};

const infoLabel = {
  fontSize: "13px",
  color: "#6b7280",
  marginBottom: "8px",
  fontWeight: 600,
};

const infoValue = {
  fontSize: "15px",
  color: "#111827",
  lineHeight: 1.7,
  wordBreak: "break-word",
};

const miniStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const miniStatCard = {
  background: "#f0fdf4",
  border: "1px solid #dcfce7",
  borderRadius: "14px",
  padding: "18px",
  textAlign: "center",
};

const miniStatTitle = {
  color: "#166534",
  fontSize: "14px",
  marginBottom: "8px",
};

const miniStatValue = {
  color: "#111827",
  fontSize: "26px",
  fontWeight: 800,
};

const emptyStateCard = {
  background: "#f9fafb",
  border: "1px dashed #d1d5db",
  borderRadius: "16px",
  padding: "24px",
};

const loadingCard = {
  minHeight: "50vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "14px",
  color: "#374151",
};

const errorCard = {
  maxWidth: "720px",
  margin: "60px auto",
  background: "#fff",
  border: "1px solid #fee2e2",
  borderRadius: "18px",
  padding: "24px",
  boxShadow: "0 8px 24px rgba(239, 68, 68, 0.08)",
};

const spinnerStyle = {
  width: "34px",
  height: "34px",
  border: "4px solid #dcfce7",
  borderTop: "4px solid #16a34a",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const primaryBtn = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const linkStyle = {
  color: "#16a34a",
  fontWeight: 600,
  textDecoration: "none",
};
