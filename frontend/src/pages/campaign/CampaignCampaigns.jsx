import { useEffect, useState } from "react";

export default function CampaignCampaigns() {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "";

  const token =
    localStorage.getItem("campaign_token");

  const [lang, setLang] = useState(
    localStorage.getItem("campaign_lang") || "en"
  );

  const [campaigns, setCampaigns] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [form, setForm] = useState({
    name: "",
    totalBudget: "",
    currency: "JOD",
    creditPerBusiness: 20,
    startsAt: "",
    expiresAt: "",
  });

  const t = {
    en: {
      title: "Campaigns",

      subtitle:
        "Manage sponsorship campaigns and budgets",

      createCampaign:
        "Create Campaign",

      campaignName:
        "Campaign Name",

      totalBudget:
        "Total Budget",

      currency: "Currency",

      creditPerBusiness:
        "Credit Per Business",

      startDate:
        "Start Date",

      expiryDate:
        "Expiry Date",

      create:
        "Create Campaign",

      active: "Active",

      paused: "Paused",

      completed:
        "Completed",

      cancelled:
        "Cancelled",

      status: "Status",

      remaining:
        "Remaining",

      noCampaigns:
        "No campaigns yet",

      noCampaignsDesc:
        "Create your first campaign to start sponsoring businesses.",

      language: "العربية",
    },

    ar: {
      title: "الحملات",

      subtitle:
        "إدارة حملات الرعاية والميزانيات",

      createCampaign:
        "إنشاء حملة",

      campaignName:
        "اسم الحملة",

      totalBudget:
        "إجمالي الميزانية",

      currency: "العملة",

      creditPerBusiness:
        "الرصيد لكل متجر",

      startDate:
        "تاريخ البداية",

      expiryDate:
        "تاريخ الانتهاء",

      create:
        "إنشاء الحملة",

      active: "نشطة",

      paused: "متوقفة",

      completed:
        "مكتملة",

      cancelled:
        "ملغية",

      status: "الحالة",

      remaining:
        "المتبقي",

      noCampaigns:
        "لا توجد حملات",

      noCampaignsDesc:
        "أنشئ أول حملة للبدء برعاية المتاجر.",

      language: "English",
    },
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_BASE}/api/campaign/campaigns`,
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
            "Failed to load campaigns"
        );
      }

      setCampaigns(
        data.campaigns || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(e) {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const res = await fetch(
        `${API_BASE}/api/campaign/campaigns`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: form.name,

            totalBudget:
              Number(
                form.totalBudget
              ),

            currency:
              form.currency,

            creditPerBusiness:
              Number(
                form.creditPerBusiness
              ),

            startsAt:
              form.startsAt ||
              null,

            expiresAt:
              form.expiresAt ||
              null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to create campaign"
        );
      }

      setSuccess(
        lang === "ar"
          ? "تم إنشاء الحملة بنجاح"
          : "Campaign created successfully"
      );

      setForm({
        name: "",
        totalBudget: "",
        currency: "JOD",
        creditPerBusiness: 20,
        startsAt: "",
        expiresAt: "",
      });

      loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function formatMoney(v) {
    return Number(v || 0).toFixed(2);
  }

  function statusColor(status) {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";

      case "paused":
        return "bg-yellow-100 text-yellow-700";

      case "completed":
        return "bg-blue-100 text-blue-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t[lang].title}
        </h1>

        <p className="text-slate-500 mt-2">
          {t[lang].subtitle}
        </p>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-6">
          {success}
        </div>
      )}

      {/* CREATE FORM */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
        <h2 className="text-xl font-bold mb-5">
          {t[lang].createCampaign}
        </h2>

        <form
          onSubmit={createCampaign}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <input
            placeholder={
              t[lang]
                .campaignName
            }
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name:
                  e.target.value,
              })
            }
            className="border border-slate-200 rounded-xl p-3"
          />

          <input
            type="number"
            placeholder={
              t[lang]
                .totalBudget
            }
            value={
              form.totalBudget
            }
            onChange={(e) =>
              setForm({
                ...form,
                totalBudget:
                  e.target.value,
              })
            }
            className="border border-slate-200 rounded-xl p-3"
          />

          <select
            value={form.currency}
            onChange={(e) =>
              setForm({
                ...form,
                currency:
                  e.target.value,
              })
            }
            className="border border-slate-200 rounded-xl p-3"
          >
            <option value="JOD">
              JOD
            </option>

            <option value="USD">
              USD
            </option>

            <option value="SAR">
              SAR
            </option>

            <option value="AED">
              AED
            </option>
          </select>

          <input
            type="number"
            placeholder={
              t[lang]
                .creditPerBusiness
            }
            value={
              form.creditPerBusiness
            }
            onChange={(e) =>
              setForm({
                ...form,
                creditPerBusiness:
                  e.target.value,
              })
            }
            className="border border-slate-200 rounded-xl p-3"
          />

          <input
            type="date"
            value={
              form.startsAt
            }
            onChange={(e) =>
              setForm({
                ...form,
                startsAt:
                  e.target.value,
              })
            }
            className="border border-slate-200 rounded-xl p-3"
          />

          <input
            type="date"
            value={
              form.expiresAt
            }
            onChange={(e) =>
              setForm({
                ...form,
                expiresAt:
                  e.target.value,
              })
            }
            className="border border-slate-200 rounded-xl p-3"
          />

          <button
            type="submit"
            disabled={creating}
            className="xl:col-span-3 bg-black hover:bg-slate-800 text-white rounded-xl p-3 font-semibold transition"
          >
            {creating
              ? "..."
              : t[lang].create}
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        {loading ? (
          <div className="py-10 text-center">
            Loading...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-xl font-semibold">
              {
                t[lang]
                  .noCampaigns
              }
            </div>

            <p className="text-slate-500 mt-2">
              {
                t[lang]
                  .noCampaignsDesc
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b text-slate-500 text-sm">
                  <th className="py-3 text-start">
                    {
                      t[lang]
                        .campaignName
                    }
                  </th>

                  <th className="py-3 text-start">
                    {
                      t[lang]
                        .totalBudget
                    }
                  </th>

                  <th className="py-3 text-start">
                    {
                      t[lang]
                        .remaining
                    }
                  </th>

                  <th className="py-3 text-start">
                    {
                      t[lang]
                        .creditPerBusiness
                    }
                  </th>

                  <th className="py-3 text-start">
                    {
                      t[lang]
                        .status
                    }
                  </th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map(
                  (c) => (
                    <tr
                      key={c.id}
                      className="border-b"
                    >
                      <td className="py-4 font-semibold">
                        {c.name}
                      </td>

                      <td className="py-4">
                        {formatMoney(
                          c.total_budget
                        )}{" "}
                        {
                          c.currency
                        }
                      </td>

                      <td className="py-4">
                        {formatMoney(
                          c.remaining_budget
                        )}{" "}
                        {
                          c.currency
                        }
                      </td>

                      <td className="py-4">
                        {
                          c.credit_per_business
                        }
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${statusColor(
                            c.status
                          )}`}
                        >
                          {
                            t[
                              lang
                            ][
                              c.status
                            ]
                          }
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
