import { Link } from "react-router-dom";

export default function CampaignTerms({ lang = "en" }) {
  const isAr = lang === "ar";

  const t = (en, ar) => (isAr ? ar : en);

  const pageStyle = {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "40px 20px",
  };

  const cardStyle = {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 16px 45px rgba(15,23,42,0.08)",
    border: "1px solid rgba(15,23,42,0.06)",
  };

  const headerStyle = {
    background: "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "#fff",
    padding: "34px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  };

  const contentStyle = {
    padding: "34px",
  };

  const noticeStyle = {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "28px",
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  };

  const itemStyle = {
    display: "grid",
    gridTemplateColumns: isAr ? "1fr 58px" : "58px 1fr",
    gap: "18px",
    padding: "22px 0",
    borderBottom: "1px solid #e5e7eb",
  };

  const numberStyle = {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "16px",
  };

  const titleStyle = {
    margin: "0 0 8px",
    color: "#16a34a",
    fontSize: "18px",
    fontWeight: 900,
  };

  const textStyle = {
    margin: 0,
    color: "#334155",
    fontSize: "15px",
    lineHeight: 1.8,
  };

  const bulletStyle = {
    margin: "8px 0 0",
    paddingInlineStart: "22px",
    color: "#334155",
    fontSize: "15px",
    lineHeight: 1.8,
  };

  const buttonStyle = {
    display: "inline-block",
    background: "linear-gradient(135deg,#16a34a,#22c55e)",
    color: "#fff",
    padding: "13px 26px",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: 900,
    boxShadow: "0 10px 20px rgba(34,197,94,0.22)",
  };

  const Section = ({ number, title, children }) => (
    <div style={itemStyle}>
      {!isAr && <div style={numberStyle}>{number}</div>}

      <div>
        <h2 style={titleStyle}>{title}</h2>
        {children}
      </div>

      {isAr && <div style={numberStyle}>{number}</div>}
    </div>
  );

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 900,
                letterSpacing: "-0.4px",
              }}
            >
              {t("Terms & Conditions", "الأحكام والشروط")}
            </h1>

            <p
              style={{
                margin: "10px 0 0",
                opacity: 0.95,
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              TrustedLinks Campaign Platform
            </p>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "999px",
              padding: "9px 14px",
              fontSize: "13px",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {t("Last updated: June 2026", "آخر تحديث: يونيو 2026")}
          </div>
        </div>

        <div style={contentStyle}>
          <div style={noticeStyle}>
            <div
              style={{
                fontSize: "28px",
                lineHeight: 1,
              }}
            >
              ⚠️
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  color: "#0f172a",
                  marginBottom: "6px",
                  fontSize: "15px",
                }}
              >
                {t("Important Notice", "تنبيه مهم")}
              </strong>

              <p style={textStyle}>
                {t(
                  "All sponsored balances and payments are non-refundable except in the case of a verified service failure caused by TrustedLinks. By using the platform, you agree to these Terms and Conditions.",
                  "جميع الأرصدة الممولة والمدفوعات غير قابلة للاسترداد إلا في حالة وجود فشل مثبت في الخدمة ناتج عن منصة TrustedLinks. وباستخدامك للمنصة فإنك توافق على هذه الأحكام والشروط."
                )}
              </p>
            </div>
          </div>

          <Section
            number="1"
            title={t("Acceptance", "الموافقة")}
          >
            <p style={textStyle}>
              {t(
                "By registering an account on the TrustedLinks Campaign Platform, you agree to be bound by these Terms and Conditions, the Privacy Policy, and all applicable laws and regulations.",
                "بإنشاء حساب على منصة TrustedLinks لإدارة الحملات، فإنك توافق على الالتزام بهذه الأحكام والشروط وسياسة الخصوصية وجميع القوانين والأنظمة المعمول بها."
              )}
            </p>
          </Section>

          <Section
            number="2"
            title={t("Eligibility and Authority", "الأهلية والصلاحية")}
          >
            <p style={textStyle}>
              {t(
                "The registrant must be legally authorized to represent the organization or entity on behalf of which the account is created. TrustedLinks may request verification documents at any time.",
                "يجب أن يكون المسجل مخولاً قانونياً بتمثيل الجهة أو المؤسسة التي يتم إنشاء الحساب باسمها، ويحق لمنصة TrustedLinks طلب مستندات تحقق في أي وقت."
              )}
            </p>
          </Section>

          <Section
            number="3"
            title={t("Sponsored Credits", "الأرصدة الممولة")}
          >
            <p style={textStyle}>
              {t(
                "Sponsored credits are promotional marketing balances used exclusively inside the TrustedLinks platform. They are not cash deposits, bank balances, electronic money, or financial instruments.",
                "الأرصدة الممولة هي أرصدة تسويقية ترويجية تستخدم حصرياً داخل منصة TrustedLinks، ولا تعتبر ودائع نقدية أو أرصدة مصرفية أو أموالاً إلكترونية أو أدوات مالية."
              )}
            </p>
          </Section>

          <Section
            number="4"
            title={t("Refund Policy", "سياسة الاسترداد")}
          >
            <ul style={bulletStyle}>
              <li>
                {t(
                  "All payments, deposits, and sponsored balances are final and non-refundable.",
                  "جميع المدفوعات والإيداعات والأرصدة الممولة نهائية وغير قابلة للاسترداد."
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
                  "Low campaign performance, merchant inactivity, or unmet expectations are not grounds for refund.",
                  "ضعف أداء الحملة أو عدم نشاط المتاجر أو عدم تحقق التوقعات لا يعتبر سبباً للاسترداد."
                )}
              </li>
              <li>
                {t(
                  "Refunds may only be approved when a verified service failure caused by TrustedLinks directly prevents delivery of the purchased service.",
                  "لا يتم قبول الاسترداد إلا عند وجود فشل مثبت في الخدمة ناتج عن منصة TrustedLinks ويمنع تقديم الخدمة المتفق عليها."
                )}
              </li>
            </ul>
          </Section>

          <Section
            number="5"
            title={t("Platform Availability", "توفر المنصة")}
          >
            <p style={textStyle}>
              {t(
                "TrustedLinks aims to maintain reliable platform availability, but does not guarantee uninterrupted service. Maintenance, upgrades, third-party disruptions, or force majeure events may affect availability.",
                "تسعى TrustedLinks إلى توفير خدمة مستقرة وموثوقة، إلا أنها لا تضمن عدم انقطاع الخدمة بشكل كامل، وقد تؤثر أعمال الصيانة أو التحديثات أو أعطال الأطراف الثالثة أو الظروف القاهرة على توفر المنصة."
              )}
            </p>
          </Section>

          <Section
            number="6"
            title={t("Limitation of Liability", "حدود المسؤولية")}
          >
            <p style={textStyle}>
              {t(
                "To the maximum extent permitted by law, TrustedLinks shall not be liable for indirect, incidental, consequential, special, or punitive damages, including loss of profit, data, goodwill, or campaign performance outcomes.",
                "إلى أقصى حد يسمح به القانون، لا تتحمل TrustedLinks أي مسؤولية عن الأضرار غير المباشرة أو العرضية أو التبعية أو الخاصة أو العقابية، بما في ذلك خسارة الأرباح أو البيانات أو السمعة التجارية أو نتائج أداء الحملات."
              )}
            </p>
          </Section>

          <Section
            number="7"
            title={t("Suspension and Termination", "التعليق وإنهاء الحساب")}
          >
            <p style={textStyle}>
              {t(
                "TrustedLinks may suspend or terminate any account if false information is provided, fraudulent activity is suspected, legal requirements require action, or these Terms are violated.",
                "يحق لمنصة TrustedLinks تعليق أو إنهاء أي حساب في حال تقديم معلومات غير صحيحة أو الاشتباه بوجود نشاط احتيالي أو وجود متطلبات قانونية تستدعي ذلك أو مخالفة هذه الأحكام والشروط."
              )}
            </p>
          </Section>

          <Section
            number="8"
            title={t("Governing Law", "القانون الواجب التطبيق")}
          >
            <p style={textStyle}>
              {t(
                "These Terms and any disputes arising from them shall be governed by the laws of the Hashemite Kingdom of Jordan, and the competent courts of Amman shall have exclusive jurisdiction.",
                "تخضع هذه الأحكام وأي نزاع ينشأ عنها لقوانين المملكة الأردنية الهاشمية، وتختص محاكم عمان المختصة بالنظر في أي نزاع ينشأ عنها."
              )}
            </p>
          </Section>

          <div
            style={{
              marginTop: "34px",
              textAlign: "center",
            }}
          >
            <Link to="/campaign/register" style={buttonStyle}>
              {t("← Back to Registration", "العودة للتسجيل →")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
