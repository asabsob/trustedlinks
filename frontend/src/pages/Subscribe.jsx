// ============================================================================
// Subscribe Page
// 1) Requires logged-in user
// 2) Activates plan
// 3) Publishes business using pendingBusiness + otpToken
// ============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function Subscribe({ lang = "en" }) {
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

    const pendingRaw = localStorage.getItem("pendingBusiness");
    const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
    const otpToken = localStorage.getItem("otpToken") || pending?.otpToken || "";

    if (!pending) {
      alert(
        t(
          "Business information is missing. Please complete registration first.",
          "بيانات النشاط غير موجودة. يرجى إكمال التسجيل أولاً."
        )
      );
      navigate("/signup", { replace: true });
      return;
    }

    if (!otpToken) {
      alert(t("WhatsApp verification is missing.", "توثيق واتساب غير موجود."));
      navigate("/signup", { replace: true });
      return;
    }

    try {
      setLoading(true);

      // 1) activate subscription
      const subRes = await fetch(`${API_BASE}/api/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: "monthly" }),
      });

      const subData = await subRes.json().catch(() => ({}));
      if (!subRes.ok) {
        alert(subData?.error || t("Subscription failed.", "فشل تفعيل الاشتراك."));
        return;
      }

      // 2) publish business
      const publishRes = await fetch(`${API_BASE}/api/business/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-otp-token": otpToken,
        },
        body: JSON.stringify({
          name: pending.nameEn?.trim() || pending.nameAr?.trim(),
          name_ar: pending.nameAr?.trim() || "",
          description: pending.description?.trim() || "",
          category: pending.categoryKey ? [pending.categoryKey] : [],
          mapLink: pending.mapLink || "",
          mediaLink: pending.mediaLink || "",
        }),
      });

      const publishData = await publishRes.json().catch(() => ({}));
      if (!publishRes.ok) {
        alert(
          publishData?.error ||
            t("Business publish failed.", "فشل نشر النشاط التجاري.")
        );
        return;
      }

      // cleanup draft after successful publish
      localStorage.removeItem("pendingBusiness");
      localStorage.removeItem("otpToken");

      alert(
        t(
          "Subscription activated and business submitted successfully.",
          "تم تفعيل الاشتراك وإرسال النشاط بنجاح."
        )
      );

      navigate("/dashboard", { replace: true });
    } catch (e) {
      alert(t("Network error. Please try again.", "خطأ في الشبكة. حاول مرة أخرى."));
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
          {t("2-Month Free Trial", "تجربة مجانية لمدة شهرين")}
        </div>

        <h2 style={{ color: "#22c55e", marginBottom: "8px", marginTop: "20px" }}>
          {t("Monthly Subscription Plan", "خطة الاشتراك الشهرية")}
        </h2>

        <p style={{ color: "#555", marginBottom: "30px", fontSize: "15px" }}>
          {t(
            "Start your journey free and enjoy full access to your Dashboard, Link Management, and Smart Reports.",
            "ابدأ رحلتك مجانًا واستفد من ميزات لوحة التحكم، وإدارة الروابط، والتقارير الذكية."
          )}
        </p>

        <div
          style={{
            fontSize: "42px",
            fontWeight: "700",
            color: "#111",
            marginBottom: "5px",
          }}
        >
          15 JOD
        </div>

        <p style={{ color: "#777", fontSize: "14px", marginBottom: "25px" }}>
          {t("Billing starts after 2 months", "يبدأ الدفع بعد الشهرين المجانيين")}
        </p>

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
          <li>✅ {t("Manage your business profile", "إدارة نشاطك التجاري")}</li>
          <li>✅ {t("Control your WhatsApp links", "التحكم بروابط واتساب")}</li>
          <li>✅ {t("Receive weekly insights & reports", "الحصول على تقارير وتحليلات أسبوعية")}</li>
        </ul>

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
          }}
        >
          {loading
            ? t("Activating...", "جارٍ التفعيل...")
            : t("Subscribe Now", "اشترك الآن")}
        </button>

        <p style={{ marginTop: "18px", color: "#888", fontSize: "13px" }}>
          {t(
            "No charges will be made during the free trial period.",
            "لن يتم خصم أي رسوم خلال فترة التجربة المجانية."
          )}
        </p>
      </div>
    </div>
  );
}
