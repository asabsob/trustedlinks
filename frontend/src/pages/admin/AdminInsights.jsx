import React, { useEffect, useMemo, useState } from "react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { Lightbulb, Sparkles, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function AdminInsights() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";
  const t = useMemo(
    () => ({
      title: isAr ? "تحليلات الذكاء الاصطناعي" : "AI Insights",
      desc: isAr
        ? "سيتم عرض الملخصات والتوصيات التي يتم إنشاؤها تلقائيًا هنا."
        : "Auto-generated summaries & recommendations will appear here.",
      loading: isAr ? "جارٍ تحميل التحليلات..." : "Loading insights...",
      needLogin: isAr ? "أنت غير مسجل دخول كأدمن." : "You are not logged in as admin.",
      failed: isAr ? "فشل تحميل تحليلات الذكاء الاصطناعي." : "Failed to load AI insights.",
      empty: isAr ? "لا توجد تحليلات متاحة حاليًا." : "No insights available yet.",
      hint: isAr
        ? "ستظهر تحليلات أعمالك المدعومة بالذكاء الاصطناعي بمجرد توفرها."
        : "Your AI-powered business insights will be displayed once available.",
    }),
    [isAr]
  );

  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setInsight(null);

      if (!token) {
        setError(t.needLogin);
        setLoading(false);
        return;
      }

      try {
        // NOTE: endpoint حسب كودك القديم "api.insights()" غالباً بيروح لـ /api/admin/insights
        // إذا عندك اسم مختلف غيّره هنا فقط:
        const res = await fetch(`${API_BASE}/api/admin/insights`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const txt = await res.text();
        let data = {};
        try {
          data = JSON.parse(txt);
        } catch {
          data = {};
        }

        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        // Normalize possible shapes:
        // { insight: "..." } or { data: { insight: "..." } } or { summary: "..." }
        const normalized =
          data?.insight ??
          data?.summary ??
          data?.data?.insight ??
          data?.data?.summary ??
          "";

        if (!cancelled) setInsight({ insight: normalized });
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message || t.failed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, t, lang]);

  return (
    <div
      className={`space-y-6 ${isAr ? "text-right" : "text-left"} transition-all`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="text-green-600 w-6 h-6" />
        <h2 className="text-xl md:text-2xl font-semibold">{t.title}</h2>
      </div>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed">{t.desc}</p>

      {/* Main content */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col items-center justify-center text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            <p>{t.loading}</p>
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : insight?.insight ? (
          <>
            <Lightbulb className="w-10 h-10 text-green-500 mb-3" />
            <p className="max-w-lg text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
              {insight.insight}
            </p>
          </>
        ) : (
          <div className="text-gray-500">
            <Lightbulb className="w-10 h-10 text-green-500 mb-3" />
            <p className="max-w-md text-sm">{t.empty}</p>
            <p className="max-w-md text-xs mt-2">{t.hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
