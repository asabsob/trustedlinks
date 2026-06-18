import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getText, getCategoryLabel } from "../i18n";
import AIAssistantBox from "../components/ai/AIAssistantBox";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function Dashboard({ lang = "en" }) {
  const navigate = useNavigate();
  const isAr = lang === "ar";
  const isMobile = window.innerWidth < 768;
  const tr = (key) => getText(lang, key);

  const [business, setBusiness] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [campaignCode, setCampaignCode] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  const [pendingFunding, setPendingFunding] = useState(null);
  
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

        const [meRes, bizRes, repRes] = await Promise.all([
          fetch(`${API_BASE}/api/me`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/business/me`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/business/reports?t=${Date.now()}`, {
            cache: "no-store",
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const meData = await meRes.json().catch(() => null);
        const bizData = await bizRes.json().catch(() => null);
        const repData = await repRes.json().catch(() => null);

        if (!meRes.ok) throw new Error(meData?.error || "Auth failed");
        if (cancelled) return;

        setBusiness(bizRes.ok ? bizData : null);
        setReports(repRes.ok ? repData : null);

        if (bizRes.ok && bizData?.id) {
          localStorage.setItem("businessId", bizData.id);
        }

        try {
  const pendingRes = await fetch(
    `${API_BASE}/api/campaign/funding-codes/my-pending`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (pendingRes.ok) {
    const pendingData = await pendingRes.json();
    setPendingFunding(pendingData.claim || null);
  }
} catch (err) {
  console.error("Failed loading pending funding", err);
}
      } catch (e) {
        if (cancelled) return;
        console.error("Dashboard load error:", e);
        setError(tr("dashboardLoadError") || "Failed to load dashboard");
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
    if (!business) return tr("yourBusiness") || "Your Business";
    return isAr
      ? business.name_ar || business.name || tr("yourBusiness")
      : business.name || business.name_ar || tr("yourBusiness");
  }, [business, isAr, tr]);

  const categoryText = useMemo(() => {
    return getCategoryLabel(business?.category, lang);
  }, [business, lang]);

  const descriptionText = useMemo(() => {
    if (!business) return tr("notAvailable") || "-";
    return isAr
      ? business.description_ar || business.description || tr("notAvailable")
      : business.description || business.description_ar || tr("notAvailable");
  }, [business, isAr, tr]);

  const paidBalance = Number(business?.wallet_balance || 0);
  const sponsoredBalance = Number(business?.sponsored_balance || 0);
  const currency = business?.wallet_currency || business?.pricing?.currency || "JOD";
  const totalBalance = paidBalance + sponsoredBalance;

  const walletStatus = useMemo(() => {
    if (totalBalance <= 0) return "out";
    if (totalBalance < 5) return "low";
    return "active";
  }, [totalBalance]);

  const walletText = isAr
    ? `${currency} ${totalBalance.toFixed(2)}`
    : `${totalBalance.toFixed(2)} ${currency}`;

  const spendingText = useMemo(() => {
    const amount = Number(reports?.estimated_revenue ?? 0).toFixed(2);
    const reportCurrency = reports?.currency || currency || "JOD";
    return isAr ? `${reportCurrency} ${amount}` : `${amount} ${reportCurrency}`;
  }, [reports, isAr, currency]);

  const shortMapLink = useMemo(() => {
    if (!business?.mapLink) return null;
    try {
      const url = new URL(business.mapLink);
      return url.hostname.replace("www.", "");
    } catch {
      return business.mapLink;
    }
  }, [business]);

  const showSponsorshipCard =
    import.meta.env.VITE_SPONSORED_CAMPAIGN_ENABLED === "true";

  async function handleClaimSponsorship() {
    if (!campaignCode) return;

    try {
      setClaimLoading(true);
      setClaimMessage("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/campaign/funding-codes/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: String(campaignCode || "").trim().toUpperCase(),
        }),
      });

      const data = await res.json();

     if (!res.ok) {
  setClaimMessage(
    data.error ||
      (isAr
        ? "تعذر إرسال طلب التمويل"
        : "Unable to submit funding request")
  );
  return;
}

if (data.status === "pending_approval") {
  setClaimMessage(
    isAr
      ? "⏳ تم إرسال طلب التمويل وهو بانتظار موافقة الممول"
      : "⏳ Funding request submitted and awaiting sponsor approval"
  );

  setCampaignCode("");
  return;
}

setClaimMessage(
  isAr
    ? `تم تفعيل الرصيد بنجاح: ${data.amount || ""} ${currency}`
    : `Sponsorship credit activated: ${data.amount || ""} ${currency}`
);

setCampaignCode("");
window.location.reload();
} catch {
  setClaimMessage(isAr ? "حدث خطأ غير متوقع" : "Something went wrong");
} finally {
  setClaimLoading(false);
}
}

  if (loading) {
    return (
      <div style={pageWrap(isAr)}>
        <div style={loadingCard}>
          <div style={spinnerStyle} />
          <p style={{ margin: 0 }}>{tr("loadingDashboard") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageWrap(isAr)}>
        <div style={errorCard}>
          <h3 style={{ marginTop: 0 }}>⚠️ {tr("somethingWrong") || "Something went wrong"}</h3>
          <p>{error}</p>
          <button onClick={() => navigate("/login")} style={primaryBtn}>
            {tr("goToLogin") || "Go to login"}
          </button>
        </div>
      </div>
    );
  }

return (
  <div style={pageWrap(isAr)}>
    {/* 1. Welcome + Wallet */}
  <section style={topLayout(isMobile)}>
      <div style={welcomeCard}>
        <div style={heroBadge}>
          {tr("businessDashboard") || "Business Dashboard"}
        </div>

        <h1 style={heroTitle}>
          {tr("welcomeBack") || "Welcome back"} {businessName}
        </h1>

        <p style={heroSubtitle}>
          {isAr
            ? "تابع الرصيد، العملاء المحتملين، التسعير، وأداء نشاطك من مكان واحد."
            : "Track wallet, leads, pricing, and business performance from one place."}
        </p>
      </div>

      <WalletCard
        isAr={isAr}
        walletText={walletText}
        walletStatus={walletStatus}
        onRecharge={() => navigate("/wallet")}
      />
    </section>

    <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 16,
  }}
>
  <div style={statCard}>
    <div style={{ fontSize: 12, opacity: 0.7 }}>
      {isAr ? "الرصيد الممول" : "Sponsored Balance"}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700 }}>
      {sponsoredBalance} {currency}
    </div>
  </div>

  <div style={statCard}>
    <div style={{ fontSize: 12, opacity: 0.7 }}>
      {isAr ? "الرصيد المدفوع" : "Paid Balance"}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700 }}>
      {paidBalance} {currency}
    </div>
  </div>

  <div style={statCard}>
    <div style={{ fontSize: 12, opacity: 0.7 }}>
      {isAr ? "إجمالي الرصيد" : "Total Balance"}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700 }}>
      {totalBalance} {currency}
    </div>
  </div>
</div>

    {/* 2. Sponsorship */}
    {showSponsorshipCard && (
      <section style={{ marginBottom: 18 }}>
        <CampaignCard
          isAr={isAr}
          campaignCode={campaignCode}
          setCampaignCode={setCampaignCode}
          claimLoading={claimLoading}
          claimMessage={claimMessage}
          onClaim={handleClaimSponsorship}
        />
      </section>
    )}

    {pendingFunding && (
  <div style={pendingFundingCard}>
    <div style={{ fontWeight: 900 }}>
      ⏳ {isAr ? "بانتظار الموافقة" : "Pending Approval"}
    </div>

    <div style={{ marginTop: 8 }}>
      {isAr
        ? "تم إرسال طلب التمويل وهو بانتظار موافقة الممول."
        : "Your funding request is waiting for sponsor approval."}
    </div>

    <div style={{ marginTop: 8, fontWeight: 800 }}>
      {pendingFunding.claimed_amount} {currency}
    </div>
  </div>
)}

    {/* 3. AI Assistant */}
    <section style={aiSection}>
      <AIAssistantBox lang={lang} pageContext="business_dashboard" />
    </section>

    {/* 4. KPIs */}
    <section style={kpiGrid}>
      <StatCard
        title={isAr ? "إجمالي العملاء" : "Total Leads"}
        value={reports?.total_billed_conversations ?? 0}
      />
      <StatCard
        title={tr("directLeads") || "Direct Leads"}
        value={reports?.direct_starts ?? 0}
      />
      <StatCard
        title={tr("categoryLeads") || "Category Leads"}
        value={reports?.category_starts ?? 0}
      />
      <StatCard
        title={tr("nearbyLeads") || "Nearby Leads"}
        value={reports?.nearby_starts ?? 0}
      />
      <StatCard
        title={tr("spending") || "Spending"}
        value={spendingText}
        highlight="#0f766e"
      />
    </section>

    {/* 5. Pricing */}
    <section style={{ marginBottom: 18 }}>
      <PricingPlanCard
        business={business}
        currency={currency}
        categoryText={categoryText}
        isAr={isAr}
      />
    </section>

      {/* 6. Business Details */}
    <section style={{ marginBottom: 18 }}>
      <BusinessDetails
        isAr={isAr}
        tr={tr}
        business={business}
        businessName={businessName}
        categoryText={categoryText}
        descriptionText={descriptionText}
        shortMapLink={shortMapLink}
      />
    </section>
  </div>
);
}

function WalletCard({ isAr, walletText, walletStatus, onRecharge }) {
  const isLow = walletStatus !== "active";

  return (
    <div style={walletCard}>
      <div>
        <div style={walletLabel}>
          {isAr ? "رصيد المحفظة" : "Wallet Balance"}
        </div>

        <div
          style={{
            ...walletValue,
            color: isLow ? "#f59e0b" : "#16a34a",
          }}
        >
          {walletText}
        </div>

        <div style={walletHint}>
          {walletStatus === "out"
            ? isAr
              ? "الرصيد منتهي"
              : "Out of balance"
            : walletStatus === "low"
            ? isAr
              ? "الرصيد منخفض"
              : "Low balance"
            : isAr
            ? "نشط"
            : "Active"}
        </div>
      </div>

      <button onClick={onRecharge} style={walletButton}>
        {isAr ? "إعادة الشحن" : "Recharge"}
      </button>
    </div>
  );
}


function StatCard({ title, value, subtitle, highlight = "#111827" }) {
  return (
    <div style={statCard}>
      <div style={statTitle}>{title}</div>
      <div style={{ ...statValue, color: highlight }}>{value}</div>
      {subtitle ? <div style={statSubtitle}>{subtitle}</div> : null}
    </div>
  );
}

function PricingPlanCard({ business, currency, categoryText, isAr }) {
  const pricing = business?.pricing || {};
  const finalCurrency = pricing.currency || currency || "JOD";

  const rows = [
    { label: isAr ? "تواصل مباشر" : "Direct Lead", value: pricing.direct },
    { label: isAr ? "بحث بالفئة" : "Category Lead", value: pricing.category },
    { label: isAr ? "قريب مني" : "Nearby Lead", value: pricing.nearby },
  ];

  return (
    <div style={pricingPlanCard}>
      <div style={cardTop}>
        <div>
          <div style={sectionEyebrow}>{isAr ? "خطة التسعير" : "Pricing Plan"}</div>
          <h3 style={sectionTitle}>{isAr ? "أسعار العملاء المحتملين" : "Lead Prices"}</h3>
        </div>

        <div style={pricingTierBadge}>
          {isAr ? "الفئة" : "Tier"} {pricing.tier || "-"}
        </div>
      </div>

      <div style={pricingMetaRow}>
        <span>{isAr ? "القطاع:" : "Sector:"} {categoryText || "-"}</span>
        <span>{isAr ? "العملة:" : "Currency:"} {finalCurrency}</span>
      </div>

      <div style={pricingRows}>
        {rows.map((row) => (
          <div key={row.label} style={pricingRow}>
            <span>{row.label}</span>
            <strong>{row.value != null ? `${row.value} ${finalCurrency}` : "-"}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignCard({
  isAr,
  campaignCode,
  setCampaignCode,
  claimLoading,
  claimMessage,
  onClaim,
}) {
  return (
    <div style={campaignCard}>
      <div style={cardTop}>
        <div>
          <div style={sectionEyebrow}>
            {isAr ? "رصيد الرعاية" : "Sponsored Credit"}
          </div>
          <h3 style={sectionTitle}>
            {isAr ? "تفعيل حملة رعاية" : "Claim Sponsorship"}
          </h3>
        </div>
        <div style={{ fontSize: 32 }}>🎁</div>
      </div>

      <div style={claimRow}>
        <input
          value={campaignCode}
          onChange={(e) => setCampaignCode(e.target.value)}
          placeholder={isAr ? "أدخل كود الرعاية" : "Enter sponsorship code"}
          style={claimInput}
        />
        <button
          type="button"
          onClick={onClaim}
          disabled={!campaignCode || claimLoading}
          style={{
            ...primaryBtn,
            opacity: !campaignCode || claimLoading ? 0.65 : 1,
          }}
        >
          {claimLoading ? (isAr ? "جاري..." : "Applying...") : isAr ? "تفعيل" : "Apply"}
        </button>
      </div>

      {claimMessage && <div style={claimMessageStyle}>{claimMessage}</div>}
    </div>
  );
}

function BusinessDetails({
  isAr,
  tr,
  business,
  businessName,
  categoryText,
  descriptionText,
  shortMapLink,
}) {
  return (
    <div style={panelCard}>
      <PanelHeader
        title={tr("businessDetails") || "Business Details"}
        desc={tr("businessDetailsDesc") || "Basic information for your registered business."}
      />

      {business ? (
        <div style={detailsGrid}>
          <InfoItem label={tr("businessName") || "Business Name"} value={businessName} isAr={isAr} />
          <InfoItem label={tr("category") || "Category"} value={categoryText} isAr={isAr} />
          <InfoItem label={isAr ? "فئة التسعير" : "Pricing Tier"} value={business?.pricing?.tier || "-"} isAr={isAr} />
          <InfoItem label={tr("whatsapp") || "WhatsApp"} value={business.whatsapp || "-"} isAr={isAr} />
          <InfoItem label={tr("description") || "Description"} value={descriptionText} fullWidth isAr={isAr} />

          <InfoItem
            label={tr("map") || "Map"}
            value={
              business.mapLink ? (
                <a href={business.mapLink} target="_blank" rel="noreferrer" style={linkStyle}>
                  {tr("openLocation") || "Open location"} · {shortMapLink}
                </a>
              ) : "-"
            }
            isAr={isAr}
          />

          <InfoItem
            label={tr("coordinates") || "Coordinates"}
            value={
              business.latitude != null && business.longitude != null
                ? `${business.latitude}, ${business.longitude}`
                : "-"
            }
            isAr={isAr}
          />
        </div>
      ) : (
        <EmptyState title={tr("noBusinessFound") || "No business found"} text={tr("noBusinessText") || ""} />
      )}
    </div>
  );
}


function PanelHeader({ title, desc }) {
  return (
    <div style={panelHeader}>
      <h3 style={panelTitle}>{title}</h3>
      <p style={panelDesc}>{desc}</p>
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
  padding: "16px",
  maxWidth: "1180px",
  width: "100%",
  margin: "0 auto",
  overflowX: "hidden",
  direction: isAr ? "rtl" : "ltr",
  textAlign: isAr ? "right" : "left",
  fontFamily: "Tajawal, Inter, system-ui, sans-serif",
});

const topLayout = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.8fr) minmax(280px, 0.9fr)",
  gap: "18px",
  marginBottom: "18px",
});

const welcomeCard = {
  background: "linear-gradient(135deg, #16a34a 0%, #34d399 100%)",
  color: "#fff",
  borderRadius: "24px",
  padding: "30px",
  boxShadow: "0 12px 32px rgba(22,163,74,0.18)",
};

const heroBadge = {
  display: "inline-block",
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.25)",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 14,
};

const heroTitle = {
  margin: "0 0 10px",
  fontSize: "clamp(28px, 4vw, 38px)",
  fontWeight: 900,
};

const heroSubtitle = {
  margin: 0,
  lineHeight: 1.8,
  color: "rgba(255,255,255,0.94)",
};

const walletCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 18,
};

const walletLabel = {
  color: "#6b7280",
  fontSize: 14,
  fontWeight: 800,
  marginBottom: 8,
};

const walletValue = {
  fontSize: 34,
  fontWeight: 900,
};

const walletHint = {
  color: "#6b7280",
  fontSize: 13,
  marginTop: 6,
};

const walletButton = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const aiSection = {
  marginBottom: 18,
};

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const statCard = {
  background: "#fff",
  borderRadius: 18,
  padding: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const statTitle = {
  color: "#6b7280",
  fontSize: 14,
  marginBottom: 10,
  fontWeight: 700,
};

const statValue = {
  fontSize: 28,
  fontWeight: 900,
  marginBottom: 6,
};

const statSubtitle = {
  color: "#9ca3af",
  fontSize: 13,
};

const pricingPlanCard = {
  background: "linear-gradient(135deg, #064e3b 0%, #16a34a 100%)",
  color: "#fff",
  borderRadius: 22,
  padding: 24,
  boxShadow: "0 10px 28px rgba(22,163,74,0.18)",
};

const campaignCard = {
  background: "#fff",
  border: "1px solid #dcfce7",
  borderRadius: 22,
  padding: 24,
  boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
};

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 16,
};

const sectionEyebrow = {
  fontSize: 13,
  fontWeight: 800,
  opacity: 0.82,
  marginBottom: 5,
};

const sectionTitle = {
  margin: 0,
  fontSize: 21,
  fontWeight: 900,
};

const pricingTierBadge = {
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.28)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 13,
  fontWeight: 900,
};

const pricingMetaRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  color: "rgba(255,255,255,0.9)",
  fontSize: 13,
  marginBottom: 14,
};

const pricingRows = {
  display: "grid",
  gap: 9,
};

const pricingRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 13,
  padding: "11px 13px",
  fontSize: 14,
};

const claimRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const claimInput = {
  flex: 1,
  minWidth: 200,
  padding: "12px 14px",
  borderRadius: 13,
  border: "1px solid #e5e7eb",
  outline: "none",
  fontSize: 14,
};

const claimMessageStyle = {
  marginTop: 12,
  color: "#166534",
  fontSize: 14,
  fontWeight: 700,
};



const panelCard = {
  background: "#fff",
  borderRadius: 22,
  padding: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
};

const panelHeader = {
  marginBottom: 16,
};

const panelTitle = {
  margin: "0 0 6px",
  fontSize: 20,
  color: "#111827",
};

const panelDesc = {
  margin: 0,
  color: "#6b7280",
  fontSize: 14,
  lineHeight: 1.7,
};

const detailsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 14,
};

const infoItemCard = {
  background: "#f9fafb",
  border: "1px solid #eef2f7",
  borderRadius: 15,
  padding: "14px 16px",
};

const infoLabel = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 8,
  fontWeight: 800,
};

const infoValue = {
  fontSize: 15,
  color: "#111827",
  lineHeight: 1.8,
  wordBreak: "break-word",
};

const emptyStateCard = {
  background: "#f9fafb",
  border: "1px dashed #d1d5db",
  borderRadius: 16,
  padding: 24,
};

const loadingCard = {
  minHeight: "50vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  color: "#374151",
};

const errorCard = {
  maxWidth: 720,
  margin: "60px auto",
  background: "#fff",
  border: "1px solid #fee2e2",
  borderRadius: 18,
  padding: 24,
};

const spinnerStyle = {
  width: 34,
  height: 34,
  border: "4px solid #dcfce7",
  borderTop: "4px solid #16a34a",
  borderRadius: "50%",
};

const primaryBtn = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "11px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const linkStyle = {
  color: "#16a34a",
  fontWeight: 800,
  textDecoration: "none",
};

const pendingFundingCard = {
  background: "#fff7ed",
  border: "1px solid #fdba74",
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  color: "#9a3412",
};
