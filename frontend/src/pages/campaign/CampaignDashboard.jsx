import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignDashboard({ lang = "en" }) {
  const isAr = lang === "ar";

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
      activeFundingCodes: fundingCodes.filter((c) => c.status === "active").length,
    };
  }, [campaigns, participants, fundingCodes]);

  const currency = campaigns?.[0]?.currency || "JOD";

  function money(value) {
    return `${Number(value || 0).toFixed(2)} ${currency}`;
  }

  if (loading) {
    return (
      <div style={pageStyle(isAr)}>
        <div style={loadingStyle}>{t("Loading dashboard...", "جاري تحميل لوحة التحكم...")}</div>
      </div>
    );
  }

  return (
    <div style={pageStyle(isAr)}>
      <section style={heroStyle}>
        <div>
          <div style={heroBadge}>
            {t("Campaign Management", "إدارة الحملات")}
          </div>

          <h1 style={heroTitle}>
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

      <section style={statsGrid}>
        <DashboardCard
          title={t("Total Budget", "إجمالي الميزانية")}
          value={money(finance.totalBudget)}
        />

        <DashboardCard
          title={t("Used Budget", "المستخدم")}
          value={money(finance.usedBudget)}
          color="#dc2626"
        />

        <DashboardCard
          title={t("Remaining Budget", "المتبقي")}
          value={money(finance.remainingBudget)}
          color="#16a34a"
        />

        <DashboardCard
          title={t("Distributed Credits", "الرصيد الموزع")}
          value={money(finance.distributedCredits)}
        />

        <DashboardCard
          title={t("Campaigns", "الحملات")}
          value={finance.totalCampaigns}
        />

        <DashboardCard
          title={t("Participants", "المشاركون")}
          value={finance.totalParticipants}
        />

        <DashboardCard
          title={t("Funding Codes", "أكواد التمويل")}
          value={finance.totalFundingCodes}
        />

        <DashboardCard
          title={t("Active Codes", "الأكواد النشطة")}
          value={finance.activeFundingCodes}
          color="#16a34a"
        />
      </section>

      <section style={quickSection}>
        <div style={sectionHeader}>
          <div>
            <h2 style={sectionTitle}>{t("Quick Actions", "إجراءات سريعة")}</h2>
            <p style={sectionDesc}>
              {t("Manage the main campaign tools quickly.", "إدارة أدوات الحملات الرئيسية بسرعة.")}
            </p>
          </div>
        </div>

        <div style={quickGrid}>
          <QuickLink to="/campaign/campaigns" label={t("Create Campaign", "إنشاء حملة")} />
          <QuickLink to="/campaign/funding-codes" label={t("Funding Codes", "أكواد التمويل")} />
          <QuickLink to="/campaign/participants" label={t("Participants", "المشاركون")} />
          <QuickLink to="/campaign/finance" label={t("Finance", "المالية")} />
          <QuickLink to="/campaign/analytics" label={t("Analytics", "التحليلات")} />
        </div>
      </section>

      <section style={tableCard}>
        <div style={sectionHeader}>
          <div>
            <h2 style={sectionTitle}>{t("Recent Campaigns", "أحدث الحملات")}</h2>
            <p style={sectionDesc}>
              {t("Overview of your latest sponsorship campaigns.", "نظرة عامة على أحدث حملات الرعاية.")}
            </p>
          </div>

          <Link to="/campaign/campaigns" style={smallButton}>
            {t("View all", "عرض الكل")}
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle(isAr)}>{t("Campaign", "الحملة")}</th>
                <th style={thStyle(isAr)}>{t("Total Budget", "إجمالي الميزانية")}</th>
                <th style={thStyle(isAr)}>{t("Remaining", "المتبقي")}</th>
                <th style={thStyle(isAr)}>{t("Credit / Business", "رصيد كل محل")}</th>
                <th style={thStyle(isAr)}>{t("Status", "الحالة")}</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ ...tdStyle, textAlign: "center", color: "#64748b", padding: 36 }}>
                    {t("No campaigns yet", "لا توجد حملات بعد")}
                  </td>
                </tr>
              ) : (
                campaigns.slice(0, 6).map((campaign) => (
                  <tr key={campaign.id}>
                    <td style={tdStyle}>{campaign.name}</td>
                    <td style={tdStyle}>
                      {Number(campaign.total_budget || 0).toFixed(2)} {campaign.currency || currency}
                    </td>
                    <td style={tdStyle}>
                      {Number(campaign.remaining_budget || 0).toFixed(2)} {campaign.currency || currency}
                    </td>
                    <td style={tdStyle}>
                      {Number(campaign.credit_per_business || 0).toFixed(2)} {campaign.currency || currency}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DashboardCard({ title, value, color = "#111827" }) {
  return (
    <div style={cardStyle}>
      <div style={cardTitle}>{title}</div>
      <div style={{ ...cardValue, color }}>{value}</div>
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

const pageStyle = (isAr) => ({
  padding: "24px",
  background: "#f8fafc",
  minHeight: "100vh",
  direction: isAr ? "rtl" : "ltr",
  fontFamily: "Tajawal, Inter, system-ui, sans-serif",
});

const loadingStyle = {
  textAlign: "center",
  marginTop: "90px",
  color: "#64748b",
};

const heroStyle = {
  background: "linear-gradient(135deg,#111827,#16a34a)",
  color: "#fff",
  padding: "30px",
  borderRadius: "24px",
  marginBottom: "24px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.16)",
};

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

const heroTitle = {
  margin: 0,
  fontSize: "34px",
  fontWeight: 800,
};

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

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "18px",
  marginBottom: "26px",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const cardTitle = {
  color: "#64748b",
  marginBottom: "10px",
  fontSize: "14px",
};

const cardValue = {
  fontSize: "30px",
  fontWeight: 800,
};

const quickSection = {
  background: "#fff",
  borderRadius: "20px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
  marginBottom: "26px",
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

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
};

const quickGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: "14px",
};

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

const tableCard = {
  background: "#fff",
  borderRadius: "20px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const smallButton = {
  background: "#16a34a",
  color: "#fff",
  borderRadius: "12px",
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 700,
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

function statusBadge(status) {
  const active = status === "active";

  return {
    background: active ? "#dcfce7" : "#f1f5f9",
    color: active ? "#166534" : "#475569",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
  };
}
