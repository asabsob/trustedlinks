import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignCampaigns({ lang = "en" }) {
  const isAr = lang === "ar";
  const token = localStorage.getItem("campaign_token");

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    totalBudget: "",
    currency: "JOD",
    creditPerBusiness: 20,
    startsAt: "",
    expiresAt: "",
  });

  const t = (en, ar) => (isAr ? ar : en);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/campaign/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load campaigns");
      }

      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError(t("Campaign name is required", "اسم الحملة مطلوب"));
      return;
    }

    if (!form.totalBudget || Number(form.totalBudget) <= 0) {
      setError(t("Total budget must be greater than zero", "يجب أن تكون الميزانية أكبر من صفر"));
      return;
    }

    if (!form.creditPerBusiness || Number(form.creditPerBusiness) <= 0) {
      setError(t("Credit per business must be greater than zero", "يجب أن يكون رصيد كل متجر أكبر من صفر"));
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${API_BASE}/api/campaign/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          totalBudget: Number(form.totalBudget),
          currency: form.currency,
          creditPerBusiness: Number(form.creditPerBusiness),
          startsAt: form.startsAt || null,
          expiresAt: form.expiresAt || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }

      setSuccess(t("Campaign created successfully", "تم إنشاء الحملة بنجاح"));

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

  function formatMoney(value, currency = "JOD") {
    return `${Number(value || 0).toFixed(2)} ${currency}`;
  }

  function statusLabel(status) {
    const labels = {
      active: t("Active", "نشطة"),
      paused: t("Paused", "متوقفة"),
      completed: t("Completed", "مكتملة"),
      cancelled: t("Cancelled", "ملغية"),
    };

    return labels[status] || status || "-";
  }

  function statusClass(status) {
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
    <div dir={isAr ? "rtl" : "ltr"} className="p-6 bg-slate-50 min-h-screen">
      <section className="bg-gradient-to-br from-slate-900 to-green-600 text-white rounded-3xl p-7 mb-6 shadow-lg">
        <div className="text-sm bg-white/15 border border-white/20 inline-block px-3 py-1 rounded-full mb-3">
          {t("Campaign Management", "إدارة الحملات")}
        </div>

        <h1 className="text-3xl font-extrabold">
          {t("Campaigns", "الحملات")}
        </h1>

        <p className="text-white/90 mt-2 max-w-2xl">
          {t(
            "Create and manage sponsorship campaigns, budgets, currencies, and business credit limits.",
            "أنشئ وأدر حملات الرعاية والميزانيات والعملات وحدود الرصيد لكل متجر."
          )}
        </p>
      </section>

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

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold">
            {t("Create New Campaign", "إنشاء حملة جديدة")}
          </h2>

          <p className="text-slate-500 text-sm mt-1">
            {t(
              "Define the campaign budget, currency, business credit amount, and campaign dates.",
              "حدد ميزانية الحملة والعملة وقيمة الرصيد لكل متجر وتواريخ الحملة."
            )}
          </p>
        </div>

        <form
          onSubmit={createCampaign}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <Field label={t("Campaign Name", "اسم الحملة")} hint={t("Example: Abdali Mall Launch", "مثال: حملة العبدلي مول")}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3"
              placeholder={t("Enter campaign name", "أدخل اسم الحملة")}
            />
          </Field>

          <Field label={t("Total Campaign Budget", "إجمالي ميزانية الحملة")} hint={t("The total amount allocated for this campaign", "المبلغ الإجمالي المخصص لهذه الحملة")}>
            <input
              type="number"
              min="1"
              value={form.totalBudget}
              onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3"
              placeholder="1000"
            />
          </Field>

          <Field label={t("Currency", "العملة")} hint={t("Currency used for budget and credits", "العملة المستخدمة للميزانية والأرصدة")}>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 bg-white"
            >
              <option value="JOD">JOD - Jordanian Dinar</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="QAR">QAR - Qatari Riyal</option>
              <option value="KWD">KWD - Kuwaiti Dinar</option>
              <option value="BHD">BHD - Bahraini Dinar</option>
              <option value="OMR">OMR - Omani Rial</option>
              <option value="EGP">EGP - Egyptian Pound</option>
              <option value="LBP">LBP - Lebanese Pound</option>
              <option value="TRY">TRY - Turkish Lira</option>
            </select>
          </Field>

          <Field label={t("Credit Per Business", "الرصيد لكل متجر")} hint={t("Amount granted when a business claims a funding code", "المبلغ الذي يحصل عليه المتجر عند تفعيل كود التمويل")}>
            <input
              type="number"
              min="1"
              value={form.creditPerBusiness}
              onChange={(e) =>
                setForm({ ...form, creditPerBusiness: e.target.value })
              }
              className="w-full border border-slate-200 rounded-xl p-3"
              placeholder="20"
            />
          </Field>

          <Field label={t("Start Date", "تاريخ البداية")} hint={t("Optional", "اختياري")}>
            <input
              type="date"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3"
            />
          </Field>

          <Field label={t("Expiry Date", "تاريخ الانتهاء")} hint={t("Optional", "اختياري")}>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3"
            />
          </Field>

          <button
            type="submit"
            disabled={creating}
            className="md:col-span-2 xl:col-span-3 bg-green-600 hover:bg-green-700 text-white rounded-xl p-3 font-semibold transition disabled:opacity-60"
          >
            {creating
              ? t("Creating...", "جاري الإنشاء...")
              : t("Create Campaign", "إنشاء الحملة")}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold">
            {t("Campaign List", "قائمة الحملات")}
          </h2>

          <p className="text-slate-500 text-sm mt-1">
            {t("Review budgets, remaining balances, and campaign status.", "راجع الميزانيات والأرصدة المتبقية وحالة الحملات.")}
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            {t("Loading...", "جاري التحميل...")}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-xl font-semibold">
              {t("No campaigns yet", "لا توجد حملات بعد")}
            </div>
            <p className="text-slate-500 mt-2">
              {t("Create your first campaign to start sponsoring businesses.", "أنشئ أول حملة للبدء برعاية المتاجر.")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b text-slate-500 text-sm">
                  <th className="py-3 text-start">{t("Campaign", "الحملة")}</th>
                  <th className="py-3 text-start">{t("Total Budget", "إجمالي الميزانية")}</th>
                  <th className="py-3 text-start">{t("Remaining", "المتبقي")}</th>
                  <th className="py-3 text-start">{t("Credit / Business", "رصيد كل متجر")}</th>
                  <th className="py-3 text-start">{t("Status", "الحالة")}</th>
                </tr>
              </thead>

              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b last:border-b-0">
                    <td className="py-4 font-semibold">{campaign.name}</td>

                    <td className="py-4">
                      {formatMoney(campaign.total_budget, campaign.currency)}
                    </td>

                    <td className="py-4">
                      {formatMoney(campaign.remaining_budget, campaign.currency)}
                    </td>

                    <td className="py-4">
                      {formatMoney(campaign.credit_per_business, campaign.currency)}
                    </td>

                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${statusClass(campaign.status)}`}>
                        {statusLabel(campaign.status)}
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

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-slate-700 mb-1">{label}</div>
      {children}
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </label>
  );
}
