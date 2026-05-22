import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Wallet,
  Bot,
  RefreshCw,
  Activity,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function AIOperationsOverview({ lang = "ar" }) {
  const isAr = lang === "ar";

  const [loading, setLoading] = useState(true);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [data, setData] = useState({
    alerts: [],
    summary: "",
    stats: {},
  });

  const [dailySummary, setDailySummary] = useState("");

  useEffect(() => {
    loadAIHealth();
  }, [lang]);

  async function getAdminToken() {
    return (
      localStorage.getItem("admin_token") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token")
    );
  }

  async function loadAIHealth() {
    try {
      setLoading(true);

      const token = await getAdminToken();

      const res = await fetch(
        `${API_BASE}/api/ai/admin/system-health?language=${lang}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json().catch(() => ({}));

      if (json.success) {
        setData({
          alerts: json.alerts || [],
          summary: json.summary || "",
          stats: json.stats || {},
        });
      }
    } catch (err) {
      console.error("AI OPS LOAD ERROR", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDailySummary() {
    try {
      setDailyLoading(true);

      const token = await getAdminToken();

      const res = await fetch(
        `${API_BASE}/api/ai/admin/daily-summary?language=${lang}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json().catch(() => ({}));

      if (json.success) {
        setDailySummary(json.summary || "");
      }
    } catch (err) {
      console.error("AI DAILY SUMMARY ERROR", err);
    } finally {
      setDailyLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-bold text-green-700">
            <Bot size={16} />
            {isAr ? "نظام عمليات الذكاء الاصطناعي" : "AI Operations System"}
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            {isAr ? "مركز عمليات الذكاء الاصطناعي" : "AI Operations Center"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {isAr
              ? "مراقبة صحة النظام، التنبيهات، المخاطر، والإشارات غير الطبيعية."
              : "Monitor platform health, alerts, risks, and abnormal signals."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadAIHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            {isAr ? "تحديث" : "Refresh"}
          </button>

          <button
            onClick={loadDailySummary}
            disabled={dailyLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Activity size={15} />
            {dailyLoading
              ? isAr
                ? "جاري التوليد..."
                : "Generating..."
              : isAr
              ? "ملخص اليوم بالذكاء الاصطناعي"
              : "Generate Daily AI Summary"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
          {isAr ? "جاري تحميل مركز العمليات..." : "Loading AI Operations..."}
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label={isAr ? "الأنشطة" : "Businesses"}
              value={data.stats?.businessesCount || 0}
            />
            <StatCard
              label={isAr ? "فتح الروابط" : "Lead Clicks"}
              value={data.stats?.recentLeadClicks || 0}
            />
            <StatCard
              label={isAr ? "طلبات مدفوعة" : "Paid Leads"}
              value={data.stats?.paidLeadClicks || 0}
            />
            <StatCard
              label={isAr ? "الحركات" : "Transactions"}
              value={data.stats?.recentTransactions || 0}
            />
          </div>

          <div className="mb-6 rounded-2xl bg-slate-50 p-5">
            <div className="mb-2 text-sm font-bold text-slate-700">
              {isAr ? "ملخص صحة النظام" : "System Health Summary"}
            </div>

            <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
              {data.summary ||
                (isAr
                  ? "لا يوجد ملخص متاح حاليًا."
                  : "No summary available yet.")}
            </div>
          </div>

          {dailySummary && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-2 text-sm font-bold text-green-800">
                {isAr ? "الملخص اليومي" : "Daily AI Summary"}
              </div>

              <div className="whitespace-pre-line text-sm leading-7 text-green-900">
                {dailySummary}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-4 text-lg font-bold text-slate-900">
              {isAr ? "التنبيهات الذكية" : "AI Alerts"}
            </h3>

            {data.alerts?.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.alerts.map((alert, idx) => (
                  <AlertCard key={idx} alert={alert} lang={lang} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
                {isAr
                  ? "لا توجد تنبيهات حرجة حاليًا."
                  : "No critical alerts at the moment."}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function AlertCard({ alert, lang }) {
  const isAr = lang === "ar";
  const title = isAr ? alert.title_ar || alert.title : alert.title_en || alert.title;
  const message = isAr
    ? alert.message_ar || alert.message
    : alert.message_en || alert.message;

  const type = alert.type || "system";

  const icon =
    type === "fraud" ? (
      <ShieldAlert size={20} />
    ) : type === "wallet" ? (
      <Wallet size={20} />
    ) : (
      <AlertTriangle size={20} />
    );

  const isCritical =
    alert.level === "high" ||
    alert.severity === "high" ||
    alert.severity === "critical";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isCritical
          ? "border-red-200 bg-red-50"
          : "border-yellow-200 bg-yellow-50"
      }`}
    >
      <div
        className={`mb-2 flex items-center gap-2 text-sm font-bold ${
          isCritical ? "text-red-700" : "text-yellow-800"
        }`}
      >
        {icon}
        {title}
      </div>

      <div className="text-sm leading-6 text-slate-700">{message}</div>
    </div>
  );
}
