import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function CampaignDashboard() {
  const [lang, setLang] = useState(
    localStorage.getItem("campaign_lang") || "en"
  );

  const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";

  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState(null);

  const [finance, setFinance] = useState(null);

  const [error, setError] = useState("");

  const token =
    localStorage.getItem("campaign_token");

  const owner = JSON.parse(
    localStorage.getItem("campaign_owner") ||
      "{}"
  );

  useEffect(() => {
    localStorage.setItem(
      "campaign_lang",
      lang
    );
  }, [lang]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

  const [dashboardRes, financeRes] =
  await Promise.all([
    fetch(
      `${API_BASE}/api/campaign/dashboard`,
      { headers }
    ),

    fetch(
      `${API_BASE}/api/campaign/analytics/finance`,
      { headers }
    ),
  ]);

      const dashboardData =
        await dashboardRes.json();

      const financeData =
        await financeRes.json();

      if (!dashboardRes.ok) {
        throw new Error(
          dashboardData.error ||
            "Failed to load dashboard"
        );
      }

      if (!financeRes.ok) {
        throw new Error(
          financeData.error ||
            "Failed to load finance"
        );
      }

      setDashboard(dashboardData);
      setFinance(financeData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const t = {
    en: {
      title: "Campaign Dashboard",

      welcome: "Welcome",

      totalBudget: "Total Budget",

      usedBudget: "Used Budget",

      remainingBudget:
        "Remaining Budget",

      campaigns: "Campaigns",

      participants: "Participants",

      fundingCodes:
        "Funding Codes",

      activeFundingCodes:
        "Active Funding Codes",

      createCampaign:
        "Create Campaign",

      manageFundingCodes:
        "Funding Codes",

      participantsPage:
        "Participants",

      finance: "Finance",

      language: "العربية",
    },

    ar: {
      title: "لوحة إدارة الحملات",

      welcome: "مرحبًا",

      totalBudget:
        "إجمالي الميزانية",

      usedBudget:
        "الميزانية المستخدمة",

      remainingBudget:
        "الميزانية المتبقية",

      campaigns: "الحملات",

      participants:
        "المشاركون",

      fundingCodes:
        "أكواد التمويل",

      activeFundingCodes:
        "الأكواد النشطة",

      createCampaign:
        "إنشاء حملة",

      manageFundingCodes:
        "أكواد التمويل",

      participantsPage:
        "المشاركون",

      finance: "المالية",

      language: "English",
    },
  };

  function formatMoney(v) {
    return Number(v || 0).toFixed(2);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100"
    >
      {/* HEADER */}
      <div className="bg-black text-white px-6 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {t[lang].title}
          </h1>

          <p className="text-slate-300 mt-1">
            {t[lang].welcome}{" "}
            {owner?.name || ""}
          </p>
        </div>

        <button
          onClick={() =>
            setLang(
              lang === "en" ? "ar" : "en"
            )
          }
          className="bg-white text-black px-4 py-2 rounded-xl"
        >
          {t[lang].language}
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <Card
            title={t[lang].totalBudget}
            value={formatMoney(
              finance?.finance
                ?.totalBudget
            )}
          />

          <Card
            title={t[lang].usedBudget}
            value={formatMoney(
              finance?.finance
                ?.usedBudget
            )}
          />

          <Card
            title={
              t[lang]
                .remainingBudget
            }
            value={formatMoney(
              finance?.finance
                ?.remainingBudget
            )}
          />

          <Card
            title={t[lang].campaigns}
            value={
              finance?.analytics
                ?.totalCampaigns || 0
            }
          />

          <Card
            title={
              t[lang]
                .participants
            }
            value={
              finance?.analytics
                ?.totalParticipants ||
              0
            }
          />

          <Card
            title={
              t[lang]
                .fundingCodes
            }
            value={
              finance?.analytics
                ?.totalFundingCodes ||
              0
            }
          />

          <Card
            title={
              t[lang]
                .activeFundingCodes
            }
            value={
              finance?.analytics
                ?.activeFundingCodes ||
              0
            }
          />
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <QuickLink
              to="/campaign/campaigns"
              label={
                t[lang]
                  .createCampaign
              }
            />

            <QuickLink
              to="/campaign/funding-codes"
              label={
                t[lang]
                  .manageFundingCodes
              }
            />

            <QuickLink
              to="/campaign/participants"
              label={
                t[lang]
                  .participantsPage
              }
            />

            <QuickLink
              to="/campaign/finance"
              label={
                t[lang].finance
              }
            />
          </div>
        </div>

        {/* RECENT CAMPAIGNS */}
        <div className="mt-10 bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-5">
            Recent Campaigns
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-3">
                    Name
                  </th>

                  <th className="py-3">
                    Budget
                  </th>

                  <th className="py-3">
                    Remaining
                  </th>

                  <th className="py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {dashboard?.campaigns?.map(
                  (c) => (
                    <tr
                      key={c.id}
                      className="border-b"
                    >
                      <td className="py-3">
                        {c.name}
                      </td>

                      <td className="py-3">
                        {formatMoney(
                          c.total_budget
                        )}
                      </td>

                      <td className="py-3">
                        {formatMoney(
                          c.remaining_budget
                        )}
                      </td>

                      <td className="py-3">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="text-slate-500 text-sm">
        {title}
      </div>

      <div className="text-3xl font-bold mt-3">
        {value}
      </div>
    </div>
  );
}

function QuickLink({
  to,
  label,
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-2xl shadow-sm p-5 hover:bg-black hover:text-white transition"
    >
      <div className="font-semibold">
        {label}
      </div>
    </Link>
  );
}
