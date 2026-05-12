import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignRegister({
  lang = "en",
}) {
  const isAr = lang === "ar";
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

 const [form, setForm] = useState({
  name: "",
  entityType: "mall",
  email: "",
  phone: "",
  username: "",
  password: "",
  confirmPassword: "",
  country: "JO",
});
  
  const t = (en, ar) =>
    isAr ? ar : en;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
  setError(
    isAr
      ? "كلمة المرور وتأكيد كلمة المرور غير متطابقين"
      : "Password and confirm password do not match"
  );
  setLoading(false);
  return;
}

    try {
      const res = await fetch(
        `${API_BASE}/api/campaign/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
  name: form.name,
  entityType: form.entityType,
  email: form.email,
  phone: form.phone,
  username: form.username,
  password: form.password,
  country: form.country,
}),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Registration failed"
        );
      }

      localStorage.setItem(
        "campaignToken",
        data.token
      );

      navigate(
        "/campaign/dashboard"
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "center",
    padding: "40px 16px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "760px",
    background: "#fff",
    borderRadius: "24px",
    padding: "32px",
    boxShadow:
      "0 10px 30px rgba(15,23,42,0.06)",
    border:
      "1px solid rgba(15,23,42,0.06)",
  };

  const sectionStyle = {
    border:
      "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "18px",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "8px",
    display: "block",
    color: "#0f172a",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #dbe2ea",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
    color: "#111827",
  };

  const greenBtn = {
    width: "100%",
    background:
      "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "#fff",
    border: "none",
    borderRadius: "14px",
    padding: "15px",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "10px",
  };

  return (
    <div
      style={pageStyle}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div style={cardStyle}>
        {/* Header */}
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#16a34a",
              fontSize: "30px",
              fontWeight: 800,
            }}
          >
            {t(
              "Campaign Management",
              "إدارة الحملات"
            )}
          </h1>

          <p
            style={{
              color: "#64748b",
              marginTop: "8px",
            }}
          >
            {t(
              "Create organization sponsorship account",
              "إنشاء حساب إدارة حملات ورعاية"
            )}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          {/* Organization */}
          <div style={sectionStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "18px",
                fontSize: "18px",
              }}
            >
              {t(
                "Organization Information",
                "بيانات الجهة"
              )}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(240px,1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={labelStyle}
                >
                  {t(
                    "Organization Name",
                    "اسم الجهة"
                  )}
                </label>

                <input
                  name="organizationName"
                  value={
                    form.organizationName
                  }
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  {t(
                    "Organization Type",
                    "نوع الجهة"
                  )}
                </label>

                <select
                  name="organizationType"
                  value={
                    form.organizationType
                  }
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                >
                  <option value="mall">
                    {t(
                      "Mall",
                      "مول"
                    )}
                  </option>

                  <option value="government">
                    {t(
                      "Government",
                      "جهة حكومية"
                    )}
                  </option>

                  <option value="event">
                    {t(
                      "Event",
                      "فعالية"
                    )}
                  </option>

                  <option value="sponsor">
                    {t(
                      "Sponsor",
                      "راعي"
                    )}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div style={sectionStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: "18px",
                fontSize: "18px",
              }}
            >
              {t(
                "Contact Information",
                "بيانات التواصل"
              )}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(240px,1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={labelStyle}
                >
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  {t(
                    "Phone",
                    "الهاتف"
                  )}
                </label>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={
                    handleChange
                  }
                  style={inputStyle}
                  required
                />
              </div>
            </div>
          </div>

         {/* Account */}
<div style={sectionStyle}>
  <h3
    style={{
      marginTop: 0,
      marginBottom: "18px",
      fontSize: "18px",
    }}
  >
    {t("Account Details", "بيانات الحساب")}
  </h3>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
      gap: "16px",
    }}
  >
    <div>
      <label style={labelStyle}>
        {t("Username", "اسم المستخدم")}
      </label>

      <input
        name="username"
        value={form.username}
        onChange={handleChange}
        style={inputStyle}
        required
      />
    </div>

    <div>
      <label style={labelStyle}>
        {t("Password", "كلمة المرور")}
      </label>

      <input
        type="password"
        name="password"
        value={form.password}
        onChange={handleChange}
        style={inputStyle}
        required
      />
    </div>

    <div>
      <label style={labelStyle}>
        {t("Confirm Password", "تأكيد كلمة المرور")}
      </label>

      <input
        type="password"
        name="confirmPassword"
        value={form.confirmPassword}
        onChange={handleChange}
        style={inputStyle}
        required
      />
    </div>
  </div>
</div>

          <Section title={t("Country", "الدولة")}>
  <Grid>
    <Field label={t("Country", "الدولة")}>
      <select
        name="country"
        value={form.country}
        onChange={handleChange}
        style={inputStyle}
        required
      >
        <option value="JO">{t("Jordan", "الأردن")}</option>
        <option value="QA">{t("Qatar", "قطر")}</option>
        <option value="SA">{t("Saudi Arabia", "السعودية")}</option>
        <option value="AE">{t("United Arab Emirates", "الإمارات")}</option>
        <option value="KW">{t("Kuwait", "الكويت")}</option>
        <option value="BH">{t("Bahrain", "البحرين")}</option>
        <option value="OM">{t("Oman", "عُمان")}</option>
        <option value="LB">{t("Lebanon", "لبنان")}</option>
        <option value="EG">{t("Egypt", "مصر")}</option>
        <option value="US">{t("United States", "الولايات المتحدة")}</option>
        <option value="GB">{t("United Kingdom", "المملكة المتحدة")}</option>
        <option value="OTHER">{t("Other", "أخرى")}</option>
      </select>
    </Field>
  </Grid>
</Section>

          {error && (
            <div
              style={{
                color: "#dc2626",
                marginBottom: "14px",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={greenBtn}
            disabled={loading}
          >
            {loading
              ? t(
                  "Creating account...",
                  "جاري إنشاء الحساب..."
                )
              : t(
                  "Create Account",
                  "إنشاء الحساب"
                )}
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: "18px",
            }}
          >
            <Link
              to="/campaign/login"
            >
              {t(
                "Already have account?",
                "لديك حساب بالفعل؟"
              )}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
