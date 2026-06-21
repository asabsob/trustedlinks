import { Link, useSearchParams } from "react-router-dom";

export default function CampaignEmailVerified({ lang = "en" }) {
  const [params] = useSearchParams();

  const status = params.get("status") || "success";

  const isAr = lang === "ar";

  const t = (en, ar) => (isAr ? ar : en);

  const success = status === "success";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#eef7f1 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "650px",
          background: "#fff",
          borderRadius: "24px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            background: success ? "#dcfce7" : "#fef2f2",
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "42px",
          }}
        >
          {success ? "✅" : "⚠️"}
        </div>

        <h1
          style={{
            margin: 0,
            color: success ? "#16a34a" : "#dc2626",
            fontSize: "30px",
            fontWeight: 900,
          }}
        >
          {success
            ? t(
                "Email Verified Successfully",
                "تم تفعيل البريد الإلكتروني بنجاح"
              )
            : t(
                "Verification Failed",
                "فشل التحقق من البريد الإلكتروني"
              )}
        </h1>

        <p
          style={{
            marginTop: "18px",
            color: "#475569",
            lineHeight: 1.8,
            fontSize: "16px",
          }}
        >
          {success
            ? t(
                "Your sponsor account has been activated successfully. You can now sign in and start managing your campaigns.",
                "تم تفعيل حساب الممول بنجاح ويمكنك الآن تسجيل الدخول والبدء بإدارة الحملات."
              )
            : t(
                "The verification link is invalid or has expired. Please request a new verification email.",
                "رابط التفعيل غير صالح أو انتهت صلاحيته. يرجى طلب رسالة تفعيل جديدة."
              )}
        </p>

        <div
          style={{
            marginTop: "30px",
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {success ? (
            <Link
              to="/campaign/login"
              style={{
                background:
                  "linear-gradient(135deg,#16a34a,#22c55e)",
                color: "#fff",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: "14px",
                fontWeight: 800,
                boxShadow:
                  "0 10px 20px rgba(34,197,94,0.22)",
              }}
            >
              {t("Login Now", "تسجيل الدخول الآن")}
            </Link>
          ) : (
            <Link
              to="/campaign/register"
              style={{
                background:
                  "linear-gradient(135deg,#16a34a,#22c55e)",
                color: "#fff",
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: "14px",
                fontWeight: 800,
                boxShadow:
                  "0 10px 20px rgba(34,197,94,0.22)",
              }}
            >
              {t(
                "Create New Account",
                "إنشاء حساب جديد"
              )}
            </Link>
          )}

          <Link
            to="/"
            style={{
              background: "#f1f5f9",
              color: "#334155",
              textDecoration: "none",
              padding: "14px 28px",
              borderRadius: "14px",
              fontWeight: 800,
            }}
          >
            {t("Back to Home", "العودة للرئيسية")}
          </Link>
        </div>
      </div>
    </div>
  );
}
