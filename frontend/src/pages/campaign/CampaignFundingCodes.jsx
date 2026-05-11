import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function CampaignFundingCodes() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  const token = localStorage.getItem("campaign_token");

  const [lang, setLang] = useState(
    localStorage.getItem("campaign_lang") || "en"
  );

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

  const t = {
    en: {
      title: "Funding Codes",
      subtitle: "Generate and track sponsorship codes for your campaigns",
      back: "Back to Dashboard",
      generate: "Generate New Code",
      campaign: "Campaign",
      selectCampaign: "Select campaign",
      prefix: "Code Prefix",
      prefixHint: "Example: ABDALI",
      creditAmount: "Credit per Business",
      maxClaims: "Maximum Claims",
      expiry: "Expiry Date",
      create: "Generate Code",
      noCampaigns: "No campaigns found",
      noCampaignsDesc:
        "Create your first campaign before generating funding codes.",
      createCampaign: "Create Campaign",
      code: "Code",
      campaignName: "Campaign",
      credit: "Credit",
      usage: "Usage",
      status: "Status",
      expiryCol: "Expiry",
      noCodes: "No funding codes yet",
      noCodesDesc: "Generated codes will appear here.",
      copied: "Code copied",
      language: "العربية",
    },
    ar: {
      title: "أكواد التمويل",
      subtitle: "توليد ومتابعة أكواد الرعاية للحملات",
      back: "العودة للوحة التحكم",
      generate: "توليد كود جديد",
      campaign: "الحملة",
      selectCampaign: "اختر الحملة",
      prefix: "بادئة الكود",
      prefixHint: "مثال: ABDALI",
      creditAmount: "الرصيد لكل متجر",
      maxClaims: "الحد الأقصى للاستخدام",
      expiry: "تاريخ الانتهاء",
      create: "إنشاء الكود",
      noCampaigns: "لا توجد حملات",
      noCampaignsDesc: "أنشئ حملة أولًا قبل توليد أكواد التمويل.",
      createCampaign: "إنشاء حملة",
      code: "الكود",
      campaignName: "الحملة",
      credit: "الرصيد",
      usage: "الاستخدام",
      status: "الحالة",
      expiryCol: "الانتهاء",
      noCodes: "لا توجد أكواد بعد",
      noCodesDesc: "الأكواد التي يتم توليدها ستظهر هنا.",
      copied: "تم نسخ الكود",
      language: "English",
    },
  };

  useEffect(() => {
    localStorage.setItem("campaign_lang", lang);
  }, [lang]);

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
      setError(
        lang === "ar"
          ? "يجب اختيار حملة أولًا"
          : "Please select a campaign first"
      );
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const res = await fetch(
        `${API_BASE}/api/campaign/funding-codes/generate`,
        {
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
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate funding code");
      }

      setSuccess(
        lang === "ar"
          ? `تم إنشاء الكود: ${data.fundingCode?.code || ""}`
          : `Code generated: ${data.fundingCode?.code || ""}`
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

  function formatDate(value) {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString(lang === "ar" ? "ar-JO" : "en-US");
    } catch {
      return "-";
    }
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setSuccess(t[lang].copied);
    } catch {
      setError(lang === "ar" ? "تعذر نسخ الكود" : "Failed to copy code");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm px-6 py-4">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100"
    >
      <div className="bg-black text-white px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t[lang].title}</h1>
            <p className="text-slate-300 mt-1">{t[lang].subtitle}</p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/campaign/dashboard"
              className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-xl"
            >
              {t[lang].back}
            </Link>

            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="bg-white text-black px-4 py-2 rounded-xl"
            >
              {t[lang].language}
            </button>
          </div>
        </div>
      </div>

      <main className="p-4 md:p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4">
            {success}
          </div>
        )}

        {campaigns.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-bold text-yellow-900">{t[lang].noCampaigns}</h2>
              <p className="text-yellow-800 mt-1">{t[lang].noCampaignsDesc}</p>
            </div>

            <Link
              to="/campaign/campaigns"
              className="bg-yellow-900 text-white px-5 py-3 rounded-xl text-center"
            >
              {t[lang].createCampaign}
            </Link>
          </div>
        )}

        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">{t[lang].generate}</h2>
            <p className="text-slate-500 text-sm mt-1">
              {lang === "ar"
                ? "اختر الحملة وحدد الرصيد وعدد الاستخدامات ثم أنشئ الكود."
                : "Select a campaign, set credit and usage limits, then generate a code."}
            </p>
          </div>

          <form
            onSubmit={generateCode}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"
          >
            <Field label={t[lang].campaign}>
              <select
                value={form.campaignId}
                onChange={(e) =>
                  setForm({ ...form, campaignId: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3 bg-white"
              >
                <option value="">{t[lang].selectCampaign}</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t[lang].prefix}>
              <input
                placeholder={t[lang].prefixHint}
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </Field>

            <Field label={t[lang].creditAmount}>
              <input
                type="number"
                min="0"
                value={form.creditAmount}
                onChange={(e) =>
                  setForm({ ...form, creditAmount: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </Field>

            <Field label={t[lang].maxClaims}>
              <input
                type="number"
                min="1"
                value={form.maxClaims}
                onChange={(e) =>
                  setForm({ ...form, maxClaims: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </Field>

            <Field label={t[lang].expiry}>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
                className="w-full border border-slate-200 rounded-xl p-3"
              />
            </Field>

            <button
              type="submit"
              disabled={!form.campaignId || creating}
              className={`md:col-span-2 xl:col-span-5 rounded-xl p-3 font-semibold transition ${
                form.campaignId && !creating
                  ? "bg-black text-white hover:bg-slate-800"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
            >
              {creating ? "..." : t[lang].create}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold">{t[lang].title}</h2>
              <p className="text-slate-500 text-sm mt-1">
                {codes.length} {lang === "ar" ? "كود" : "codes"}
              </p>
            </div>
          </div>

          {codes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-lg font-semibold text-slate-700">
                {t[lang].noCodes}
              </div>
              <p className="mt-1">{t[lang].noCodesDesc}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b text-slate-500 text-sm">
                    <th className="py-3 text-start">{t[lang].code}</th>
                    <th className="py-3 text-start">{t[lang].campaignName}</th>
                    <th className="py-3 text-start">{t[lang].credit}</th>
                    <th className="py-3 text-start">{t[lang].usage}</th>
                    <th className="py-3 text-start">{t[lang].expiryCol}</th>
                    <th className="py-3 text-start">{t[lang].status}</th>
                  </tr>
                </thead>

                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-b last:border-b-0">
                      <td className="py-4">
                        <button
                          onClick={() => copyCode(c.code)}
                          className="font-bold bg-slate-100 px-3 py-2 rounded-xl hover:bg-slate-200"
                        >
                          {c.code}
                        </button>
                      </td>

                      <td className="py-4">{getCampaignName(c.campaign_id)}</td>

                      <td className="py-4">{Number(c.credit_amount || 0)}</td>

                      <td className="py-4">
                        <div className="font-medium">
                          {c.used_claims || 0}/{c.max_claims || 0}
                        </div>
                        <div className="w-28 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-black"
                            style={{
                              width: `${Math.min(
                                100,
                                ((Number(c.used_claims || 0) /
                                  Math.max(1, Number(c.max_claims || 1))) *
                                  100)
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-4">{formatDate(c.expires_at)}</td>

                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            c.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-600 mb-2">{label}</div>
      {children}
    </label>
  );
}
