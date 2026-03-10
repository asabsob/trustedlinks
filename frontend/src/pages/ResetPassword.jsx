import React, { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function ResetPassword({ lang = "en" }) {
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error
  const [loading, setLoading] = useState(false);

  const invalidLink = !email || !token;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (invalidLink) {
      setMessageType("error");
      setMessage(
        t(
          "Invalid reset link.",
          "رابط إعادة التعيين غير صالح."
        )
      );
      return;
    }

    if (newPassword.length < 8) {
      setMessageType("error");
      setMessage(
        t(
          "Password must be at least 8 characters.",
          "يجب أن تكون كلمة المرور 8 أحرف على الأقل."
        )
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType("error");
      setMessage(
        t(
          "Passwords do not match.",
          "كلمتا المرور غير متطابقتين."
        )
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessageType("error");
        setMessage(
          data?.error ||
            t(
              "Failed to reset password.",
              "فشل إعادة تعيين كلمة المرور."
            )
        );
        return;
      }

      setMessageType("success");
      setMessage(
        data?.message ||
          t(
            "Password reset successfully. Redirecting to login...",
            "تمت إعادة تعيين كلمة المرور بنجاح. سيتم تحويلك إلى تسجيل الدخول..."
          )
      );

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1800);
    } catch (err) {
      console.error("Reset password error:", err);
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
          {t("Reset Password", "إعادة تعيين كلمة المرور")}
        </h2>

        {invalidLink ? (
          <div className="bg-red-100 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">
            {t(
              "This reset link is invalid or incomplete.",
              "رابط إعادة التعيين غير صالح أو غير مكتمل."
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600 mb-6">
            {t(
              "Enter your new password below.",
              "أدخل كلمة المرور الجديدة أدناه."
            )}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1">
            {t("New Password", "كلمة المرور الجديدة")}
          </label>
          <input
            type="password"
            required
            disabled={invalidLink || loading}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isAr ? "text-right" : "text-left"
            }`}
            placeholder={t("Enter new password", "أدخل كلمة المرور الجديدة")}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1">
            {t("Confirm Password", "تأكيد كلمة المرور")}
          </label>
          <input
            type="password"
            required
            disabled={invalidLink || loading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isAr ? "text-right" : "text-left"
            }`}
            placeholder={t("Confirm new password", "أكد كلمة المرور الجديدة")}
          />
        </div>

        <button
          type="submit"
          disabled={invalidLink || loading}
          className={`w-full bg-green-600 text-white rounded-lg py-3 font-medium transition ${
            invalidLink || loading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-green-700"
          }`}
        >
          {loading
            ? t("Resetting...", "جارٍ إعادة التعيين...")
            : t("Reset Password", "إعادة تعيين كلمة المرور")}
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
