import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignFundingCodes({ lang = "en" }) {
  const isAr = lang === "ar";
  const token = localStorage.getItem("campaign_token");

  const [campaigns, setCampaigns] = useState([]);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    campaignId: "",
    prefix: "",
    creditAmount: 20,
    maxClaims: 100,
    expiresAt: "",
  });

  const t = (en, ar) => (isAr ? ar : en);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [campaignsRes, codesRes] = await Promise.all([
        fetch(`${API_BASE}/api/campaign/campaigns`, { headers }),
        fetch(`${API_BASE}/api/campaign/funding-codes`, { headers }),
      ]);

      const campaignsData = await campaignsRes.json();
      const codesData = await codesRes.json();

      if (!campaignsRes.ok) {
        throw new Error(campaignsData.error || "Failed to load campaigns");
      }

      if (!codesRes.ok) {
        throw new Error(codesData.error || "Failed to load funding codes");
      }

      const loadedCampaigns = campaignsData.campaigns || [];

      setCampaigns(loadedCampaigns);
      setCodes(codesData.fundingCodes || []);

      if (loadedCampaigns.length === 1 && !form.campaignId) {
        setForm((prev) => ({
          ...prev,
          campaignId: loadedCampaigns[0].id,
        }));
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function generateCode(e) {
    e.preventDefault();

    if (!form.campaignId) {
      setError(t("Please select a campaign first", "يرجى اختيار حملة أولًا"));
      return;
    }

    if (!form.creditAmount || Number(form.creditAmount) <= 0) {
      setError(
        t(
          "Credit amount must be greater than zero",
          "يجب أن يكون مبلغ الرصيد أكبر من صفر"
        )
      );
      return;
    }

    if (!form.maxClaims || Number(form.maxClaims) <= 0) {
      setError(
        t(
          "Maximum claims must be greater than zero",
          "يجب أن يكون الحد الأقصى للاستخدام أكبر من صفر"
        )
      );
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${API_BASE}/api/campaign/funding-codes/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId: form.campaignId,
          prefix: form.prefix || "CAMPAIGN",
          creditAmount: Number(form.creditAmount || 20),
          maxClaims: Number(form.maxClaims || 100),
          expiresAt: form.expiresAt || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate funding code");
      }

      setSuccess(
        t(
          `Code generated: ${data.fundingCode?.code || ""}`,
          `تم إنشاء الكود: ${data.fundingCode?.code || ""}`
        )
      );

      setForm((prev) => ({
        ...prev,
        prefix: "",
        creditAmount: 20,
        maxClaims: 100,
        expiresAt: "",
      }));

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to generate code");
    } finally {
      setCreating(false);
    }
  }

  function getCampaignName(campaignId) {
    return campaigns.find((c) => c.id === campaignId)?.name || "-";
  }

  function getCampaignCurrency(campaignId) {
    return campaigns.find((c) => c.id === campaignId)?.currency || "JOD";
  }

  function formatDate(value) {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleDateString(isAr ? "ar-JO" : "en-US");
    } catch {
      return "-";
    }
  }

  function statusLabel(status) {
    if (status === "active") return t("Active", "نشط");
    if (status === "paused") return t("Paused", "متوقف");
    if (status === "expired") return t("Expired", "منتهي");
    if (status === "disabled") return t("Disabled", "معطل");

    return status || "-";
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setSuccess(t("Code copied", "تم نسخ الكود"));
    } catch {
      setError(t("Failed to copy code", "تعذر نسخ الكود"));
    }
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-6 bg-slate-50 min-h-screen">
      <section className="bg-gradient-to-br from-slate-900 to-green-600 text-white rounded-3xl p-7 mb-6 shadow-lg">
        <div className="text-sm bg-white/15 border border-white/20 inline-block px-3 py-1 rounded-full mb-3">
          {t("Campaign Management", "إدارة الحملات")}
        </div>

        <h1 className="text-3xl font-extrabold">
          {t("Funding Codes", "أكواد التمويل")}
        </h1>

        <p className="text-white/90 mt-2 max-w-2xl">
          {t(
            "Generate campaign funding codes and track how businesses use them.",
            "أنشئ أكواد تمويل للحملات وتابع استخدام المتاجر لها."
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

      {campaigns.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-bold text-yellow-900">
              {t("No campaigns found", "لا توجد حملات")}
            </h2>

            <p className="text-yellow-800 mt-1">
              {t(
                "Create your first campaign before generating funding codes.",
                "أنشئ حملة أولًا قبل توليد أكواد التمويل."
              )}
            </p>
          </div>

          <Link
            to="/campaign/campaigns"
            className="bg-yellow-900 text-white px-5 py-3 rounded-xl text-center"
          >
            {t("Create Campaign", "إنشاء حملة")}
          </Link>
        </div>
      )}

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold">
            {t("Generate New Funding Code", "توليد كود تمويل جديد")}
          </h2>

          <p className="text-slate-500 text-sm mt-1">
            {t(
              "Select a campaign, define the credit amount, maximum claims, and optional expiry date.",
              "اختر الحملة وحدد مبلغ الرصيد والحد الأقصى للاستخدام وتاريخ انتهاء اختياري."
            )}
          </p>
        </div>

        <form
          onSubmit={generateCode}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"
        >
          <Field
            label={t("Campaign", "الحملة")}
            hint={t(
              "The code will be linked to this campaign",
              "سيتم ربط الكود بهذه الحملة"
            )}
          >
            <select
              value={form.campaignId}
              onChange={(e) =>
                setForm({
                  ...form,
                  campaignId: e.target.value,
                })
              }
              className="w-full border border-slate-200 rounded-xl p-3 bg-white"
            >
              <option value="">
                {t("Select campaign", "اختر الحملة")}
              </option>

              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={t("Code Prefix", "بادئة الكود")}
            hint={t(
              "Example: ABDALI. The system will generate the rest automatically.",
              "مثال: ABDALI. سيقوم النظام بتوليد باقي الكود تلقائيًا."
            )}
          >
            <input
              placeholder="ABDALI"
              value={form.prefix}
              onChange={(e) =>
                setForm({
                  ...form,
                  prefix: e.target.value.toUpperCase(),
                })
              }
              className="w-full border border-slate-200 rounded-xl p-3"
            />
          </Field>

          <Field
            label={t("Credit Amount", "مبلغ الرصيد")}
            hint={t(
              "Amount added to the business wallet after claiming the code",
              "المبلغ الذي يضاف إلى محفظة المتجر بعد تفعيل الكود"
            )}
          >
            <input
              type="number"
              min="1"
              value={form.creditAmount}
              onChange={(e) =>
                setForm({
                  ...form,
                  creditAmount: e.target.value,
                })
              }
              className="w-full border border-slate-200 rounded-xl p-3"
            />
          </Field>

          <Field
            label={t("Maximum Claims", "الحد الأقصى للاستخدام")}
            hint={t(
              "How many businesses can use this code",
              "عدد المتاجر التي يمكنها استخدام هذا الكود"
            )}
          >
            <input
              type="number"
              min="1"
              value={form.maxClaims}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxClaims: e.target.value,
                })
              }
              className="w-full border border-slate-200 rounded-xl p-3"
            />
          </Field>

          <Field
            label={t("Expiry Date", "تاريخ الانتهاء")}
            hint={t("Optional", "اختياري")}
          >
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) =>
                setForm({
                  ...form,
                  expiresAt: e.target.value,
                })
              }
              className="w-full border border-slate-200 rounded-xl p-3"
            />
          </Field>

          <button
            type="submit"
            disabled={!form.campaignId || creating}
            className={`md:col-span-2 xl:col-span-5 rounded-xl p-3 font-semibold transition ${
              form.campaignId && !creating
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-slate-200 text-slate-500 cursor-not-allowed"
            }`}
          >
            {creating
              ? t("Generating...", "جاري التوليد...")
              : t("Generate Code", "توليد الكود")}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold">
            {t("Generated Funding Codes", "أكواد التمويل المولدة")}
          </h2>

          <p className="text-slate-500 text-sm mt-1">
            {codes.length} {t("codes generated", "كود تم توليده")}
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">
            {t("Loading...", "جاري التحميل...")}
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-lg font-semibold text-slate-700">
              {t("No funding codes yet", "لا توجد أكواد بعد")}
            </div>

            <p className="mt-1">
              {t(
                "Generated codes will appear here.",
                "الأكواد التي يتم توليدها ستظهر هنا."
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead>
                <tr className="border-b text-slate-500 text-sm">
                  <th className="py-3 text-start">
                    {t("Code", "الكود")}
                  </th>

                  <th className="py-3 text-start">
                    {t("Campaign", "الحملة")}
                  </th>

                  <th className="py-3 text-start">
                    {t("Credit", "الرصيد")}
                  </th>

                  <th className="py-3 text-start">
                    {t("Usage", "الاستخدام")}
                  </th>

                  <th className="py-3 text-start">
                    {t("Expiry", "الانتهاء")}
                  </th>

                  <th className="py-3 text-start">
                    {t("Status", "الحالة")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {codes.map((code) => {
                  const usedClaims = Number(code.used_claims || 0);
                  const maxClaims = Number(code.max_claims || 1);
                  const usagePercent = Math.min(
                    100,
                    (usedClaims / Math.max(1, maxClaims)) * 100
                  );

                  const currency = getCampaignCurrency(code.campaign_id);

                  return (
                    <tr key={code.id} className="border-b last:border-b-0">
                      <td className="py-4">
                        <button
                          type="button"
                          onClick={() => copyCode(code.code)}
                          className="font-bold bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200"
                          title={t("Click to copy", "اضغط للنسخ")}
                        >
                          {code.code}
                        </button>
                      </td>

                      <td className="py-4">
                        {getCampaignName(code.campaign_id)}
                      </td>

                      <td className="py-4">
                        {Number(code.credit_amount || 0).toFixed(2)} {currency}
                      </td>

                      <td className="py-4">
                        <div className="font-medium">
                          {usedClaims}/{maxClaims}
                        </div>

                        <div className="w-32 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-green-600"
                            style={{
                              width: `${usagePercent}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-4">
                        {formatDate(code.expires_at)}
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            code.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {statusLabel(code.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
