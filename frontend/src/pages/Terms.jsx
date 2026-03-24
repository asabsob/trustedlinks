import React from "react";

export default function Terms({ lang = "en" }) {
  const isArabic = lang === "ar";
  const t = (en, ar) => (isArabic ? ar : en);

  return (
    <div style={container(isArabic)}>
      <div style={card}>
        <h1 style={title}>
          {t("Terms & Conditions", "الشروط والأحكام")}
        </h1>

        <p style={text}>
          {t(
            "By using TrustedLinks, you agree to the following terms and conditions.",
            "باستخدام منصة TrustedLinks، فإنك توافق على الشروط والأحكام التالية."
          )}
        </p>

        <h3 style={sectionTitle}>
          {t("1. Business Responsibility", "1. مسؤولية النشاط")}
        </h3>
        <p style={text}>
          {t(
            "You are responsible for the accuracy of your business information.",
            "أنت مسؤول عن دقة معلومات نشاطك التجاري."
          )}
        </p>

        <h3 style={sectionTitle}>
          {t("2. WhatsApp Usage", "2. استخدام واتساب")}
        </h3>
        <p style={text}>
          {t(
            "You agree to use WhatsApp responsibly and not spam users.",
            "تتعهد باستخدام واتساب بشكل مسؤول وعدم إزعاج المستخدمين."
          )}
        </p>

      <h3 style={sectionTitle}>
  {t("3. Payments & Wallet", "3. المدفوعات والمحفظة")}
</h3>

<p style={text}>
  {t(
    "Credits purchased are non-refundable and used for platform services.",
    "الرصيد الذي يتم شراؤه غير قابل للاسترجاع ويستخدم لخدمات المنصة."
  )}
</p>

<p style={text}>
  {t(
    "Free promotional credits are provided for trial purposes only. These credits have no monetary value, are non-transferable, non-refundable, and cannot be withdrawn or claimed in any form. They can only be used within the TrustedLinks platform.",
    "الرصيد المجاني المقدم هو لأغراض التجربة فقط، ولا يحمل أي قيمة نقدية، وغير قابل للتحويل أو الاسترداد أو المطالبة به بأي شكل من الأشكال، ويستخدم فقط داخل منصة TrustedLinks."
  )}
</p>

        <h3 style={sectionTitle}>
          {t("4. Platform Rights", "4. حقوق المنصة")}
        </h3>
        <p style={text}>
          {t(
            "TrustedLinks reserves the right to suspend accounts that violate policies.",
            "تحتفظ المنصة بحق إيقاف الحسابات المخالفة للسياسات."
          )}
        </p>

        <h3 style={sectionTitle}>
          {t("5. Updates", "5. التحديثات")}
        </h3>
        <p style={text}>
          {t(
            "We may update these terms at any time.",
            "قد نقوم بتحديث هذه الشروط في أي وقت."
          )}
        </p>
      </div>
    </div>
  );
}

const container = (isArabic) => ({
  minHeight: "100vh",
  background: "#f8fafc",
  display: "flex",
  justifyContent: "center",
  padding: "40px 16px",
  direction: isArabic ? "rtl" : "ltr",
});

const card = {
  maxWidth: "800px",
  background: "#fff",
  borderRadius: "20px",
  padding: "30px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
};

const title = {
  fontSize: "28px",
  fontWeight: "800",
  marginBottom: "20px",
  color: "#16a34a",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "700",
  marginTop: "20px",
  marginBottom: "8px",
};

const text = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "1.8",
};
