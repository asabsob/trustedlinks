import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function AIOperationsOverview({
  lang = "ar",
}) {
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    alerts: [],
    summary: "",
    stats: {},
  });

  useEffect(() => {
    loadAIHealth();
  }, []);

  async function loadAIHealth() {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("admin_token");

      const res = await fetch(
        `${API_BASE}/api/ai/admin/system-health?language=${lang}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json();

      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("AI OPS LOAD ERROR", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === "ar"
              ? "مركز عمليات الذكاء الاصطناعي"
              : "AI Operations Center"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {lang === "ar"
              ? "مراقبة صحة النظام والتنبيهات الذكية"
              : "Monitor platform health and AI alerts"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-sm text-slate-500">
          Loading AI Operations...
        </div>
      ) : (
        <>
          {/* Summary */}

          <div className="mb-6 rounded-2xl bg-slate-50 p-5">
            <div className="mb-2 text-sm font-bold text-slate-700">
              {lang === "ar"
                ? "ملخص النظام"
                : "System Summary"}
            </div>

            <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
              {data.summary}
            </div>
          </div>

          {/* Alerts */}

          <div className="grid gap-4 md:grid-cols-2">
            {data.alerts?.map((alert, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="mb-2 text-sm font-bold text-red-600">
                  {lang === "ar"
                    ? alert.title_ar
                    : alert.title_en}
                </div>

                <div className="text-sm leading-6 text-slate-600">
                  {lang === "ar"
                    ? alert.message_ar
                    : alert.message_en}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
