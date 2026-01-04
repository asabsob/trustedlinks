import React, { useEffect, useState } from "react";
import { useLang } from "../../context/LangContext.jsx";

export default function AdminAISummary() {
  const { lang } = useLang();
  const t = (en, ar) => (lang === "ar" ? ar : en);

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5175/api/admin/ai-summary", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admintoken") || ""}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setTimestamp(new Date().toLocaleString());
      } else {
        setSummary(t("⚠️ Failed to load AI summary.", "⚠️ فشل تحميل الملخص الذكي."));
      }
    } catch (err) {
      console.error(err);
      setSummary(t("⚠️ Error fetching summary.", "⚠️ حدث خطأ أثناء جلب الملخص."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        marginBottom: "24px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h3
        style={{
          color: "#22c55e",
          marginBottom: "10px",
          fontWeight: 600,
          fontSize: "18px",
        }}
      >
        🧠 {t("AI Admin Insight", "تحليل الذكاء الاصطناعي")}
      </h3>

      {loading ? (
        <p>{t("Generating smart summary...", "جارٍ إنشاء الملخص الذكي...")}</p>
      ) : (
        <p style={{ color: "#333", whiteSpace: "pre-wrap" }}>{summary}</p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
          fontSize: "13px",
          color: "#666",
        }}
      >
        <span>
          {timestamp
            ? `${t("Last updated:", "آخر تحديث:")} ${timestamp}`
            : ""}
        </span>
        <button
          onClick={fetchSummary}
          disabled={loading}
          style={{
            background: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          {loading ? t("Refreshing...", "جارٍ التحديث...") : "🔄 " + t("Refresh", "تحديث")}
        </button>
      </div>
    </div>
  );
}