import React, { useState } from "react";

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  lang = "en",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  if (!isOpen) return null;

  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRTL = lang === "ar";

  // ----------------- LOGIN -----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!email || !password) {
      setError(
        t(
          "Please fill email and password.",
          "يرجى إدخال البريد الإلكتروني وكلمة المرور."
        )
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5175/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError(
            data.error ||
              t(
                "Please verify your email before logging in.",
                "يرجى تفعيل البريد الإلكتروني قبل تسجيل الدخول."
              )
          );
        } else {
          setError(data.error || t("Login failed.", "فشل تسجيل الدخول."));
        }
        return;
      }

      localStorage.setItem("token", data.token);
      setInfoMessage(t("Login successful!", "تم تسجيل الدخول بنجاح!"));

      if (onLoginSuccess) onLoginSuccess();
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 900);
    } catch (err) {
      setError(
        t(
          "Unexpected error, try again.",
          "حدث خطأ غير متوقع، حاول مرة أخرى."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------- FORGOT PASSWORD --------------
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!forgotEmail) {
      setError(
        t("Please enter your email.", "يرجى إدخال البريد الإلكتروني.")
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5175/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            t("Failed to reset password.", "فشل في إعادة تعيين كلمة المرور.")
        );
        return;
      }

      setInfoMessage(
        data.message ||
          t(
            "If this email is registered, a reset email has been sent.",
            "إذا كان البريد مسجلاً، تم إرسال رسالة لإعادة التعيين."
          )
      );
    } catch (err) {
      setError(
        t(
          "Error while resetting password.",
          "حدث خطأ أثناء إعادة تعيين كلمة المرور."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 top-16 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 to-gray-200 backdrop-blur-sm transition-all"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
    >
      {/* CARD */}
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 relative animate-[slideUp_0.4s_ease]"
        style={{
          fontFamily: "Tajawal, Inter, sans-serif",
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${
            isRTL ? "left-4" : "right-4"
          } text-gray-500 hover:text-gray-700 text-xl`}
        >
          ✕
        </button>

        {/* BRAND HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center">
            TL
          </div>

          <div>
            <div className="text-lg font-semibold text-gray-800">
              Trusted Links
            </div>
            <div className="text-xs text-gray-500 -mt-1">
              {t("Secure business access", "دخول آمن للنشاط التجاري")}
            </div>
          </div>
        </div>

        <hr className="my-3" />

        {/* TITLE */}
        <h2 className="text-center text-green-700 font-semibold text-lg mb-5">
          {t("Login to your account", "تسجيل الدخول إلى حسابك")}
        </h2>

        {/* ERROR / INFO */}
        {error && (
          <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {infoMessage && (
          <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded-lg text-sm text-green-800">
            {infoMessage}
          </div>
        )}

        {/* LOGIN / FORGOT SWITCH */}
        {!showForgot ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className={isRTL ? "text-right" : "text-left"}>
              <label className="block text-sm mb-1">
                {t("Email", "البريد الإلكتروني")}
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={isRTL ? { textAlign: "right" } : {}}
              />
            </div>

            <div className={isRTL ? "text-right" : "text-left"}>
              <label className="block text-sm mb-1">
                {t("Password", "كلمة المرور")}
              </label>
              <input
                type="password"
                className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-green-400 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={isRTL ? { textAlign: "right" } : {}}
              />
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-sm transition-all shadow-md"
            >
              {loading
                ? t("Logging in...", "جاري تسجيل الدخول...")
                : t("Login", "تسجيل الدخول")}
            </button>

            {/* ACTION LINKS */}
            <div
              className={`flex justify-between text-xs mt-2 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <button type="button" className="underline text-gray-600">
                {t("Resend verification email", "إعادة إرسال رابط التفعيل")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setForgotEmail(email);
                }}
                className="underline text-gray-600"
              >
                {t("Forgot password?", "نسيت كلمة المرور؟")}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className={isRTL ? "text-right" : "text-left"}>
              <label className="block text-sm mb-1">
                {t("Email", "البريد الإلكتروني")}
              </label>
              <input
                type="email"
                className="w-full border rounded-lg px-4 py-2 text-sm bg-gray-50"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={isRTL ? { textAlign: "right" } : {}}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold"
            >
              {loading
                ? t("Sending reset link...", "جاري إرسال رابط إعادة التعيين...")
                : t("Send reset email", "إرسال رابط إعادة التعيين")}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgot(false);
                setError("");
                setInfoMessage("");
              }}
              className="w-full mt-2 underline text-gray-600 text-xs"
            >
              {t("Back to login", "عودة لتسجيل الدخول")}
            </button>
          </form>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
