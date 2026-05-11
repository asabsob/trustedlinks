import { useEffect, useState } from "react";

export default function CampaignFundingCodes() {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "";

  const token =
    localStorage.getItem("campaign_token");

  const [lang, setLang] = useState(
    localStorage.getItem("campaign_lang") ||
      "en"
  );

  const [campaigns, setCampaigns] =
    useState([]);

  const [codes, setCodes] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

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

      generate:
        "Generate Funding Code",

      campaign: "Campaign",

      prefix: "Code Prefix",

      creditAmount:
        "Credit Amount",

      maxClaims:
        "Maximum Claims",

      expiry: "Expiry Date",

      create: "Generate Code",

      code: "Code",

      usage: "Usage",

      status: "Status",

      noCodes:
        "No funding codes found",

      language: "العربية",
    },

    ar: {
      title: "أكواد التمويل",

      generate:
        "توليد كود تمويل",

      campaign: "الحملة",

      prefix: "بادئة الكود",

      creditAmount:
        "قيمة الرصيد",

      maxClaims:
        "الحد الأقصى للاستخدام",

      expiry:
        "تاريخ الانتهاء",

      create: "إنشاء الكود",

      code: "الكود",

      usage:
        "عدد الاستخدامات",

      status: "الحالة",

      noCodes:
        "لا توجد أكواد",

      language: "English",
    },
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [campaignsRes, codesRes] =
        await Promise.all([
          fetch(
            `${API_BASE}/api/campaign/campaigns`,
            { headers }
          ),

          fetch(
            `${API_BASE}/api/campaign/funding-codes`,
            { headers }
          ),
        ]);

      const campaignsData =
        await campaignsRes.json();

      const codesData =
        await codesRes.json();

      setCampaigns(
        campaignsData.campaigns || []
      );

      setCodes(
        codesData.fundingCodes || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateCode(e) {
    e.preventDefault();

    try {
      setError("");

      const res = await fetch(
        `${API_BASE}/api/campaign/funding-codes/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to generate code"
        );
      }

      setForm({
        campaignId: "",
        prefix: "",
        creditAmount: 20,
        maxClaims: 100,
        expiresAt: "",
      });

      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100"
    >
      {/* HEADER */}
      <div className="bg-black text-white px-6 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {t[lang].title}
        </h1>

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
        {/* FORM */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-5">
            {t[lang].generate}
          </h2>

          <form
            onSubmit={generateCode}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"
          >
            <select
              value={form.campaignId}
              onChange={(e) =>
                setForm({
                  ...form,
                  campaignId:
                    e.target.value,
                })
              }
              className="border rounded-xl p-3"
            >
              <option value="">
                {t[lang].campaign}
              </option>

              {campaigns.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>

            <input
              placeholder={
                t[lang].prefix
              }
              value={form.prefix}
              onChange={(e) =>
                setForm({
                  ...form,
                  prefix:
                    e.target.value,
                })
              }
              className="border rounded-xl p-3"
            />

            <input
              type="number"
              placeholder={
                t[lang]
                  .creditAmount
              }
              value={
                form.creditAmount
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  creditAmount:
                    e.target.value,
                })
              }
              className="border rounded-xl p-3"
            />

            <input
              type="number"
              placeholder={
                t[lang].maxClaims
              }
              value={
                form.maxClaims
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  maxClaims:
                    e.target.value,
                })
              }
              className="border rounded-xl p-3"
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
              className="border rounded-xl p-3"
            />

            <button
              type="submit"
              className="bg-black text-white rounded-xl p-3 xl:col-span-5"
            >
              {t[lang].create}
            </button>
          </form>

          {error && (
            <div className="text-red-500 mt-4">
              {error}
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-3">
                    {t[lang].code}
                  </th>

                  <th className="py-3">
                    {t[lang].campaign}
                  </th>

                  <th className="py-3">
                    {t[lang]
                      .creditAmount}
                  </th>

                  <th className="py-3">
                    {t[lang].usage}
                  </th>

                  <th className="py-3">
                    {t[lang].status}
                  </th>
                </tr>
              </thead>

              <tbody>
                {!codes.length && (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-8 text-center text-slate-500"
                    >
                      {
                        t[lang]
                          .noCodes
                      }
                    </td>
                  </tr>
                )}

                {codes.map((c) => {
                  const campaign =
                    campaigns.find(
                      (x) =>
                        x.id ===
                        c.campaign_id
                    );

                  return (
                    <tr
                      key={c.id}
                      className="border-b"
                    >
                      <td className="py-4 font-semibold">
                        {c.code}
                      </td>

                      <td className="py-4">
                        {campaign?.name ||
                          "-"}
                      </td>

                      <td className="py-4">
                        {
                          c.credit_amount
                        }
                      </td>

                      <td className="py-4">
                        {
                          c.used_claims
                        }
                        /
                        {
                          c.max_claims
                        }
                      </td>

                      <td className="py-4">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
