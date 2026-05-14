import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignForgotPassword({ lang = "en" }) {
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const t = (en, ar) => (isAr ? ar : en);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim()) {
      setError(t("Please enter your email.", "يرجى إدخال البريد الإلكتروني."));
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await fetch(`${API_BASE}/api/campaign/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error ||
            t("Unable to send reset link.", "تعذر إرسال رابط إعادة التعيين.")
        );
      }

      setMessage(
        t(
          "If this email exists, a password reset link has been sent.",
          "إذا كان البريد مسجلًا، سيتم إرسال رابط إعادة تعيين كلمة المرور."
        )
      );
    } catch (err) {
      setError(
        err.message ||
          t("Something went wrong.", "حدث خطأ غير متوقع.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <section className="hidden lg:flex bg-gradient-to-br from-slate-950 to-green-600 text-white p-10 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl">
                ✓
              </div>

              <div>
                <div className="text-2xl font-extrabold">Trusted Links</div>
                <div className="text-white/70 text-sm">Campaign Platform</div>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight">
              {t(
                "Recover access to your campaign dashboard.",
                "استعد الوصول إلى لوحة إدارة الحملات."
              )}
            </h1>

            <p className="text-white/80 mt-5 leading-8 max-w-md">
              {t(
                "Enter your registered email and we will send you instructions to reset your password.",
                "أدخل بريدك الإلكتروني المسجل وسنرسل لك تعليمات إعادة تعيين كلمة المرور."
              )}
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-5 text-sm leading-7 text-white/80">
            {t(
              "For security, reset links should expire after a short time and can only be used once.",
              "لأمان الحساب، يجب أن تنتهي صلاحية روابط إعادة التعيين خلال وقت قصير وتستخدم مرة واحدة فقط."
            )}
          </div>
        </section>

        <section className="p-7 md:p-10">
          <div className="mb-8">
            <div className="flex lg:hidden items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                ✓
              </div>

              <div>
                <div className="font-extrabold text-xl">Trusted Links</div>
                <div className="text-xs text-slate-500">Campaign Platform</div>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-950">
              {t("Forgot Password", "نسيت كلمة المرور")}
            </h2>

            <p className="text-slate-500 mt-2">
              {t(
                "Enter your email to receive reset instructions.",
                "أدخل بريدك الإلكتروني لاستلام تعليمات إعادة التعيين."
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <div className="text-sm font-semibold text-slate-700 mb-2">
                {t("Email Address", "البريد الإلكتروني")}
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-3.5 font-bold transition disabled:opacity-60"
            >
              {loading
                ? t("Sending...", "جاري الإرسال...")
                : t("Send Reset Link", "إرسال رابط إعادة التعيين")}
            </button>
          </form>

          <div className="mt-7 text-center text-sm text-slate-500">
            <Link
              to="/campaign/login"
              className="text-green-600 font-bold hover:underline"
            >
              {t("Back to login", "العودة لتسجيل الدخول")}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
