import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignParticipants({
  lang = "en",
}) {
  const isAr = lang === "ar";

  const [loading, setLoading] =
    useState(true);

  const [participants, setParticipants] =
    useState([]);

  const [stats, setStats] = useState({
    total: 0,
    totalCredits: 0,
    active: 0,
  });

  const [error, setError] =
    useState("");

  const t = (en, ar) =>
    isAr ? ar : en;

  useEffect(() => {
    loadParticipants();
  }, []);

  async function loadParticipants() {
    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "campaign_token"
        );

      const res = await fetch(
        `${API_BASE}/api/campaign/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to load participants"
        );
      }

      setParticipants(
        data.participants || []
      );

      setStats({
        total:
          data.participants?.length || 0,

        totalCredits:
          data.totalCredits || 0,

        active:
          data.activeParticipants || 0,
      });
    } catch (err) {
      setError(
        err.message ||
          "Failed to load"
      );
    } finally {
      setLoading(false);
    }
  }

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
      "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "#fff",
    padding: "28px",
    borderRadius: "22px",
    marginBottom: "24px",
    boxShadow:
      "0 10px 30px rgba(22,163,74,0.18)",
  };

  const statsGrid = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: "16px",
    marginBottom: "24px",
  };

  const statCard = {
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
            "Loading...",
            "جاري التحميل..."
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
            fontSize: "32px",
            fontWeight: 800,
          }}
        >
          {t(
            "Campaign Participants",
            "المشاركون بالحملة"
          )}
        </h1>

        <p
          style={{
            marginTop: "10px",
            opacity: 0.9,
          }}
        >
          {t(
            "Manage businesses and sponsorship participants",
            "إدارة المشاركين والمحال المستفيدة من الحملة"
          )}
        </p>
      </div>

      {/* STATS */}
      <div style={statsGrid}>
        <div style={statCard}>
          <div
            style={{
              color: "#64748b",
              marginBottom: "8px",
            }}
          >
            {t(
              "Total Participants",
              "إجمالي المشاركين"
            )}
          </div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
            }}
          >
            {stats.total}
          </div>
        </div>

        <div style={statCard}>
          <div
            style={{
              color: "#64748b",
              marginBottom: "8px",
            }}
          >
            {t(
              "Active Businesses",
              "المحال النشطة"
            )}
          </div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#16a34a",
            }}
          >
            {stats.active}
          </div>
        </div>

        <div style={statCard}>
          <div
            style={{
              color: "#64748b",
              marginBottom: "8px",
            }}
          >
            {t(
              "Sponsored Credits",
              "الرصيد الدعائي"
            )}
          </div>

          <div
            style={{
              fontSize: "32px",
              fontWeight: 800,
            }}
          >
            {stats.totalCredits}
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "14px",
            borderRadius: "14px",
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      {/* TABLE */}
      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>
                {t(
                  "Business",
                  "المحل"
                )}
              </th>

              <th style={thStyle}>
                {t(
                  "Phone",
                  "الهاتف"
                )}
              </th>

              <th style={thStyle}>
                {t(
                  "Country",
                  "الدولة"
                )}
              </th>

              <th style={thStyle}>
                {t(
                  "Sponsored Balance",
                  "الرصيد الدعائي"
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
            {participants.length ===
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
                    "No participants found",
                    "لا يوجد مشاركين"
                  )}
                </td>
              </tr>
            ) : (
              participants.map(
                (item) => (
                  <tr
                    key={item.id}
                  >
                    <td
                      style={
                        tdStyle
                      }
                    >
                      {isAr
                        ? item.name_ar ||
                          item.name
                        : item.name ||
                          item.name_ar}
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {item.whatsapp ||
                        "-"}
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {item.country ||
                        "-"}
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      {Number(
                        item.sponsored_balance ||
                          0
                      ).toFixed(
                        2
                      )}{" "}
                      {item.wallet_currency ||
                        "JOD"}
                    </td>

                    <td
                      style={
                        tdStyle
                      }
                    >
                      <span
                        style={{
                          background:
                            item.sponsored_status ===
                            "active"
                              ? "#dcfce7"
                              : "#f1f5f9",

                          color:
                            item.sponsored_status ===
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
                        {item.sponsored_status ===
                        "active"
                          ? t(
                              "Active",
                              "نشط"
                            )
                          : t(
                              "Inactive",
                              "غير نشط"
                            )}
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
