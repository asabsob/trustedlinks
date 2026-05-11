// ============================================================================
// Trusted Links - Business Dashboard (Production Bilingual)
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getText, getCategoryLabel } from "../i18n";
import geolib from "geolib";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function Dashboard({ lang = "en" }) {
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const tr = (key) => getText(lang, key);

  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaignCode, setCampaignCode] = useState("");
const [claimLoading, setClaimLoading] = useState(false);
const [claimMessage, setClaimMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    let cancelled = false;

    async function loadAll() {
      try {
        setLoading(true);
        setError("");

        const meRes = await fetch(`${API_BASE}/api/me`, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const meData = await meRes.json().catch(() => null);

        if (!meRes.ok) {
          throw new Error(meData?.error || "Auth failed");
        }

        if (cancelled) return;
        setUser(meData);

        const [bizRes, repRes] = await Promise.all([
          fetch(`${API_BASE}/api/business/me`, {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/api/business/reports?t=${Date.now()}`, {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const bizData = await bizRes.json().catch(() => null);
        const repData = await repRes.json().catch(() => null);

        if (cancelled) return;

        setBusiness(bizRes.ok ? bizData : null);

        if (bizRes.ok && bizData?.id) {
          localStorage.setItem("businessId", bizData.id);
        }

        setReports(repRes.ok ? repData : null);
      } catch (e) {
        if (cancelled) return;
        console.error("Dashboard load error:", e);
        setError(tr("dashboardLoadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [lang, navigate]);

  const businessName = useMemo(() => {
    if (!business) return tr("yourBusiness");

    return isAr
      ? business.name_ar || business.name || tr("yourBusiness")
      : business.name || business.name_ar || tr("yourBusiness");
  }, [business, lang]);

  const categoryText = useMemo(() => {
    return getCategoryLabel(business?.category, lang);
  }, [business, lang]);

  const descriptionText = useMemo(() => {
    if (!business) return tr("notAvailable");

 return isAr
  ? business.description_ar || business.description || tr("notAvailable")
  : business.description || business.description_ar || tr("notAvailable");
}, [business, lang]);

const walletText = useMemo(() => {
  if (!business) return `0.00 JOD`;

  const paidBalance = Number(
    business.wallet_balance || 0
  );

  const sponsoredBalance = Number(
    business.sponsored_balance || 0
  );

  const total =
    paidBalance + sponsoredBalance;

  const currency =
    business.wallet_currency || "JOD";

  return isAr
    ? `${currency} ${total.toFixed(2)}`
    : `${total.toFixed(2)} ${currency}`;
}, [business, isAr]);

const sponsoredText = useMemo(() => {
  if (!business) return null;

  const amount = Number(
    business.sponsored_balance || 0
  );

  if (amount <= 0) return null;

  const currency =
    business.wallet_currency || "JOD";

  return isAr
    ? `${currency} ${amount.toFixed(2)}`
    : `${amount.toFixed(2)} ${currency}`;
}, [business, isAr]);

const walletStatus = useMemo(() => {
  if (!business) return "active";
    const balance = Number(business.wallet_balance || 0);

    if (balance <= 0) return "out";
    if (balance < 5) return "low";
    return "active";
  }, [business]);

  const shortMapLink = useMemo(() => {
    if (!business?.mapLink) return null;
    try {
      const url = new URL(business.mapLink);
      return url.hostname.replace("www.", "");
    } catch {
      return business.mapLink;
    }
  }, [business]);

  function isBusinessInsideMallArea() {
  if (!business?.latitude || !business?.longitude) {
    return false;
  }

  const mallLat = Number(
    import.meta.env.VITE_SPONSORED_MALL_LAT
  );

  const mallLng = Number(
    import.meta.env.VITE_SPONSORED_MALL_LNG
  );

  const radius = Number(
    import.meta.env.VITE_SPONSORED_RADIUS_METERS || 300
  );

  if (!mallLat || !mallLng) {
    return false;
  }

  const distance = geolib.getDistance(
    {
      latitude: mallLat,
      longitude: mallLng,
    },
    {
      latitude: Number(business.latitude),
      longitude: Number(business.longitude),
    }
  );

  return distance <= radius;
}

const showSponsorshipCard =
  import.meta.env.VITE_SPONSORED_CAMPAIGN_ENABLED === "true" &&
  business?.sponsored_status !== "active" &&
  isBusinessInsideMallArea();

async function handleClaimSponsorship() {
  try {
    setClaimLoading(true);
    setClaimMessage("");

    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE}/api/campaign/funding-codes/claim`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
     body: JSON.stringify({
  code: String(campaignCode || "").trim().toUpperCase(),
})
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setClaimMessage(
        data.error ||
          (isAr
            ? "تعذر تفعيل الرصيد الترويجي"
            : "Unable to claim sponsorship")
      );
      return;
    }

    setClaimMessage(
      isAr
        ? `تم تفعيل رصيد رعاية المول بنجاح: ${data.amount} ${data.currency}`
        : `Successfully activated mall sponsorship ${data.amount} ${data.currency}`
    );

    window.location.reload();
  } catch (err) {
    setClaimMessage(
      isAr
        ? "حدث خطأ غير متوقع"
        : "Something went wrong"
    );
  } finally {
    setClaimLoading(false);
  }
}
  
  const spendingText = useMemo(() => {
    const amount = Number(reports?.estimated_revenue ?? 0).toFixed(2);
    const currency = reports?.currency || "USD";
    return isAr ? `${currency} ${amount}` : `${amount} ${currency}`;
  }, [reports, isAr]);

  if (loading) {
    return (
      <div style={pageWrap(isAr)}>
        <div style={loadingCard}>
          <div style={spinnerStyle} />
          <p style={{ margin: 0 }}>{tr("loadingDashboard")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageWrap(isAr)}>
        <div style={errorCard}>
          <h3 style={{ marginTop: 0 }}>
            ⚠️ {tr("somethingWrong")}
          </h3>
          <p>{error}</p>
          <button onClick={() => navigate("/login")} style={primaryBtn}>
            {tr("goToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap(isAr)}>
      <section style={heroCard}>
        <div>
          <div style={heroBadge}>{tr("businessDashboard")}</div>

          <h1 style={heroTitle}>
            {isAr
              ? `${tr("welcomeBack")} ${businessName}`
              : `${tr("welcomeBack")} ${businessName}`}
          </h1>

          <p style={heroSubtitle}>{tr("dashboardSubtitle")}</p>
        </div>
      </section>

 <section
  style={{
    background:
      "linear-gradient(135deg, #111827 0%, #16a34a 100%)",
    color: "#fff",
    borderRadius: "20px",
    padding: "22px",
    marginBottom: "22px",
    boxShadow:
      "0 10px 28px rgba(22, 163, 74, 0.18)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          fontSize: 13,
          opacity: 0.8,
          marginBottom: 6,
        }}
      >
        {isAr
          ? "حملة رعاية مفعّلة"
          : "Sponsored Campaign Active"}
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 24,
        }}
      >
        {business?.sponsored_campaign_name ||
          "Campaign Sponsorship"}
      </h3>

      <div
        style={{
          marginTop: 10,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {sponsoredText}
      </div>
    </div>

    <div style={{ fontSize: 44 }}>
      🎁
    </div>
  </div>

  {/* Small claim form */}
  <div
    style={{
      marginTop: "18px",
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    }}
  >
    <input
      value={campaignCode}
      onChange={(e) =>
        setCampaignCode(e.target.value)
      }
      placeholder={
        isAr
          ? "إضافة كود جديد"
          : "Add another sponsorship code"
      }
      style={{
        flex: 1,
        minWidth: "220px",
        padding: "12px 14px",
        borderRadius: "12px",
        border: "none",
        outline: "none",
        fontSize: "15px",
      }}
    />

    <button
      onClick={handleClaimSponsorship}
      disabled={claimLoading}
      style={{
        background: "#fff",
        color: "#16a34a",
        border: "none",
        borderRadius: "12px",
        padding: "12px 18px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {claimLoading
        ? isAr
          ? "جاري التفعيل..."
          : "Applying..."
        : isAr
        ? "تفعيل"
        : "Apply"}
    </button>
  </div>
</section>

      {walletStatus !== "active" && (
        <div
          style={{
            background: walletStatus === "out" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${
              walletStatus === "out" ? "#fecaca" : "#fed7aa"
            }`,
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
            <strong
              style={{
                color: walletStatus === "out" ? "#b91c1c" : "#c2410c",
              }}
            >
              {walletStatus === "out"
                ? tr("noBalanceAvailable")
                : tr("lowBalanceWarning")}
            </strong>

            <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              {walletStatus === "out"
                ? tr("notReceivingLeads")
                : tr("balanceAlmostFinished")}
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
            {tr("rechargeNow")}
          </button>
        </div>
      )}

     {showSponsorshipCard && (
  <section
    style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "18px",
      padding: "22px",
      marginBottom: "20px",
      boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
    }}
  >
    <h3
      style={{
        marginTop: 0,
        marginBottom: 8,
        color: "#111827",
      }}
    >
      {isAr ? "رصيد رعاية المول 🎁" : "Mall Sponsorship Credit 🎁"}
    </h3>

    <p
      style={{
        color: "#6b7280",
        marginBottom: 16,
        lineHeight: 1.7,
      }}
    >
      {isAr
  ? "إذا كان نشاطك داخل العبدلي مول، أدخل رمز الرعاية للحصول على الرصيد الترويجي."
  : "If your business is located inside the Abdali mall, enter your sponsorship code to claim your promotional balance."}
    </p>

    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <input
        value={campaignCode}
        onChange={(e) => setCampaignCode(e.target.value)}
        placeholder={isAr ? "أدخل رمز الرعاية" : "Enter sponsorship code"}
        style={{
          flex: 1,
          minWidth: 220,
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #d1d5db",
          outline: "none",
        }}
      />

      <button
        onClick={handleClaimSponsorship}
        disabled={!campaignCode || claimLoading}
        style={{
          background: "#16a34a",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "12px 18px",
          fontWeight: 700,
          cursor: "pointer",
          opacity: claimLoading ? 0.7 : 1,
        }}
      >
       {claimLoading
  ? isAr
    ? "جاري التفعيل..."
    : "Claiming..."
  : isAr
  ? "تفعيل الرصيد"
  : "Claim Credit"}
      </button>
    </div>

    {claimMessage && (
      <div
        style={{
          marginTop: 14,
          color: "#374151",
          fontSize: 14,
        }}
      >
        {claimMessage}
      </div>
    )}
  </section>
)}

      <section style={statsGrid}>
      <StatCard
  title={
    isAr
      ? "إجمالي الرصيد"
      : "Total Balance"
  }
  value={walletText}
  subtitle={
    sponsoredText
      ? isAr
        ? `الرصيد المقدم من المول: ${sponsoredText}`
        : `Mall Sponsored Credit: ${sponsoredText}`
      : walletStatus === "out"
      ? tr("outOfBalance")
      : walletStatus === "low"
      ? tr("lowBalance")
      : tr("active")
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
          title={tr("directLeads")}
          value={reports?.direct_starts ?? 0}
        />

        <StatCard
          title={tr("categoryLeads")}
          value={reports?.category_starts ?? 0}
        />

        <StatCard
          title={tr("nearbyLeads")}
          value={reports?.nearby_starts ?? 0}
        />

        <StatCard
  title={
    isAr
      ? "سعر المحادثة المباشرة"
      : "Direct Conversation Price"
  }
  value={
    business?.pricing?.direct
      ? `${business.pricing.direct} ${business.pricing.currency || business.wallet_currency || "JOD"}`
      : "-"
  }
/>
        <StatCard
          title={tr("spending")}
          value={spendingText}
        />
      </section>

      <section style={mainGrid}>
        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>{tr("businessDetails")}</h3>
            <p style={panelDesc}>{tr("businessDetailsDesc")}</p>
          </div>

          {business ? (
            <div style={detailsGrid}>
              <InfoItem
                label={tr("businessName")}
                value={businessName}
                isAr={isAr}
              />

              <InfoItem
                label={tr("category")}
                value={categoryText}
                isAr={isAr}
              />

              <InfoItem
                label={tr("whatsapp")}
                value={business.whatsapp || tr("notAvailable")}
                isAr={isAr}
              />

              <InfoItem
                label={tr("description")}
                value={descriptionText}
                fullWidth
                isAr={isAr}
              />

              <InfoItem
                label={tr("map")}
                value={
                  business.mapLink ? (
                    <a
                      href={business.mapLink}
                      target="_blank"
                      rel="noreferrer"
                      style={linkStyle}
                    >
                      {tr("openLocation")} · {shortMapLink}
                    </a>
                  ) : (
                    tr("notAvailable")
                  )
                }
                isAr={isAr}
              />

              <InfoItem
                label={tr("coordinates")}
                value={
                  business.latitude != null && business.longitude != null
                    ? `${business.latitude}, ${business.longitude}`
                    : tr("notAvailable")
                }
                isAr={isAr}
              />
            </div>
          ) : (
            <EmptyState
              title={tr("noBusinessFound")}
              text={tr("noBusinessText")}
            />
          )}
        </div>

        <div style={panelCard}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>{tr("performanceSummary")}</h3>
            <p style={panelDesc}>{tr("performanceSummaryDesc")}</p>
          </div>

          {reports ? (
            <div style={miniStatsGrid}>
              <MiniStat
                title={tr("totalLeads")}
                value={reports.total_billed_conversations ?? 0}
              />
              <MiniStat
                title={tr("directLeads")}
                value={reports.direct_starts ?? 0}
              />
              <MiniStat
                title={tr("categoryLeads")}
                value={reports.category_starts ?? 0}
              />
              <MiniStat
                title={tr("nearbyLeads")}
                value={reports.nearby_starts ?? 0}
              />
            </div>
          ) : (
            <EmptyState
              title={tr("noReportData")}
              text={tr("noReportText")}
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
    wordBreak: "break-word",
  };

  return (
    <div style={statCard}>
      <div style={statTitle}>{title}</div>
      <div style={statValueDynamic}>{value}</div>
      {subtitle ? <div style={statSubtitle}>{subtitle}</div> : null}
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

function InfoItem({ label, value, fullWidth = false, isAr = false }) {
  return (
    <div
      style={{
        ...infoItemCard,
        gridColumn: fullWidth ? "1 / -1" : "auto",
        textAlign: isAr ? "right" : "left",
      }}
    >
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
  textAlign: isAr ? "right" : "left",
  fontFamily: "Tajawal, Inter, system-ui, sans-serif",
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
  fontWeight: 700,
  marginBottom: "14px",
};

const heroTitle = {
  margin: "0 0 8px",
  fontSize: "clamp(26px, 4vw, 34px)",
  fontWeight: 800,
  lineHeight: 1.35,
};

const heroSubtitle = {
  margin: 0,
  maxWidth: "720px",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.95)",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
  fontWeight: 600,
};

const statSubtitle = {
  color: "#9ca3af",
  fontSize: "13px",
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
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
  lineHeight: 1.7,
};

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
  fontWeight: 700,
};

const infoValue = {
  fontSize: "15px",
  color: "#111827",
  lineHeight: 1.8,
  wordBreak: "break-word",
};

const miniStatsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
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
  fontWeight: 600,
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
  fontWeight: 700,
  textDecoration: "none",
};
