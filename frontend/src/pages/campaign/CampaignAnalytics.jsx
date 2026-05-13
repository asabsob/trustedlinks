import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignAnalytics({ lang = "en" }) {
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");
  const [platform, setPlatform] = useState(null);
  
  useEffect(() => {
    loadAnalytics();
  }, []);
async function loadAnalytics() {
  try {
    setLoading(true);
    setError("");

    const token =
      localStorage.getItem("campaign_token");

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [
      campaignsRes,
      participantsRes,
      platformRes,
    ] = await Promise.all([
      fetch(
        `${API_BASE}/api/campaign/campaigns`,
        { headers }
      ),

      fetch(
        `${API_BASE}/api/campaign/participants`,
        { headers }
      ),

      fetch(
        `${API_BASE}/api/platform/analytics/search-demand`,
        { headers }
      ),
    ]);

    const campaignsData =
      await campaignsRes.json();

    const participantsData =
      await participantsRes.json();

    const platformData =
      await platformRes.json();

    if (!campaignsRes.ok) {
      throw new Error(
        campaignsData.error ||
          "Failed to load campaigns"
      );
    }

    if (!participantsRes.ok) {
      throw new Error(
        participantsData.error ||
          "Failed to load participants"
      );
    }

    if (!platformRes.ok) {
      throw new Error(
        platformData.error ||
          "Failed to load platform analytics"
      );
    }

    setCampaigns(
      campaignsData.campaigns || []
    );

    setParticipants(
      participantsData.participants || []
    );

    setPlatform(platformData);
  } catch (err) {
    setError(
      err.message ||
        "Failed to load analytics"
    );
  } finally {
    setLoading(false);
  }
}

  const analytics = useMemo(() => {
    const totalBudget = campaigns.reduce(
      (sum, c) => sum + Number(c.total_budget || 0),
      0
    );

    const remainingBudget = campaigns.reduce(
      (sum, c) => sum + Number(c.remaining_budget || 0),
      0
    );

    const usedBudget = totalBudget - remainingBudget;

    const totalCredits = participants.reduce(
      (sum, p) => sum + Number(p.sponsored_balance || 0),
      0
    );

    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

    const activeParticipants = participants.filter(
      (p) => p.sponsored_status === "active"
    ).length;

    const usageRate = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

    return {
      totalBudget,
      remainingBudget,
      usedBudget,
      totalCredits,
      activeCampaigns,
      activeParticipants,
      totalCampaigns: campaigns.length,
      totalParticipants: participants.length,
      usageRate,
    };
  }, [campaigns, participants]);

  const currency = campaigns?.[0]?.currency || "JOD";

  if (loading) {
    return (
      <div style={pageStyle(isAr)}>
        {t("Loading analytics...", "جاري تحميل التحليلات...")}
      </div>
    );
  }

  return (
    <div style={pageStyle(isAr)}>
      <section style={heroStyle}>
        <h1 style={heroTitle}>
          {t("Campaign Analytics", "تحليلات الحملات")}
        </h1>
        <p style={heroSubtitle}>
          {t(
            "Measure campaign activation, budget usage, and participant performance.",
            "قياس تفعيل الحملات واستخدام الميزانية وأداء المشاركين."
          )}
        </p>
      </section>

      {error && <div style={errorStyle}>{error}</div>}

      <section style={statsGrid}>
        <MetricCard
          title={t("Total Campaigns", "إجمالي الحملات")}
          value={analytics.totalCampaigns}
        />
        <MetricCard
          title={t("Active Campaigns", "الحملات النشطة")}
          value={analytics.activeCampaigns}
          color="#16a34a"
        />
        <MetricCard
          title={t("Participants", "المشاركون")}
          value={analytics.totalParticipants}
        />
        <MetricCard
          title={t("Active Participants", "المشاركون النشطون")}
          value={analytics.activeParticipants}
          color="#16a34a"
        />
        <MetricCard
          title={t("Budget Used", "الميزانية المستخدمة")}
          value={`${analytics.usedBudget.toFixed(2)} ${currency}`}
          color="#dc2626"
        />
        <MetricCard
          title={t("Remaining Budget", "الميزانية المتبقية")}
          value={`${analytics.remainingBudget.toFixed(2)} ${currency}`}
          color="#16a34a"
        />
      </section>

      <section style={panelStyle}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "12px",
    }}
  >
    <div>
      <h2 style={panelTitle}>
        {t(
          "Platform Insights",
          "تحليلات المنصة"
        )}
      </h2>

      <p style={mutedText}>
        {t(
          "Live search demand and platform activity.",
          "تحليلات مباشرة لطلبات البحث ونشاط المنصة."
        )}
      </p>
    </div>

    <div
      style={{
        background: "#dcfce7",
        color: "#166534",
        padding: "8px 14px",
        borderRadius: "999px",
        fontWeight: 700,
        fontSize: "13px",
      }}
    >
      Trusted Links Live
    </div>
  </div>

  <div style={statsGrid}>
    <MetricCard
      title={t(
        "Total Searches",
        "إجمالي عمليات البحث"
      )}
      value={
        platform?.overview
          ?.totalSearches || 0
      }
      color="#2563eb"
    />

    <MetricCard
      title={t(
        "Unique Users",
        "المستخدمون"
      )}
      value={
        platform?.overview
          ?.uniqueUsers || 0
      }
      color="#7c3aed"
    />

    <MetricCard
      title={t(
        "No Result Searches",
        "بحث بدون نتائج"
      )}
      value={
        platform?.overview
          ?.noResults || 0
      }
      color="#dc2626"
    />
  </div>
</section>

      <section style={gridTwo}>
  <div style={panelStyle}>
    <h2 style={panelTitle}>
      {t(
        "Top Search Keywords",
        "أكثر الكلمات بحثًا"
      )}
    </h2>

    <div
      style={{
        display: "grid",
        gap: "10px",
      }}
    >
      {(platform?.topKeywords || [])
        .slice(0, 8)
        .map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              padding: "12px 14px",
              background: "#f8fafc",
              borderRadius: "14px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <span
              style={{
                fontWeight: 600,
              }}
            >
              {item.query}
            </span>

            <span
              style={{
                color: "#16a34a",
                fontWeight: 700,
              }}
            >
              {item.count}
            </span>
          </div>
        ))}
    </div>
  </div>

  <div style={panelStyle}>
    <h2 style={panelTitle}>
      {t(
        "Search Intent Types",
        "أنواع البحث"
      )}
    </h2>

    <div
      style={{
        display: "grid",
        gap: "10px",
      }}
    >
      {(platform?.topIntents || [])
        .slice(0, 8)
        .map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              padding: "12px 14px",
              background: "#f8fafc",
              borderRadius: "14px",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <span
              style={{
                fontWeight: 600,
              }}
            >
              {item.intent}
            </span>

            <span
              style={{
                color: "#2563eb",
                fontWeight: 700,
              }}
            >
              {item.count}
            </span>
          </div>
        ))}
    </div>
  </div>
</section>

      <section style={gridTwo}>
        <div style={panelStyle}>
          <h2 style={panelTitle}>{t("Budget Usage", "استخدام الميزانية")}</h2>

          <div style={progressOuter}>
            <div
              style={{
                ...progressInner,
                width: `${Math.min(100, analytics.usageRate)}%`,
              }}
            />
          </div>

          <div style={progressText}>
            {analytics.usageRate.toFixed(1)}%
          </div>

          <p style={mutedText}>
            {t(
              "Percentage of campaign budget already used.",
              "نسبة الميزانية المستخدمة من الحملات."
            )}
          </p>
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitle}>
            {t("Sponsored Credits", "الأرصدة الدعائية")}
          </h2>

          <div style={bigNumber}>
            {analytics.totalCredits.toFixed(2)} {currency}
          </div>

          <p style={mutedText}>
            {t(
              "Total sponsored balance currently assigned to businesses.",
              "إجمالي الرصيد الدعائي الممنوح للمحال."
            )}
          </p>
        </div>
      </section>

      <section style={panelStyle}>
  <h2 style={panelTitle}>
    {t(
      "Top Visible Businesses",
      "أكثر الشركات ظهورًا"
    )}
  </h2>

  <div
    style={{
      display: "grid",
      gap: "12px",
    }}
  >
    {(platform?.topBusinesses || [])
      .slice(0, 8)
      .map((business, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            padding: "16px",
            background: "#f8fafc",
            borderRadius: "14px",
            border:
              "1px solid #e5e7eb",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {isAr
                ? business.name_ar
                : business.name}
            </div>

            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
                marginTop: "4px",
              }}
            >
              {t(
                "Top performing business",
                "أعلى الشركات أداءً"
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                {t("Views", "الظهور")}
              </div>

              <div
                style={{
                  fontWeight: 800,
                  color: "#2563eb",
                }}
              >
                {business.views}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                WhatsApp
              </div>

              <div
                style={{
                  fontWeight: 800,
                  color: "#16a34a",
                }}
              >
                {business.whatsapp}
              </div>
            </div>
          </div>
        </div>
      ))}
  </div>
</section>
      
      <section style={panelStyle}>
        <h2 style={panelTitle}>{t("Campaign Performance", "أداء الحملات")}</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle(isAr)}>{t("Campaign", "الحملة")}</th>
                <th style={thStyle(isAr)}>{t("Budget", "الميزانية")}</th>
                <th style={thStyle(isAr)}>{t("Remaining", "المتبقي")}</th>
                <th style={thStyle(isAr)}>{t("Used", "المستخدم")}</th>
                <th style={thStyle(isAr)}>{t("Status", "الحالة")}</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan="5" style={emptyTd}>
                    {t("No campaigns found", "لا توجد حملات")}
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const used =
                    Number(c.total_budget || 0) -
                    Number(c.remaining_budget || 0);

                  return (
                    <tr key={c.id}>
                      <td style={tdStyle}>{c.name}</td>
                      <td style={tdStyle}>
                        {Number(c.total_budget || 0).toFixed(2)} {c.currency}
                      </td>
                      <td style={tdStyle}>
                        {Number(c.remaining_budget || 0).toFixed(2)} {c.currency}
                      </td>
                      <td style={tdStyle}>
                        {used.toFixed(2)} {c.currency}
                      </td>
                      <td style={tdStyle}>
                        <span style={statusBadge(c.status)}>
                          {c.status === "active"
                            ? t("Active", "نشطة")
                            : c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, color = "#111827" }) {
  return (
    <div style={cardStyle}>
      <div style={metricTitle}>{title}</div>
      <div style={{ ...metricValue, color }}>{value}</div>
    </div>
  );
}

const pageStyle = (isAr) => ({
  padding: "24px",
  minHeight: "100vh",
  background: "#f8fafc",
  direction: isAr ? "rtl" : "ltr",
  fontFamily: "Tajawal, Inter, system-ui, sans-serif",
});

const heroStyle = {
  background: "linear-gradient(135deg,#111827,#16a34a)",
  color: "#fff",
  borderRadius: "24px",
  padding: "30px",
  marginBottom: "24px",
  boxShadow: "0 10px 30px rgba(15,23,42,0.14)",
};

const heroTitle = {
  margin: 0,
  fontSize: "34px",
  fontWeight: 800,
};

const heroSubtitle = {
  marginTop: "10px",
  opacity: 0.9,
  lineHeight: 1.7,
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: "18px",
  marginBottom: "24px",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
};

const metricTitle = {
  color: "#64748b",
  fontSize: "14px",
  marginBottom: "10px",
  fontWeight: 600,
};

const metricValue = {
  fontSize: "30px",
  fontWeight: 800,
};

const gridTwo = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: "18px",
  marginBottom: "24px",
};

const panelStyle = {
  background: "#fff",
  borderRadius: "20px",
  padding: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
  marginBottom: "24px",
};

const panelTitle = {
  margin: "0 0 16px",
  fontSize: "20px",
  color: "#111827",
};

const progressOuter = {
  height: "16px",
  background: "#e5e7eb",
  borderRadius: "999px",
  overflow: "hidden",
};

const progressInner = {
  height: "100%",
  background: "linear-gradient(135deg,#16a34a,#22c55e)",
};

const progressText = {
  marginTop: "12px",
  fontSize: "26px",
  fontWeight: 800,
  color: "#16a34a",
};

const mutedText = {
  color: "#64748b",
  lineHeight: 1.7,
};

const bigNumber = {
  fontSize: "34px",
  fontWeight: 800,
  color: "#16a34a",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = (isAr) => ({
  background: "#f1f5f9",
  padding: "16px",
  textAlign: isAr ? "right" : "left",
  color: "#475569",
  fontSize: "14px",
});

const tdStyle = {
  padding: "16px",
  borderTop: "1px solid #f1f5f9",
  color: "#111827",
  fontSize: "14px",
};

const emptyTd = {
  ...tdStyle,
  textAlign: "center",
  padding: "40px",
  color: "#64748b",
};

const errorStyle = {
  background: "#fef2f2",
  color: "#b91c1c",
  padding: "14px",
  borderRadius: "14px",
  marginBottom: "20px",
};

function statusBadge(status) {
  return {
    background: status === "active" ? "#dcfce7" : "#f1f5f9",
    color: status === "active" ? "#166534" : "#475569",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
  };
}
