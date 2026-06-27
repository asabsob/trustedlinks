import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignRegister({ lang = "en" }) {
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite");

  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState(() => {
    const savedForm = sessionStorage.getItem("campaignRegisterForm");

    if (savedForm) {
      try {
        return JSON.parse(savedForm);
      } catch {
        sessionStorage.removeItem("campaignRegisterForm");
      }
    }

    return {
      name: "",
      entityType: "mall",
      email: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
      country: "JO",
      acceptedTerms: false,
    };
  });

  const t = (en, ar) => (isAr ? ar : en);

  useEffect(() => {
    sessionStorage.setItem("campaignRegisterForm", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (!inviteToken) return;

    async function loadInvite() {
      try {
        setInviteLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/api/campaign/team/invitation/${inviteToken}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Invalid invitation");
        }

        setForm((prev) => ({
          ...prev,
          name: data.invitation.organizationName || "",
          entityType: data.invitation.organizationType || "sponsor",
          email: data.invitation.email || "",
          country: data.invitation.country || "JO",
        }));
      } catch (err) {
        setError(err.message || "Failed to load invitation");
      } finally {
        setInviteLoading(false);
      }
    }

    loadInvite();
  }, [inviteToken]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(
        t(
          "Password and confirm password do not match",
          "كلمة المرور وتأكيد كلمة المرور غير متطابقين"
        )
      );
      setLoading(false);
      return;
    }

    if (!form.acceptedTerms) {
      setError(
        t(
          "You must accept the Terms and Conditions before creating an account",
          "يجب الموافقة على الأحكام والشروط قبل إنشاء الحساب"
        )
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/campaign/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          entityType: form.entityType,
          email: form.email,
          phone: form.phone,
          username: form.username,
          password: form.password,
          country: form.country,
          acceptedTerms: form.acceptedTerms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Registration failed");
      }

      sessionStorage.removeItem("campaignRegisterForm");

      if (inviteToken) {
        sessionStorage.setItem("campaignInviteToken", inviteToken);
      }

      navigate("/campaign/check-email", {
        state: {
          email: form.email,
          invite: inviteToken,
        },
      });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef7f1 100%)",
    display: "flex",
    justifyContent: "center",
    padding: "38px 16px",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: "820px",
    background: "#ffffff",
    borderRadius: "28px",
    padding: "34px",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(15, 23, 42, 0.06)",
  };

  const sectionStyle = {
    border: "1px solid #e2e8f0",
    borderRadius: "20px",
    padding: "22px",
    marginBottom: "18px",
    background: "#ffffff",
  };

  const sectionTitle = {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "17px",
    fontWeight: 800,
    color: "#0f172a",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "8px",
    display: "block",
    color: "#0f172a",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 15px",
    borderRadius: "14px",
    border: "1px solid #dbe2ea",
    fontSize: "15px",
    outline: "none",
    background: "#fff",
    color: "#111827",
    boxSizing: "border-box",
  };

  const disabledInputStyle = {
    ...inputStyle,
    background: "#f8fafc",
    color: "#64748b",
    cursor: "not-allowed",
  };

  const greenBtn = {
    width: "100%",
    background:
      loading || inviteLoading
        ? "#94d3a2"
        : "linear-gradient(135deg, #16a34a, #22c55e)",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    fontWeight: 800,
    fontSize: "16px",
    cursor: loading || inviteLoading ? "not-allowed" : "pointer",
    marginTop: "8px",
    boxShadow: "0 10px 20px rgba(34,197,94,0.22)",
  };

  return (
    <div style={pageStyle} dir={isAr ? "rtl" : "ltr"}>
      <div style={cardStyle}>
        <div style={{ marginBottom: "26px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#ecfdf5",
              color: "#16a34a",
              padding: "8px 12px",
              borderRadius: "999px",
              fontWeight: 800,
              fontSize: "13px",
              marginBottom: "14px",
            }}
          >
            {inviteToken
              ? t("Campaign Invitation", "دعوة حملة")
              : t("Sponsor Portal", "بوابة الممولين")}
          </div>

          <h1
            style={{
              margin: 0,
              color: "#16a34a",
              fontSize: "32px",
              fontWeight: 900,
              letterSpacing: "-0.5px",
            }}
          >
            {inviteToken
              ? t("Accept Campaign Invitation", "قبول دعوة الانضمام")
              : t("Campaign Management", "إدارة الحملات")}
          </h1>

          <p
            style={{
              color: "#64748b",
              marginTop: "10px",
              fontSize: "15px",
            }}
          >
            {inviteToken
              ? t(
                  "Complete your account to join the invited campaign team.",
                  "أكمل إنشاء حسابك للانضمام إلى فريق الحملة."
                )
              : t(
                  "Create your organization sponsorship account and start managing funded campaigns.",
                  "أنشئ حساب جهة ممولة لإدارة الحملات والرعايات داخل المنصة."
                )}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={sectionStyle}>
            <h3 style={sectionTitle}>
              {t("Organization Information", "بيانات الجهة")}
            </h3>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>
                  {t("Organization Name", "اسم الجهة")}
                </label>
                <input
                  disabled={!!inviteToken}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  style={inviteToken ? disabledInputStyle : inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>
                  {t("Organization Type", "نوع الجهة")}
                </label>
                <select
                  disabled={!!inviteToken}
                  name="entityType"
                  value={form.entityType}
                  onChange={handleChange}
                  style={inviteToken ? disabledInputStyle : inputStyle}
                  required
                >
                  <option value="mall">{t("Mall", "مول")}</option>
                  <option value="government">
                    {t("Government", "جهة حكومية")}
                  </option>
                  <option value="event">{t("Event", "فعالية")}</option>
                  <option value="sponsor">{t("Sponsor", "راعي")}</option>
                </select>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitle}>
              {t("Contact Information", "بيانات التواصل")}
            </h3>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>
                  {t("Email", "البريد الإلكتروني")}
                </label>
                <input
                  disabled={!!inviteToken}
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  style={inviteToken ? disabledInputStyle : inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>{t("Phone", "الهاتف")}</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitle}>
              {t("Account Details", "بيانات الحساب")}
            </h3>

            <div style={gridStyle}>
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
                  minLength={8}
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
                  minLength={8}
                />
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h3 style={sectionTitle}>{t("Country", "الدولة")}</h3>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>{t("Country", "الدولة")}</label>
                <select
                  disabled={!!inviteToken}
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  style={inviteToken ? disabledInputStyle : inputStyle}
                  required
                >
                  <option value="JO">{t("Jordan", "الأردن")}</option>
                  <option value="QA">{t("Qatar", "قطر")}</option>
                  <option value="SA">{t("Saudi Arabia", "السعودية")}</option>
                  <option value="AE">
                    {t("United Arab Emirates", "الإمارات")}
                  </option>
                  <option value="KW">{t("Kuwait", "الكويت")}</option>
                  <option value="BH">{t("Bahrain", "البحرين")}</option>
                  <option value="OM">{t("Oman", "عُمان")}</option>
                  <option value="LB">{t("Lebanon", "لبنان")}</option>
                  <option value="EG">{t("Egypt", "مصر")}</option>
                  <option value="US">
                    {t("United States", "الولايات المتحدة")}
                  </option>
                  <option value="GB">
                    {t("United Kingdom", "المملكة المتحدة")}
                  </option>
                  <option value="OTHER">{t("Other", "أخرى")}</option>
                </select>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "18px",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                fontSize: "14px",
                color: "#334155",
                lineHeight: 1.7,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={form.acceptedTerms}
                onChange={handleChange}
                required
                style={{
                  marginTop: "6px",
                  width: "16px",
                  height: "16px",
                  accentColor: "#16a34a",
                }}
              />

              <span>
                {t(
                  "I confirm that I am authorized to register this organization, have read and accepted the Terms & Conditions and Privacy Policy, and understand that all sponsored balances and payments are non-refundable except in the case of a verified service failure.",
                  "أقر بأنني مخوّل بتسجيل هذه الجهة، وأنني قرأت ووافقت على الأحكام والشروط وسياسة الخصوصية، وأفهم أن جميع الأرصدة الممولة والمدفوعات غير قابلة للاسترداد إلا في حالة فشل الخدمة المثبت من قبل المنصة."
                )}{" "}
                <Link
                  to="/campaign/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#16a34a",
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  {t("Terms & Conditions", "الأحكام والشروط")}
                </Link>
              </span>
            </label>
          </div>

          {error && (
            <div
              style={{
                color: "#dc2626",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                padding: "12px 14px",
                borderRadius: "14px",
                marginBottom: "14px",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={greenBtn}
            disabled={loading || inviteLoading}
          >
            {loading || inviteLoading
              ? t("Creating account...", "جاري إنشاء الحساب...")
              : inviteToken
              ? t("Accept Invitation", "قبول الدعوة")
              : t("Create Account", "إنشاء الحساب")}
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: "20px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {t("Already have an account?", "لديك حساب بالفعل؟")}{" "}
            <Link
              to={
                inviteToken
                  ? `/campaign/login?invite=${inviteToken}`
                  : "/campaign/login"
              }
              style={{
                color: "#16a34a",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              {t("Login", "تسجيل الدخول")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
