import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function CampaignRegister() {
  const navigate = useNavigate();

  const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";
  
  const [lang, setLang] = useState("en");

  const [form, setForm] = useState({
    name: "",
    entityType: "mall",
    email: "",
    phone: "",
    username: "",
    password: "",
    country: "",
    city: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    en: {
      title: "Campaign Management",
      subtitle:
        "Create campaign manager account",

      name: "Organization Name",
      entityType: "Entity Type",
      email: "Email",
      phone: "Phone",
      username: "Username",
      password: "Password",
      country: "Country",
      city: "City",

      button: "Create Account",

      login: "Already have account?",

      language: "العربية",
    },

    ar: {
      title: "إدارة الحملات",
      subtitle:
        "إنشاء حساب إدارة حملات",

      name: "اسم الجهة",
      entityType: "نوع الجهة",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      username: "اسم المستخدم",
      password: "كلمة المرور",
      country: "الدولة",
      city: "المدينة",

      button: "إنشاء الحساب",

      login: "لديك حساب بالفعل؟",

      language: "English",
    },
  };

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
    const res = await fetch(
  `${API_BASE}/api/campaign/auth/register`,
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
          data.error || "Register failed"
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
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
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            placeholder={t[lang].name}
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          />

          <select
            value={form.entityType}
            onChange={(e) =>
              setForm({
                ...form,
                entityType: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="mall">
              Mall
            </option>

            <option value="government">
              Government
            </option>

            <option value="university">
              University
            </option>

            <option value="event">
              Event
            </option>

            <option value="other">
              Other
            </option>
          </select>

          <input
            placeholder={t[lang].email}
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          />

          <input
            placeholder={t[lang].phone}
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          />

          <input
            placeholder={t[lang].username}
            value={form.username}
            onChange={(e) =>
              setForm({
                ...form,
                username: e.target.value,
              })
            }
            className="border rounded-xl p-3"
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
            className="border rounded-xl p-3"
          />

          <input
            placeholder={t[lang].country}
            value={form.country}
            onChange={(e) =>
              setForm({
                ...form,
                country: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          />

          <input
            placeholder={t[lang].city}
            value={form.city}
            onChange={(e) =>
              setForm({
                ...form,
                city: e.target.value,
              })
            }
            className="border rounded-xl p-3"
          />

          {error && (
            <div className="text-red-500 text-sm col-span-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="col-span-2 bg-black text-white rounded-xl p-3"
          >
            {loading
              ? "..."
              : t[lang].button}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link
            to="/campaign/login"
            className="text-blue-600"
          >
            {t[lang].login}
          </Link>
        </div>
      </div>
    </div>
  );
}
