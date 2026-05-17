import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignResetPassword({ lang = "en" }) {
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const { token } = useParams();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = (en, ar) => (isAr ? ar : en);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.password || !form.confirmPassword) {
      setError(t("Please fill all fields.", "يرجى تعبئة جميع الحقول."));
      return;
    }

    if (form.password.length < 8) {
      setError(
        t(
          "Password must be at least 8 characters.",
          "يجب أن تكون كلمة المرور 8 أحرف على الأقل."
        )
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(
        t(
          "Passwords do not match.",
          "كلمتا المرور غير متطابقتين."
        )
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${API_BASE}/api/campaign/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: form.password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error ||
            t("Unable to reset password.", "تعذر إعادة تعيين كلمة المرور.")
        );
      }

      setSuccess(
        t(
          "Password reset successfully. Redirecting to login...",
          "تم تغيير كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول..."
        )
      );

      setTimeout(() => {
        navigate("/campaign/login");
      }, 1500);
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
                "Create a new secure password.",
                "أنشئ كلمة مرور جديدة وآمنة."
              )}
            </h1>

            <p className="text-white/80 mt-5 leading-8 max-w-md">
              {t(
                "Use a strong password to protect your campaign management account.",
                "استخدم كلمة مرور قوية لحماية حساب إدارة الحملات."
              )}
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-5 text-sm leading-7 text-white/80">
            {t(
              "After resetting your password, you can log in using your new credentials.",
              "بعد تغيير كلمة المرور، يمكنك تسجيل الدخول باستخدام البيانات الجديدة."
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
              {t("Reset Password", "إعادة تعيين كلمة المرور")}
            </h2>

            <p className="text-slate-500 mt-2">
              {t(
                "Enter and confirm your new password.",
                "أدخل كلمة المرور الجديدة وقم بتأكيدها."
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField
              label={t("New Password", "كلمة المرور الجديدة")}
              value={form.password}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              onChange={(value) =>
                setForm({
                  ...form,
                  password: value,
                })
              }
              placeholder={t("Enter new password", "أدخل كلمة المرور الجديدة")}
            />

            <PasswordField
              label={t("Confirm Password", "تأكيد كلمة المرور")}
              value={form.confirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              onChange={(value) =>
                setForm({
                  ...form,
                  confirmPassword: value,
                })
              }
              placeholder={t("Confirm new password", "أكد كلمة المرور الجديدة")}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl p-3.5 font-bold transition disabled:opacity-60"
            >
              {loading
                ? t("Resetting...", "جاري التغيير...")
                : t("Reset Password", "تغيير كلمة المرور")}
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

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-slate-700 mb-2">
        {label}
      </div>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-xl p-3.5 pe-12 outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute top-1/2 -translate-y-1/2 end-3 text-slate-400 hover:text-slate-700"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </label>
  );
}
