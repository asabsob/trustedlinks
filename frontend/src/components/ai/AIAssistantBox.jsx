import React, { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import AIInsightCards from "./AIInsightCards";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function AIAssistantBox({
  lang = "ar",
  pageContext = "dashboard",
}) {
  const isAr = lang === "ar";
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [insights, setInsights] = useState([]);

async function askAI(customQuestion = "") {
  try {
    setLoading(true);
    setAnswer("");

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("trustedlinks_token");

    if (!token) {
      setAnswer(isAr ? "يرجى تسجيل الدخول أولًا." : "Please login first.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/ai/merchant/assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        language: lang,
        pageContext,
        question: customQuestion,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "AI failed");
    }

    setAnswer(data.message || "");
    setInsights(data.insights || []);
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
    <section style={boxStyle}>
      <div style={topRowStyle}>
        <div>
          <div style={badgeStyle}>
            <Bot size={16} />
            {isAr ? "مساعد TrustedLinks الذكي" : "TrustedLinks AI Assistant"}
          </div>

          <h3 style={titleStyle}>
            {isAr
              ? "افهم أداء نشاطك بسرعة"
              : "Understand your business performance"}
          </h3>

          <p style={descStyle}>
            {isAr
              ? "يشرح لك الرصيد، الليدز، حالة النشاط، الرعاية، ويقترح تحسينات لزيادة الظهور."
              : "Explains wallet, leads, business status, sponsorship, and gives visibility recommendations."}
          </p>
        </div>

        <button
          onClick={askAI}
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.65 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
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

      <div style={quickActionsStyle}>
  {[
    isAr ? "ماذا أفعل في هذه الصفحة؟" : "What can I do on this page?",
    isAr ? "اشرح الأداء" : "Explain performance",
    isAr ? "كيف أزيد العملاء؟" : "How can I get more customers?",
    isAr ? "لماذا الليدز منخفضة؟" : "Why are leads low?",
    isAr ? "كيف أظهر أكثر في البحث؟" : "How can I appear more in search?",
    isAr ? "اشرح الرصيد" : "Explain wallet balance",
  ].map((q) => (
    <button
      key={q}
      type="button"
      onClick={() => askAI(q)}
      disabled={loading}
      style={quickActionBtnStyle}
    >
      {q}
    </button>
  ))}
</div>

      <AIInsightCards insights={insights} lang={lang} />

      {answer && <div style={answerStyle}>{answer}</div>}
    </section>
  );
}

const boxStyle = {
  marginBottom: 22,
  padding: 22,
  borderRadius: 20,
  border: "1px solid #bbf7d0",
  background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
  boxShadow: "0 8px 24px rgba(22, 163, 74, 0.08)",
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  flexWrap: "wrap",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#dcfce7",
  color: "#166534",
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 12,
};

const titleStyle = {
  margin: "0 0 8px",
  fontSize: 22,
  fontWeight: 800,
  color: "#111827",
};

const descStyle = {
  margin: 0,
  maxWidth: 720,
  fontSize: 14,
  lineHeight: 1.8,
  color: "#4b5563",
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: "none",
  borderRadius: 14,
  background: "#16a34a",
  color: "#fff",
  padding: "12px 18px",
  fontSize: 14,
  fontWeight: 800,
};

const answerStyle = {
  marginTop: 18,
  whiteSpace: "pre-line",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  fontSize: 14,
  lineHeight: 2,
  color: "#374151",
};

const quickActionsStyle = {
  marginTop: 18,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const quickActionBtnStyle = {
  border: "1px solid #bbf7d0",
  background: "#fff",
  color: "#166534",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
