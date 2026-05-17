import React, { useState } from "react";
import { Bot, Sparkles } from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function AIAssistantBox({ lang = "ar", pageContext = "dashboard" }) {
  const isAr = lang === "ar";
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");

  async function askAI() {
    try {
      setLoading(true);
      setAnswer("");

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("trustedlinks_token");

      const res = await fetch(`${API_BASE}/api/ai/merchant/assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          language: lang,
          pageContext,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "AI failed");
      }

      setAnswer(data.message || "");
    } catch (err) {
      console.error("AI Assistant Error:", err);
      setAnswer(
        isAr
          ? "تعذر تشغيل المساعد الذكي حاليًا. حاول مرة أخرى."
          : "AI Assistant failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-6 rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
            <Bot size={16} />
            {isAr ? "مساعد TrustedLinks الذكي" : "TrustedLinks AI Assistant"}
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            {isAr ? "افهم أداء نشاطك بسرعة" : "Understand your business performance"}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            {isAr
              ? "يشرح لك الرصيد، الليدز، حالة النشاط، الرعاية، ويقترح تحسينات لزيادة الظهور."
              : "Explains wallet, leads, business status, sponsorship, and gives visibility recommendations."}
          </p>
        </div>

        <button
          onClick={askAI}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sparkles size={16} />
          {loading
            ? isAr
              ? "جاري التحليل..."
              : "Analyzing..."
            : isAr
            ? "اشرح لي الصفحة"
            : "Explain this page"}
        </button>
      </div>

      {answer && (
        <div className="mt-5 whitespace-pre-line rounded-2xl border border-slate-100 bg-white p-5 text-sm leading-8 text-slate-700 shadow-sm">
          {answer}
        </div>
      )}
    </section>
  );
}
