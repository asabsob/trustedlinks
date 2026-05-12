import { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignFinance({
  lang = "en",
}) {
  const isAr = lang === "ar";

  const [loading, setLoading] =
    useState(true);

  const [campaigns, setCampaigns] =
    useState([]);

  const [claims, setClaims] =
    useState([]);

  const [error, setError] =
    useState("");

  const t = (en, ar) =>
    isAr ? ar : en;

  useEffect(() => {
    loadFinance();
  }, []);

  async function loadFinance() {
    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "campaign_token"
        );

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [campaignsRes, claimsRes] =
        await Promise.all([
          fetch(
            `${API_BASE}/api/campaign/campaigns`,
            { headers }
          ),

          fetch(
            `${API_BASE}/api/campaign/participants`,
            { headers }
          ),
        ]);

      const campaignsData =
        await campaignsRes.json();

      const claimsData =
        await claimsRes.json();

      if (!campaignsRes.ok) {
        throw new Error(
          campaignsData.error ||
            "Failed to load campaigns"
        );
      }

      if (!claimsRes.ok) {
        throw new Error(
          claimsData.error ||
            "Failed to load claims"
        );
      }

      setCampaigns(
        campaignsData.campaigns || []
      );

      setClaims(
        claimsData.participants || []
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to load finance"
      );
    } finally {
      setLoading(false);
    }
  }

  const finance = useMemo(() => {
    const totalBudget =
      campaigns.reduce(
        (sum, c) =>
          sum +
          Number(
            c.total_budget || 0
          ),
        0
      );

    const remainingBudget =
      campaigns.reduce(
        (sum, c) =>
          sum +
          Number(
            c.remaining_budget || 0
          ),
        0
      );

    const usedBudget =
      totalBudget -
      remainingBudget;

    const distributedCredits =
      claims.reduce(
        (sum, p) =>
          sum +
          Number(
            p.sponsored_balance ||
              0
          ),
        0
      );

    return {
      totalBudget,
      remainingBudget,
      usedBudget,
      distributedCredits,
      totalClaims:
        claims.length,
    };
  }, [campaigns, claims]);

  const currency =
    campaigns?.[0]?.currency ||
    "JOD";

  const pageStyle = {
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
    direction: isAr
      ? "rtl"
      : "ltr",
    fontFamily:
      "Tajawal, Inter, sans-serif",
  };

  const heroStyle = {
    background:
      "linear-gradient(135deg,#111827,#16a34a)",
    color: "#fff",
    padding: "30px",
    borderRadius: "24px",
    marginBottom: "24px",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.16)",
  };

  const statsGrid = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(240px,1fr))",
    gap: "18px",
    marginBottom: "26px",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "18px",
    padding: "22px",
    border:
      "1px solid #e5e7eb",
    boxShadow:
      "0 6px 18px rgba(15,23,42,0.04)",
  };

  const tableWrap = {
    background: "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    border:
      "1px solid #e5e7eb",
    boxShadow:
      "0 6px 18px rgba(15,23,42,0.04)",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyle = {
    background: "#f1f5f9",
    padding: "16px",
    textAlign: isAr
      ? "right"
      : "left",
    fontSize: "14px",
    color: "#475569",
  };

  const tdStyle = {
    padding: "16px",
    borderTop:
      "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#111827",
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            textAlign: "center",
            marginTop: "80px",
          }}
        >
          {t(
            "Loading finance...",
            "جاري تحميل البيانات..."
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* HERO */}
      <div style={heroStyle}>
        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            fontWeight: 800,
          }}
        >
          {t(
            "Campaign Finance",
            "الإدارة المالية"
          )}
        </h1>

        <p
          style={{
            marginTop: "10px",
            opacity: 0.9,
          }}
        >
          {t(
            "Track sponsorship budgets and distributed balances",
            "متابعة الميزانيات والأرصدة الدعائية"
          )}
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "14px",
            borderRadius: "14px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* STATS */}
      <div style={statsGrid}>
        <FinanceCard
          title={t(
            "Total Budget",
            "إجمالي الميزانية"
          )}
          value={`${finance.totalBudget.toFixed(
            2
          )} ${currency}`}
        />

        <FinanceCard
          title={t(
            "Used Budget",
            "المستخدم"
          )}
          value={`${finance.usedBudget.toFixed(
            2
          )} ${currency}`}
          color="#dc2626"
        />

        <FinanceCard
          title={t(
            "Remaining Budget",
            "المتبقي"
          )}
          value={`${finance.remainingBudget.toFixed(
            2
          )} ${currency}`}
          color="#16a34a"
        />

        <FinanceCard
          title={t(
            "Distributed Credits",
            "الرصيد الموزع"
          )}
          value={`${finance.distributedCredits.toFixed(
            2
          )} ${currency}`}
        />

        <FinanceCard
          title={t(
            "Claims Count",
            "عدد عمليات التفعيل"
          )}
          value={finance.totalClaims}
        />
      </div>

      {/* CAMPAIGNS TABLE */}
      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>
                {t(
                  "Campaign",
                  "الحملة"
                )}
              </th>

              <th style={thStyle}>
                {t(
                  "Total Budget",
                  "إجمالي الميزانية"
                )}
              </th>

              <th style={thStyle}>
                {t(
                  "Remaining",
                  "المتبقي"
                )}
              </th>

              <th style={thStyle}>
                {t(
                  "Credit Per Business",
                  "رصيد كل محل"
                )}
              </th>

              <th style={thStyle}>
                {t(
                  "Status",
                  "الحالة"
                )}
              </th>
            </tr>
          </thead>

          <tbody>
            {campaigns.length ===
            0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    ...tdStyle,
                    textAlign:
                      "center",
                    padding:
                      "40px",
                    color:
                      "#64748b",
                  }}
                >
                  {t(
                    "No campaigns found",
                    "لا توجد حملات"
                  )}
                </td>
              </tr>
            ) : (
              campaigns.map(
                (campaign) => (
                  <tr
                    key={
                      campaign.id
                    }
                  >
                    <td
                      style={
                        tdStyle
                      }
                    >
                      {
                        campaign.name
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {Number(
                        campaign.total_budget ||
                          0
                      ).toFixed(
                        2
                      )}{" "}
                      {
                        campaign.currency
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {Number(
                        campaign.remaining_budget ||
                          0
                      ).toFixed(
                        2
                      )}{" "}
                      {
                        campaign.currency
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {Number(
                        campaign.credit_per_business ||
                          0
                      ).toFixed(
                        2
                      )}{" "}
                      {
                        campaign.currency
                      }
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      <span
                        style={{
                          background:
                            campaign.status ===
                            "active"
                              ? "#dcfce7"
                              : "#f1f5f9",

                          color:
                            campaign.status ===
                            "active"
                              ? "#166534"
                              : "#475569",

                          padding:
                            "6px 10px",

                          borderRadius:
                            "999px",

                          fontSize:
                            "12px",

                          fontWeight:
                            700,
                        }}
                      >
                        {campaign.status ===
                        "active"
                          ? t(
                              "Active",
                              "نشطة"
                            )
                          : campaign.status}
                      </span>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinanceCard({
  title,
  value,
  color = "#111827",
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "18px",
        padding: "22px",
        border:
          "1px solid #e5e7eb",
        boxShadow:
          "0 6px 18px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          color: "#64748b",
          marginBottom: "10px",
          fontSize: "14px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "30px",
          fontWeight: 800,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}
