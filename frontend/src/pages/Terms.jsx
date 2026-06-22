import React from "react";
import BrandLogo from "../components/BrandLogo";

export default function Terms({ lang = "en" }) {
  const isArabic = lang === "ar";
  const t = (en, ar) => (isArabic ? ar : en);

  const sections = [
    {
      title: t("1. Business Responsibility", "1. مسؤولية النشاط"),
      body: t(
        "You are responsible for the accuracy of your business information, including name, category, location, contact details, working hours, and any published offers.",
        "أنت مسؤول عن دقة معلومات نشاطك التجاري، بما في ذلك الاسم، التصنيف، الموقع، بيانات التواصل، ساعات العمل، وأي عروض منشورة."
      ),
    },
    {
      title: t("2. WhatsApp Usage", "2. استخدام واتساب"),
      body: t(
        "You agree to use WhatsApp responsibly and not send spam, misleading messages, or any communication that may disturb users.",
        "تتعهد باستخدام واتساب بشكل مسؤول وعدم إرسال رسائل مزعجة أو مضللة أو أي تواصل قد يسبب إزعاجاً للمستخدمين."
      ),
    },
    {
      title: t("3. Payments & Wallet", "3. المدفوعات والمحفظة"),
      body: t(
        "Credits purchased are non-refundable and are used only for TrustedLinks platform services.",
        "الأرصدة التي يتم شراؤها غير قابلة للاسترداد وتستخدم فقط لخدمات منصة TrustedLinks."
      ),
      note: t(
        "Free promotional credits are provided for trial purposes only. These credits have no monetary value, are non-transferable, non-refundable, and cannot be withdrawn or claimed in any form.",
        "الأرصدة المجانية المقدمة هي لأغراض التجربة فقط، ولا تحمل أي قيمة نقدية، وغير قابلة للتحويل أو الاسترداد أو السحب أو المطالبة بها بأي شكل من الأشكال."
      ),
    },
    {
      title: t("4. Platform Rights", "4. حقوق المنصة"),
      body: t(
        "TrustedLinks reserves the right to suspend, restrict, or review accounts that violate platform policies or misuse the service.",
        "تحتفظ TrustedLinks بحق إيقاف أو تقييد أو مراجعة الحسابات التي تخالف سياسات المنصة أو تسيء استخدام الخدمة."
      ),
    },
    {
      title: t("5. Updates", "5. التحديثات"),
      body: t(
        "TrustedLinks may update these terms at any time. Continued use of the platform means acceptance of the latest version.",
        "قد تقوم TrustedLinks بتحديث هذه الشروط في أي وقت، ويُعد استمرار استخدام المنصة قبولاً للنسخة الأحدث منها."
      ),
    },
  ];

  return (
    <div style={pageStyle(isArabic)}>
      <main style={wrapStyle}>
        <section style={heroStyle}>
          <div style={heroTop}>
            <BrandLogo lang={lang} className="h-12 w-auto max-w-[210px]" />
            <span style={badgeStyle}>
              {t("Legal", "قانوني")}
            </span>
          </div>

          <h1 style={heroTitle}>
            {t("Terms & Conditions", "الشروط والأحكام")}
          </h1>

          <p style={heroText}>
            {t(
              "Please read these terms carefully before using TrustedLinks services.",
              "يرجى قراءة هذه الشروط بعناية قبل استخدام خدمات TrustedLinks."
            )}
          </p>
        </section>

        <section style={cardStyle}>
          <p style={introStyle}>
            {t(
              "By using TrustedLinks, you confirm that you understand and agree to the following terms and conditions.",
              "باستخدام منصة TrustedLinks، فإنك تؤكد فهمك وموافقتك على الشروط والأحكام التالية."
            )}
          </p>

          <div style={sectionsWrap}>
            {sections.map((section) => (
              <div key={section.title} style={sectionBox}>
                <h3 style={sectionTitle}>{section.title}</h3>
                <p style={text}>{section.body}</p>

                {section.note && (
                  <p style={noteStyle}>{section.note}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const pageStyle = (isArabic) => ({
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "24px 14px",
  direction: isArabic ? "rtl" : "ltr",
  fontFamily: "Tajawal, Inter, system-ui, sans-serif",
});

const wrapStyle = {
  maxWidth: "980px",
  margin: "0 auto",
};

const heroStyle = {
  background: "linear-gradient(135deg,#111827,#16a34a)",
  color: "#fff",
  padding: "30px",
  borderRadius: "28px",
  marginBottom: "22px",
  boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
};

const heroTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.24)",
  fontSize: "13px",
  fontWeight: 700,
};

const heroTitle = {
  margin: 0,
  fontSize: "34px",
  fontWeight: 900,
  lineHeight: 1.2,
};

const heroText = {
  margin: "14px 0 0",
  fontSize: "16px",
  lineHeight: 1.8,
  opacity: 0.92,
  maxWidth: "720px",
};

const cardStyle = {
  background: "#fff",
  borderRadius: "24px",
  padding: "26px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
};

const introStyle = {
  margin: "0 0 20px",
  color: "#475569",
  fontSize: "15px",
  lineHeight: 1.9,
};

const sectionsWrap = {
  display: "grid",
  gap: "14px",
};

const sectionBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "18px",
};

const sectionTitle = {
  fontSize: "17px",
  fontWeight: 800,
  margin: "0 0 8px",
  color: "#111827",
};

const text = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: 1.9,
  margin: 0,
};

const noteStyle = {
  margin: "12px 0 0",
  padding: "12px 14px",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  color: "#166534",
  borderRadius: "14px",
  fontSize: "14px",
  lineHeight: 1.8,
};
