import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useIsMobile from "../hooks/useIsMobile";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignDashboard({ lang = "en" }) {
  const isAr = lang === "ar";
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [fundingCodes, setFundingCodes] = useState([]);
  const [error, setError] = useState("");

  const owner = JSON.parse(localStorage.getItem("campaign_owner") || "{}");
  const t = (en, ar) => (isAr ? ar : en);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("campaign_token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [campaignsRes, participantsRes, codesRes] = await Promise.all([
        fetch(`${API_BASE}/api/campaign/campaigns`, { headers }),
        fetch(`${API_BASE}/api/campaign/participants`, { headers }),
        fetch(`${API_BASE}/api/campaign/funding-codes`, { headers }),
      ]);

      const campaignsData = await campaignsRes.json();
      const participantsData = await participantsRes.json();
      const codesData = await codesRes.json();

      if (!campaignsRes.ok) {
        throw new Error(campaignsData.error || "Failed to load campaigns");
      }

      if (!participantsRes.ok) {
        throw new Error(participantsData.error || "Failed to load participants");
      }

      if (!codesRes.ok) {
        throw new Error(codesData.error || "Failed to load funding codes");
      }

      setCampaigns(campaignsData.campaigns || []);
      setParticipants(participantsData.participants || []);
      setFundingCodes(codesData.fundingCodes || []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  const finance = useMemo(() => {
    const totalBudget = campaigns.reduce(
      (sum, c) => sum + Number(c.total_budget || 0),
      0
    );

    const remainingBudget = campaigns.reduce(
      (sum, c) => sum + Number(c.remaining_budget || 0),
      0
    );

    const usedBudget = totalBudget - remainingBudget;

    const distributedCredits = participants.reduce(
      (sum, p) => sum + Number(p.sponsored_balance || 0),
      0
    );

    return {
      totalBudget,
      remainingBudget,
      usedBudget,
      distributedCredits,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      totalParticipants: participants.length,
      totalFundingCodes: fundingCodes.length,
      activeFundingCodes: fundingCodes.filter((c) => c.status === "active")
        .length,
    };
  }, [campaigns, participants, fundingCodes]);

  const currency = campaigns?.[0]?.currency || "JOD";

  function money(value, selectedCurrency = currency) {
    return `${Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${selectedCurrency}`;
  }

  if (loading) {
    return (
      <div style={pageStyle(isAr, isMobile)}>
        <div style={loadingStyle}>
          {t("Loading dashboard...", "جاري تحميل لوحة التحكم...")}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle(isAr, isMobile)}>
      <section style={heroStyle(isMobile)}>
        <div>
          <div style={heroBadge}>
            {t("Campaign Management", "إدارة الحملات")}
          </div>

          <h1 style={heroTitle(isMobile)}>
            {t("Welcome", "مرحبًا")} {owner?.name || ""}
          </h1>

          <p style={heroText}>
            {t(
              "Track campaign performance, budgets, participants, and funding activity from one place.",
              "تابع أداء الحملات والميزانيات والمشاركين وأكواد التمويل من مكان واحد."
            )}
          </p>
        </div>
      </section>

      {error && <div style={errorStyle}>{error}</div>}

      <section style={statsGrid(isMobile)}>
        <DashboardCard
          title={t("Total Budget", "إجمالي الميزانية")}
          value={money(finance.totalBudget)}
          isMobile={isMobile}
        />

        <DashboardCard
          title={t("Used Budget", "المستخدم")}
          value={money(finance.usedBudget)}
          color="#dc2626"
          isMobile={isMobile}
        />

        <DashboardCard
          title={t("Remaining Budget", "المتبقي")}
          value={money(finance.remainingBudget)}
          color="#16a34a"
          isMobile={isMobile}
        />

        <DashboardCard
          title={t("Distributed Credits", "الرصيد الموزع")}
          value={money(finance.distributedCredits)}
          isMobile={isMobile}
        />

        <DashboardCard
          title={t("Campaigns", "الحملات")}
          value={finance.totalCampaigns}
          isMobile={isMobile}
        />

        <DashboardCard
          title={t("Participants", "المشاركون")}
          value={finance.totalParticipants}
          isMobile={isMobile}
        />

        <DashboardCard
          title={t("Funding Codes", "أكواد التمويل")}
          value={finance.totalFundingCodes}
          isMobile={isMobile}
        />

        <DashboardCard
          title={t("Active Codes", "الأكواد النشطة")}
          value={finance.activeFundingCodes}
          color="#16a34a"
          isMobile={isMobile}
        />
      </section>

      <section style={quickSection(isMobile)}>
        <div style={sectionHeader(isMobile)}>
          <div>
            <h2 style={sectionTitle}>
              {t("Quick Actions", "إجراءات سريعة")}
            </h2>
            <p style={sectionDesc}>
              {t(
                "Manage the main campaign tools quickly.",
                "إدارة أدوات الحملات الرئيسية بسرعة."
              )}
            </p>
          </div>
        </div>

        <div style={quickGrid(isMobile)}>
          <QuickLink
            to="/campaign/campaigns"
            label={t("Create Campaign", "إنشاء حملة")}
          />
          <QuickLink
            to="/campaign/funding-codes"
            label={t("Funding Codes", "أكواد التمويل")}
          />
          <QuickLink
            to="/campaign/participants"
            label={t("Participants", "المشاركون")}
          />
          <QuickLink to="/campaign/finance" label={t("Finance", "المالية")} />
          <QuickLink
            to="/campaign/analytics"
            label={t("Analytics", "التحليلات")}
          />
        </div>
      </section>

      <section style={tableCard(isMobile)}>
        <div style={sectionHeader(isMobile)}>
          <div>
            <h2 style={sectionTitle}>
              {t("Recent Campaigns", "أحدث الحملات")}
            </h2>
            <p style={sectionDesc}>
              {t(
                "Overview of your latest sponsorship campaigns.",
                "نظرة عامة على أحدث حملات الرعاية."
              )}
            </p>
          </div>

          <Link to="/campaign/campaigns" style={smallButton}>
            {t("View all", "عرض الكل")}
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div style={emptyState}>
            {t("No campaigns yet", "لا توجد حملات بعد")}
          </div>
        ) : isMobile ? (
          <div style={mobileCardsWrap}>
            {campaigns.slice(0, 6).map((campaign) => (
              <div key={campaign.id} style={mobileCampaignCard}>
                <div style={mobileCampaignTitle}>{campaign.name}</div>

                <MobileRow
                  label={t("Total Budget", "إجمالي الميزانية")}
                  value={money(
                    campaign.total_budget,
                    campaign.currency || currency
                  )}
                />

                <MobileRow
                  label={t("Remaining", "المتبقي")}
                  value={money(
                    campaign.remaining_budget,
                    campaign.currency || currency
                  )}
                />

                <MobileRow
                  label={t("Credit / Business", "رصيد كل محل")}
                  value={money(
                    campaign.credit_per_business,
                    campaign.currency || currency
                  )}
                />

                <div style={mobileRow}>
                  <span style={mobileLabel}>{t("Status", "الحالة")}</span>
                  <span style={statusBadge(campaign.status)}>
                    {campaign.status === "active"
                      ? t("Active", "نشطة")
                      : campaign.status === "paused"
                      ? t("Paused", "متوقفة")
                      : campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle(isAr)}>{t("Campaign", "الحملة")}</th>
                  <th style={thStyle(isAr)}>
                    {t("Total Budget", "إجمالي الميزانية")}
                  </th>
                  <th style={thStyle(isAr)}>{t("Remaining", "المتبقي")}</th>
                  <th style={thStyle(isAr)}>
                    {t("Credit / Business", "رصيد كل محل")}
                  </th>
                  <th style={thStyle(isAr)}>{t("Status", "الحالة")}</th>
                </tr>
              </thead>

              <tbody>
                {campaigns.slice(0, 6).map((campaign) => (
                  <tr key={campaign.id}>
                    <td style={tdStyle}>{campaign.name}</td>
                    <td style={tdStyle}>
                      {money(campaign.total_budget, campaign.currency || currency)}
                    </td>
                    <td style={tdStyle}>
                      {money(
                        campaign.remaining_budget,
                        campaign.currency || currency
                      )}
                    </td>
                    <td style={tdStyle}>
                      {money(
                        campaign.credit_per_business,
                        campaign.currency || currency
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={statusBadge(campaign.status)}>
                        {campaign.status === "active"
                          ? t("Active", "نشطة")
                          : campaign.status === "paused"
                          ? t("Paused", "متوقفة")
                          : campaign.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardCard({ title, value, color = "#111827", isMobile }) {
  return (
    <div style={cardStyle(isMobile)}>
      <div style={cardTitle}>{title}</div>
      <div style={{ ...cardValue(isMobile), color }}>{value}</div>
    </div>
  );
}

function QuickLink({ to, label }) {
  return (
    <Link to={to} style={quickLinkStyle}>
      {label}
    </Link>
  );
}

function MobileRow({ label, value }) {
  return (
    <div style={mobileRow}>
      <span style={mobileLabel}>{label}</span>
      <strong style={mobileValue}>{value}</strong>
    </div>
  );
}

const pageStyle = (isAr, isMobile) => ({
  padding: isMobile ? "12px" : "24px",
  background: "#f8fafc",
  minHeight: "100vh",
  direction: isAr ? "rtl" : "ltr",
  fontFamily: "Tajawal, Inter, system-ui, sans-serif",
  boxSizing: "border-box",
});

const loadingStyle = {
  textAlign: "center",
  marginTop: "90px",
  color: "#64748b",
};

const heroStyle = (isMobile) => ({
  background: "linear-gradient(135deg,#111827,#16a34a)",
  color: "#fff",
  padding: isMobile ? "22px" : "30px",
  borderRadius: isMobile ? "18px" : "24px",
  marginBottom: "24px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.16)",
});

const heroBadge = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.22)",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "12px",
};

const heroTitle = (isMobile) => ({
  margin: 0,
  fontSize: isMobile ? "24px" : "34px",
  fontWeight: 800,
  lineHeight: 1.2,
});

const heroText = {
  marginTop: "10px",
  opacity: 0.9,
  maxWidth: "760px",
  lineHeight: 1.7,
};

const errorStyle = {
  background: "#fef2f2",
  color: "#b91c1c",
  padding: "14px",
  borderRadius: "14px",
  marginBottom: "20px",
};

const statsGrid = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile
    ? "1fr"
    : "repeat(auto-fit,minmax(220px,1fr))",
  gap: isMobile ? "12px" : "18px",
  marginBottom: "26px",
});

const cardStyle = (isMobile) => ({
  background: "#fff",
  borderRadius: "18px",
  padding: isMobile ? "18px" : "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
  minWidth: 0,
});

const cardTitle = {
  color: "#64748b",
  marginBottom: "10px",
  fontSize: "14px",
};

const cardValue = (isMobile) => ({
  fontSize: isMobile ? "22px" : "30px",
  fontWeight: 800,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
});

const quickSection = (isMobile) => ({
  background: "#fff",
  borderRadius: "20px",
  padding: isMobile ? "18px" : "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
  marginBottom: "26px",
});

const sectionHeader = (isMobile) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: isMobile ? "stretch" : "center",
  gap: "16px",
  marginBottom: "18px",
  flexWrap: "wrap",
  flexDirection: isMobile ? "column" : "row",
});

const sectionTitle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
  color: "#111827",
};

const sectionDesc = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const quickGrid = (isMobile) => ({
  display: "grid",
  gridTemplateColumns: isMobile
    ? "1fr"
    : "repeat(auto-fit,minmax(180px,1fr))",
  gap: "14px",
});

const quickLinkStyle = {
  display: "block",
  background: "#f8fafc",
  color: "#111827",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
  fontWeight: 700,
  textDecoration: "none",
};

const tableCard = (isMobile) => ({
  background: "#fff",
  borderRadius: "20px",
  padding: isMobile ? "18px" : "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
});

const smallButton = {
  background: "#16a34a",
  color: "#fff",
  borderRadius: "12px",
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 700,
  textAlign: "center",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "840px",
};

const thStyle = (isAr) => ({
  background: "#f1f5f9",
  padding: "14px",
  textAlign: isAr ? "right" : "left",
  fontSize: "14px",
  color: "#475569",
});

const tdStyle = {
  padding: "14px",
  borderTop: "1px solid #f1f5f9",
  fontSize: "14px",
  color: "#111827",
};

const emptyState = {
  textAlign: "center",
  color: "#64748b",
  padding: 36,
};

const mobileCardsWrap = {
  display: "grid",
  gap: "12px",
};

const mobileCampaignCard = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
};

const mobileCampaignTitle = {
  fontSize: "16px",
  fontWeight: 800,
  color: "#111827",
  marginBottom: "12px",
};

const mobileRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "9px 0",
  borderTop: "1px solid #e5e7eb",
  alignItems: "center",
};

const mobileLabel = {
  color: "#64748b",
  fontSize: "13px",
};

const mobileValue = {
  color: "#111827",
  fontSize: "13px",
  textAlign: "end",
  overflowWrap: "anywhere",
};

function statusBadge(status) {
  const active = status === "active";

  return {
    background: active ? "#dcfce7" : "#f1f5f9",
    color: active ? "#166534" : "#475569",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

