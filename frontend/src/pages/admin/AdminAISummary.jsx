import React, { useEffect, useMemo, useState } from "react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function AdminAISummary() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState("");

  const formatNow = useMemo(() => {
    return () =>
      new Date().toLocaleString(isAr ? "ar" : "en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
  }, [isAr]);

  const fetchSummary = async () => {
    if (!token) {
      setSummary(t("⚠️ Admin token missing.", "⚠️ لا يوجد توكن أدمن."));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-summary`, {
        method: "POST",
        headers: {
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

      if (res.ok) {
        setSummary(data.summary || t("No summary returned.", "لم يتم إرجاع ملخص."));
        setTimestamp(formatNow());
      } else {
        setSummary(
          data.error ||
            t("⚠️ Failed to load AI summary.", "⚠️ فشل تحميل الملخص الذكي.")
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
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
          fontWeight: 700,
          fontSize: "18px",
        }}
      >
        🧠 {t("AI Admin Insight", "تحليل الذكاء الاصطناعي")}
      </h3>

      {loading ? (
        <p>{t("Generating smart summary...", "جارٍ إنشاء الملخص الذكي...")}</p>
      ) : (
        <p style={{ color: "#333", whiteSpace: "pre-wrap" }}>
          {summary || t("No summary yet.", "لا يوجد ملخص بعد.")}
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginTop: "10px",
          fontSize: "13px",
          color: "#666",
          flexWrap: "wrap",
        }}
      >
        <span>
          {timestamp ? `${t("Last updated:", "آخر تحديث:")} ${timestamp}` : ""}
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
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontWeight: 600,
          }}
        >
          {loading ? t("Refreshing...", "جارٍ التحديث...") : `🔄 ${t("Refresh", "تحديث")}`}
        </button>
      </div>
    </div>
  );
}
