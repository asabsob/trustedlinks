import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignLogin({ lang = "en" }) {
  const navigate = useNavigate();
  const isAr = lang === "ar";

  const [form, setForm] = useState({
    login: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const t = (en, ar) => (isAr ? ar : en);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.login.trim() || !form.password.trim()) {
      setError(
        t(
          "Please enter your email/username and password.",
          "يرجى إدخال البريد الإلكتروني أو اسم المستخدم وكلمة المرور."
        )
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/campaign/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: form.login.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || t("Invalid login credentials", "بيانات الدخول غير صحيحة")
        );
      }

      localStorage.setItem("campaign_token", data.token);
      localStorage.setItem("campaign_owner", JSON.stringify(data.owner));

      navigate("/campaign/dashboard");
    } catch (err) {
      setError(
        err.message ||
          t("Login failed. Please try again.", "فشل تسجيل الدخول، يرجى المحاولة مرة أخرى.")
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
                <div className="text-white/70 text-sm">
                  {t("Partner Network", "شبكة الشركاء")}
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight">
              {t(
                "Manage partner growth campaigns with measurable results.",
                "أدر حملات الشركاء والنمو بنتائج قابلة للقياس."
              )}
            </h1>

            <p className="text-white/80 mt-5 leading-8 max-w-md">
              {t(
                "Create campaigns, generate funding codes, track participants, budgets, and performance from one platform.",
                "أنشئ الحملات، ولّد أكواد الدعم، وتابع المشاركين والميزانيات والأداء من منصة واحدة."
              )}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-2xl font-bold">01</div>
              <div className="text-xs text-white/70 mt-1">
                {t("Campaigns", "الحملات")}
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-2xl font-bold">02</div>
              <div className="text-xs text-white/70 mt-1">
                {t("Funding Codes", "أكواد الدعم")}
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-2xl font-bold">03</div>
              <div className="text-xs text-white/70 mt-1">
                {t("Analytics", "التحليلات")}
              </div>
            </div>
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
                <div className="text-xs text-slate-500">
                  {t("Partner Network", "شبكة الشركاء")}
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-950">
              {t("Partner Network Login", "تسجيل دخول شبكة الشركاء")}
            </h2>

            <p className="text-slate-500 mt-2">
              {t(
                "Access your partner campaign management dashboard.",
                "ادخل إلى لوحة إدارة حملات الشركاء."
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label={t("Email or Username", "البريد الإلكتروني أو اسم المستخدم")}>
              <input
                type="text"
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                placeholder="example@email.com"
                className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </Field>

            <Field label={t("Password", "كلمة المرور")}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t("Enter your password", "أدخل كلمة المرور")}
                  className="w-full border border-slate-200 rounded-xl p-3.5 pe-12 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </Field>

            <div className="text-end">
              <Link
                to="/campaign/forgot-password"
                className="text-sm text-green-600 font-semibold hover:underline"
              >
                {t("Forgot password?", "نسيت كلمة المرور؟")}
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-3.5 font-bold transition disabled:opacity-60"
            >
              {loading ? t("Signing in...", "جاري تسجيل الدخول...") : t("Login", "تسجيل الدخول")}
            </button>
          </form>

          <div className="mt-7 text-center text-sm text-slate-500">
            {t("Do not have an account?", "ليس لديك حساب؟")}{" "}
            <Link
              to="/campaign/register"
              className="text-green-600 font-bold hover:underline"
            >
              {t("Create partner account", "إنشاء حساب شريك")}
            </Link>
          </div>

          <div className="mt-8 border-t pt-5 text-xs text-slate-400 leading-6">
            {t(
              "This login is for partner organizations managing growth, sponsorship, and funding campaigns.",
              "هذا الدخول مخصص للجهات الشريكة التي تدير حملات النمو والرعاية والدعم."
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-slate-700 mb-2">{label}</div>
      {children}
    </label>
  );
}
