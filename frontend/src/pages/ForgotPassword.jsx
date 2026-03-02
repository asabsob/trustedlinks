import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function ForgotPassword({ lang = "en" }) {
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = {};
      }

      if (res.ok) {
        setMessage(
          t(
            "✅ If this email exists, a reset link has been sent.",
            "✅ إذا كان البريد موجوداً، سيتم إرسال رابط إعادة التعيين."
          )
        );
      } else {
        setMessage(`❌ ${data.error || t("Request failed.", "فشل الطلب.")}`);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage(t("❌ Something went wrong. Please try again.", "❌ حدث خطأ. حاول مرة أخرى."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-50"
      dir={isAr ? "rtl" : "ltr"}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold text-green-600 mb-4">
          {t("Forgot Password", "نسيت كلمة المرور")}
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          {t(
            "Enter your email address and we’ll send you a password reset link.",
            "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور."
          )}
        </p>

        <input
          type="email"
          placeholder={t("Enter your email", "أدخل بريدك الإلكتروني")}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full border border-gray-300 rounded-lg p-2 mb-4 ${
            isAr ? "text-right" : "text-left"
          }`}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-green-600 text-white rounded-lg py-2 font-medium transition ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
          }`}
        >
          {loading ? t("Sending...", "جارٍ الإرسال...") : t("Send Reset Link", "إرسال رابط إعادة التعيين")}
        </button>

        {message && (
          <p className="text-sm mt-4 text-center text-gray-700">{message}</p>
        )}
      </form>
    </div>
  );
}
