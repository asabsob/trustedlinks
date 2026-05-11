import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function CampaignLogin() {
  const navigate = useNavigate();

  const [lang, setLang] = useState("en");

  const [form, setForm] = useState({
    login: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    en: {
      title: "Campaign Management",
      subtitle: "Login to your campaign dashboard",
      login: "Email or Username",
      password: "Password",
      button: "Login",
      register: "Create account",
      language: "العربية",
    },

    ar: {
      title: "إدارة الحملات",
      subtitle: "تسجيل الدخول إلى لوحة الحملات",
      login: "البريد الإلكتروني أو اسم المستخدم",
      password: "كلمة المرور",
      button: "تسجيل الدخول",
      register: "إنشاء حساب",
      language: "English",
    },
  };

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        "/api/campaign/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Login failed"
        );
      }

      localStorage.setItem(
        "campaign_token",
        data.token
      );

      localStorage.setItem(
        "campaign_owner",
        JSON.stringify(data.owner)
      );

      navigate("/campaign/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {t[lang].title}
            </h1>

            <p className="text-slate-500 mt-1">
              {t[lang].subtitle}
            </p>
          </div>

          <button
            onClick={() =>
              setLang(
                lang === "en" ? "ar" : "en"
              )
            }
            className="text-sm bg-slate-200 px-3 py-1 rounded-lg"
          >
            {t[lang].language}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder={t[lang].login}
            value={form.login}
            onChange={(e) =>
              setForm({
                ...form,
                login: e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />

          <input
            type="password"
            placeholder={t[lang].password}
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            className="w-full border rounded-xl p-3"
          />

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl p-3"
          >
            {loading
              ? "..."
              : t[lang].button}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link
            to="/campaign/register"
            className="text-blue-600"
          >
            {t[lang].register}
          </Link>
        </div>
      </div>
    </div>
  );
}
