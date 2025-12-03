import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { useLang } from "../../context/LangContext.jsx";
import { Lock, Mail, LogIn, Globe } from "lucide-react";

export default function AdminLogin() {
  const { admin, login } = useAdminAuth();
  const { lang, setLang } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const t = (en, ar) => (lang === "ar" ? ar : en);
  const isRTL = lang === "ar";

  if (admin) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setErr(t("Invalid credentials", "بيانات الدخول غير صحيحة"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-50 ${
        isRTL ? "text-right" : "text-left"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        {/* Logo + Language Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-green-600">
            Trusted Links
          </h1>
          <button
            onClick={() => setLang(isRTL ? "en" : "ar")}
            className="flex items-center gap-1 text-gray-500 hover:text-green-600 text-sm"
          >
            <Globe size={16} />
            {isRTL ? "English" : "العربية"}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Mail size={14} />
              {t("Email", "البريد الإلكتروني")}
            </label>
            <input
              type="email"
              className={`mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 ${
                isRTL ? "text-right" : "text-left"
              }`}
              placeholder={t("admin@trustedlinks.app", "admin@trustedlinks.app")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Lock size={14} />
              {t("Password", "كلمة المرور")}
            </label>
            <input
              type="password"
              className={`mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/20 ${
                isRTL ? "text-right" : "text-left"
              }`}
              placeholder={t("••••••••", "••••••••")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
              {err}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl bg-green-600 text-white py-2.5 font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50`}
          >
            <LogIn size={18} />
            {loading ? t("Signing in…", "جارٍ تسجيل الدخول...") : t("Sign in", "تسجيل الدخول")}
          </button>
        </form>
      </div>
    </div>
  );
}
