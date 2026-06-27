import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignCheckEmail({ lang = "en" }) {
  const location = useLocation();

  const email = location.state?.email || "";
  const inviteFromState = location.state?.invite || "";
  const inviteToken =
    inviteFromState ||
    sessionStorage.getItem("campaignInviteToken") ||
    "";

  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    if (!inviteToken || !email) return;

    // ملاحظة:
    // هذا لا يغني عن تفعيل البريد.
    // لكنه يحاول ربط الدعوة بعد إنشاء الحساب.
    // تسجيل الدخول سيظل يتطلب email_verified=true.
    async function joinAfterRegister() {
      try {
        setJoining(true);
        setJoinError("");
        setJoinMessage("");

        const res = await fetch(`${API_BASE}/api/campaign/team/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: inviteToken,
            email,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to accept invitation");
        }

        sessionStorage.removeItem("campaignInviteToken");

        setJoinMessage(
          t(
            "Your invitation has been linked to your account. Please verify your email, then sign in.",
            "تم ربط الدعوة بحسابك. يرجى تفعيل البريد الإلكتروني ثم تسجيل الدخول."
          )
        );
      } catch (err) {
        setJoinError(
          err.message ||
            t(
              "Could not link invitation automatically.",
              "تعذر ربط الدعوة تلقائياً."
            )
        );
      } finally {
        setJoining(false);
      }
    }

    joinAfterRegister();
  }, [inviteToken, email]);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f8fafc 0%,#eef7f1 100%)",
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
            background: "#dcfce7",
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "42px",
          }}
        >
          📧
        </div>

        <h1
          style={{
            margin: 0,
            color: "#16a34a",
            fontSize: "30px",
            fontWeight: 900,
          }}
        >
          {t("Check Your Email", "تحقق من بريدك الإلكتروني")}
        </h1>

        <p
          style={{
            marginTop: "18px",
            color: "#475569",
            lineHeight: 1.8,
            fontSize: "16px",
          }}
        >
          {t(
            "Your account has been created successfully. A verification email has been sent to:",
            "تم إنشاء الحساب بنجاح. تم إرسال رسالة تفعيل إلى:"
          )}
        </p>

        {email && (
          <div
            style={{
              margin: "20px auto",
              padding: "14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            {email}
          </div>
        )}

        {inviteToken && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              color: "#166534",
              borderRadius: "16px",
              padding: "16px",
              marginTop: "20px",
              textAlign: isAr ? "right" : "left",
              fontWeight: 700,
              lineHeight: 1.7,
            }}
          >
            {joining
              ? t(
                  "Linking your invitation...",
                  "جاري ربط الدعوة بحسابك..."
                )
              : joinMessage ||
                t(
                  "Your invitation will be linked to this account.",
                  "سيتم ربط الدعوة بهذا الحساب."
                )}
          </div>
        )}

        {joinError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: "16px",
              padding: "16px",
              marginTop: "20px",
              textAlign: isAr ? "right" : "left",
              fontWeight: 700,
              lineHeight: 1.7,
            }}
          >
            {joinError}
          </div>
        )}

        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "16px",
            padding: "18px",
            marginTop: "24px",
            textAlign: isAr ? "right" : "left",
          }}
        >
          <strong>{t("Important", "مهم")}</strong>

          <ul
            style={{
              marginTop: "10px",
              lineHeight: 1.9,
              color: "#444",
            }}
          >
            <li>{t("Open the verification email.", "افتح رسالة التفعيل.")}</li>

            <li>
              {t(
                "Click the verification button.",
                "اضغط على زر التفعيل."
              )}
            </li>

            <li>
              {t(
                inviteToken
                  ? "After verification, sign in to access the campaign team."
                  : "After verification you can sign in normally.",
                inviteToken
                  ? "بعد التفعيل، سجّل الدخول للوصول إلى فريق الحملة."
                  : "بعد التفعيل يمكنك تسجيل الدخول بشكل طبيعي."
              )}
            </li>

            <li>
              {t(
                "If you cannot find the email, check Spam/Junk folder.",
                "إذا لم تجد الرسالة تحقق من مجلد البريد غير الهام."
              )}
            </li>
          </ul>
        </div>

        <div
          style={{
            marginTop: "30px",
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to={
              inviteToken
                ? `/campaign/login?invite=${inviteToken}`
                : "/campaign/login"
            }
            style={{
              background: "#16a34a",
              color: "#fff",
              textDecoration: "none",
              padding: "14px 24px",
              borderRadius: "14px",
              fontWeight: 800,
            }}
          >
            {t("Go to Login", "الانتقال لتسجيل الدخول")}
          </Link>

          <Link
            to="/campaign/register"
            style={{
              background: "#f1f5f9",
              color: "#334155",
              textDecoration: "none",
              padding: "14px 24px",
              borderRadius: "14px",
              fontWeight: 800,
            }}
          >
            {t("Create Another Account", "إنشاء حساب آخر")}
          </Link>
        </div>
      </div>
    </div>
  );
}
