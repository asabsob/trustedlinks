import React, { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function ForgotPassword({ lang = "en" }) {
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    setMessageType("error");
    setMessage(
      t("Please enter your email.", "يرجى إدخال البريد الإلكتروني.")
    );
    return;
  }

  setLoading(true);
  setMessage("");
  setMessageType("");

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setMessageType("success");
      setMessage(
        data?.message ||
          t(
            "If this email is registered, a reset link has been sent.",
            "إذا كان هذا البريد الإلكتروني مسجلاً، فقد تم إرسال رابط إعادة التعيين."
          )
      );
      setEmail("");
    } else {
      setMessageType("error");
      setMessage(
        data?.error ||
          t("Failed to send reset link.", "فشل إرسال رابط إعادة التعيين.")
      );
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    setMessageType("error");
    setMessage(
      t(
        "Something went wrong. Please try again.",
        "حدث خطأ ما. يرجى المحاولة مرة أخرى."
      )
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gray-50 px-4"
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
          className={`w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 ${
            isAr ? "text-right" : "text-left"
          }`}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-green-600 text-white rounded-lg py-3 font-medium transition ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
          }`}
        >
          {loading
            ? t("Sending...", "جارٍ الإرسال...")
            : t("Send Reset Link", "إرسال رابط إعادة التعيين")}
        </button>

        {message && (
          <div
            className={`text-sm mt-4 text-center rounded-lg px-4 py-3 ${
              messageType === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-5 text-center">
          <Link
            to="/login"
            className="text-sm text-green-700 hover:underline font-medium"
          >
            {t("Back to login", "العودة إلى تسجيل الدخول")}
          </Link>
        </div>
      </form>
    </div>
  );
}
