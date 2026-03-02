import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function Subscribe({ lang }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const t = (en, ar) => (lang === "ar" ? ar : en);

  const handleSubscribe = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert(t("Please log in first.", "يرجى تسجيل الدخول أولاً."));
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);

      // ✅ activate subscription on backend
      const res = await fetch(`${API_BASE}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // optional payload if you have plans
        body: JSON.stringify({ plan: "monthly" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || t("Subscription failed.", "فشل تفعيل الاشتراك."));
        return;
      }

      alert(t("Subscription activated successfully!", "تم تفعيل الاشتراك بنجاح!"));
      navigate("/dashboard", { replace: true });
    } catch (e) {
      alert(t("Network error. Try again.", "خطأ بالشبكة. حاول مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        background: "#f9fafb",
        minHeight: "100vh",
        direction: lang === "ar" ? "rtl" : "ltr",
        fontFamily: lang === "ar" ? "Tajawal, sans-serif" : "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          maxWidth: "500px",
          margin: "0 auto",
          borderRadius: "16px",
          padding: "40px 30px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
        {/* 🎁 Free Trial Badge */}
        <div
          style={{
            position: "absolute",
            top: "-14px",
            right: lang === "ar" ? "auto" : "20px",
            left: lang === "ar" ? "20px" : "auto",
            background: "#22c55e",
            color: "white",
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {lang === "ar" ? "تجربة مجانية لمدة شهرين" : "2-Month Free Trial"}
        </div>

        <h2 style={{ color: "#22c55e", marginBottom: "8px", marginTop: "20px" }}>
          {lang === "ar" ? "خطة الاشتراك الشهرية" : "Monthly Subscription Plan"}
        </h2>

        <p style={{ color: "#555", marginBottom: "30px", fontSize: "15px" }}>
          {lang === "ar"
            ? "ابدأ رحلتك مجانًا واستفد من ميزات لوحة التحكم، وإدارة الروابط، والتقارير الذكية."
            : "Start your journey free and enjoy full access to your Dashboard, Link Management, and Smart Reports."}
        </p>

        {/* 💰 Price Box */}
        <div style={{ fontSize: "42px", fontWeight: "700", color: "#111", marginBottom: "5px" }}>
          15 JOD
        </div>

        <p style={{ color: "#777", fontSize: "14px", marginBottom: "25px" }}>
          {lang === "ar" ? "يبدأ الدفع بعد الشهرين المجانيين" : "Billing starts after 2 months"}
        </p>

        {/* ✅ Features */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            textAlign: lang === "ar" ? "right" : "left",
            marginBottom: "30px",
            lineHeight: "1.8",
            color: "#444",
          }}
        >
          <li>✅ {lang === "ar" ? "إدارة نشاطك التجاري" : "Manage your business profile"}</li>
          <li>✅ {lang === "ar" ? "تحكم في روابط واتساب الخاصة بك" : "Control your WhatsApp links"}</li>
          <li>✅ {lang === "ar" ? "احصل على تقارير وتحليلات أسبوعية" : "Receive weekly insights & reports"}</li>
        </ul>

        {/* 🌿 Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          style={{
            background: "#22c55e",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px 40px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "background 0.3s ease",
          }}
        >
          {loading ? t("Activating…", "جارٍ التفعيل...") : lang === "ar" ? "اشترك الآن" : "Subscribe Now"}
        </button>

        <p style={{ marginTop: "18px", color: "#888", fontSize: "13px" }}>
          {lang === "ar"
            ? "لن يتم خصم أي رسوم خلال فترة التجربة المجانية."
            : "No charges will be made during the free trial period."}
        </p>
      </div>
    </div>
  );
}
