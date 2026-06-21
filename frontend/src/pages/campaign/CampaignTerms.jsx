import { Link } from "react-router-dom";

export default function CampaignTerms({ lang = "en" }) {
  const isAr = lang === "ar";

  const t = (en, ar) => (isAr ? ar : en);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            background:
              "linear-gradient(135deg,#16a34a,#22c55e)",
            color: "#fff",
            padding: "32px",
          }}
        >
          <h1 style={{ margin: 0 }}>
            {t(
              "Terms & Conditions",
              "الأحكام والشروط"
            )}
          </h1>

          <p
            style={{
              marginTop: "10px",
              opacity: 0.9,
            }}
          >
            TrustedLinks Campaign Platform
          </p>
        </div>

        <div style={{ padding: "32px" }}>
          {/* Refund Warning */}
          <div
            style={{
              background: "#fefce8",
              border: "1px solid #fde68a",
              borderRadius: "16px",
              padding: "18px",
              marginBottom: "30px",
            }}
          >
            <strong>
              {t(
                "Important Notice",
                "تنبيه مهم"
              )}
            </strong>

            <p style={{ marginBottom: 0 }}>
              {t(
                "All sponsored balances and payments are non-refundable except in the case of a verified service failure caused by TrustedLinks.",
                "جميع الأرصدة الممولة والمدفوعات غير قابلة للاسترداد إلا في حالة وجود فشل مثبت في الخدمة ناتج عن منصة TrustedLinks."
              )}
            </p>
          </div>

          <h2>1. {t("Acceptance", "الموافقة")}</h2>

          <p>
            {t(
              "By registering an account you agree to these Terms and Conditions.",
              "بإنشاء حساب على المنصة فإنك توافق على هذه الأحكام والشروط."
            )}
          </p>

          <h2>2. {t("Eligibility", "الأهلية")}</h2>

          <p>
            {t(
              "The registrant must be authorized to represent the organization.",
              "يجب أن يكون المسجل مخولاً بتمثيل الجهة المسجلة."
            )}
          </p>

          <h2>
            3. {t("Sponsored Credits", "الأرصدة الممولة")}
          </h2>

          <p>
            {t(
              "Sponsored credits are promotional balances used exclusively inside the TrustedLinks platform.",
              "الأرصدة الممولة هي أرصدة ترويجية تستخدم حصرياً داخل منصة TrustedLinks."
            )}
          </p>

          <h2>
            4. {t("Refund Policy", "سياسة الاسترداد")}
          </h2>

          <ul>
            <li>
              {t(
                "All payments are final.",
                "جميع المدفوعات نهائية."
              )}
            </li>

            <li>
              {t(
                "Unused balances are not refundable.",
                "الأرصدة غير المستخدمة غير قابلة للاسترداد."
              )}
            </li>

            <li>
              {t(
                "Low campaign performance is not grounds for refund.",
                "ضعف أداء الحملة لا يعتبر سبباً للاسترداد."
              )}
            </li>

            <li>
              {t(
                "Refunds are only available when a verified service failure prevents delivery of the purchased service.",
                "الاسترداد متاح فقط عند وجود فشل مثبت في الخدمة يمنع تقديم الخدمة المتفق عليها."
              )}
            </li>
          </ul>

          <h2>
            5. {t("Limitation of Liability", "حدود المسؤولية")}
          </h2>

          <p>
            {t(
              "TrustedLinks shall not be liable for indirect damages, loss of profit, or campaign performance outcomes.",
              "لا تتحمل TrustedLinks مسؤولية الأضرار غير المباشرة أو خسارة الأرباح أو نتائج أداء الحملات."
            )}
          </p>

          <h2>
            6. {t("Governing Law", "القانون الواجب التطبيق")}
          </h2>

          <p>
            {t(
              "These terms are governed by the laws of the Hashemite Kingdom of Jordan and disputes shall be resolved by the courts of Amman.",
              "تخضع هذه الأحكام لقوانين المملكة الأردنية الهاشمية وتختص محاكم عمان بالنظر في أي نزاع ينشأ عنها."
            )}
          </p>

          <div
            style={{
              marginTop: "40px",
              textAlign: "center",
            }}
          >
            <Link
              to="/campaign/register"
              style={{
                background: "#16a34a",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {t(
                "Back to Registration",
                "العودة للتسجيل"
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
