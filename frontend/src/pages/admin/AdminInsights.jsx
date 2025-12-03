import { useEffect, useState } from "react";
import { useLang } from "../../context/LangContext.jsx";
import { Lightbulb, Sparkles, Loader2 } from "lucide-react";
import { api } from "../../utils/api";

export default function AdminInsights() {
  const { lang } = useLang();
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .insights()
      .then((res) => setInsight(res))
      .catch(() => setError(t("Failed to load AI insights.", "فشل تحميل تحليلات الذكاء الاصطناعي.")))
      .finally(() => setLoading(false));
  }, [lang]);

  return (
    <div
      className={`space-y-6 ${
        lang === "ar" ? "text-right" : "text-left"
      } transition-all`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="text-green-600 w-6 h-6" />
        <h2 className="text-xl md:text-2xl font-semibold">
          {t("AI Insights", "تحليلات الذكاء الاصطناعي")}
        </h2>
      </div>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed">
        {t(
          "Auto-generated summaries & recommendations will appear here.",
          "سيتم عرض الملخصات والتوصيات التي يتم إنشاؤها تلقائيًا هنا."
        )}
      </p>

      {/* Main content */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[180px] flex flex-col items-center justify-center text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            <p>{t("Loading insights...", "جارٍ تحميل التحليلات...")}</p>
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : insight ? (
          <>
            <Lightbulb className="w-10 h-10 text-green-500 mb-3" />
            <p className="max-w-lg text-gray-700 leading-relaxed text-sm md:text-base">
              {insight.insight ||
                t(
                  "No insights available yet.",
                  "لا توجد تحليلات متاحة حاليًا."
                )}
            </p>
          </>
        ) : (
          <div className="text-gray-500">
            <Lightbulb className="w-10 h-10 text-green-500 mb-3" />
            <p className="max-w-md text-sm">
              {t(
                "Your AI-powered business insights will be displayed once available.",
                "ستظهر تحليلات أعمالك المدعومة بالذكاء الاصطناعي بمجرد توفرها."
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
