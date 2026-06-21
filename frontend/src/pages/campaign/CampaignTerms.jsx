export default function CampaignTerms({ lang = "en" }) {
  const isAr = lang === "ar";

  const t = (en, ar) => (isAr ? ar : en);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "30px",
        background: "#fff",
        borderRadius: "24px",
      }}
    >
      <h1>
        {t(
          "Terms & Conditions",
          "الأحكام والشروط"
        )}
      </h1>

      <h2>
        {t(
          "1. Acceptance of Terms",
          "1. الموافقة على الشروط"
        )}
      </h2>

      <p>
        {t(
          "By creating an account, accessing, or using TrustedLinks Campaign Management Platform, the Sponsor agrees to be bound by these Terms and Conditions.",
          "من خلال إنشاء حساب أو استخدام منصة TrustedLinks لإدارة الحملات، يوافق الممول على الالتزام بهذه الأحكام والشروط."
        )}
      </p>

      <h2>
        {t(
          "2. Sponsored Credits and Payments",
          "2. الأرصدة الممولة والمدفوعات"
        )}
      </h2>

      <p>
        {t(
          "Sponsored credits may only be used within the TrustedLinks platform and have no cash value outside the platform.",
          "تستخدم الأرصدة الممولة داخل منصة TrustedLinks فقط ولا تمثل قيمة نقدية خارج المنصة."
        )}
      </p>

      <h2>
        {t(
          "3. Refund Policy",
          "3. سياسة الاسترداد"
        )}
      </h2>

      <p>
        {t(
          "All payments, deposits, sponsored balances and funded credits are non-refundable.",
          "جميع المدفوعات والأرصدة الممولة والاعتمادات المضافة غير قابلة للاسترداد."
        )}
      </p>

      <p>
        <strong>
          {t(
            "Refunds may only be approved when a verified technical failure caused by TrustedLinks prevents delivery of the purchased service.",
            "لا يتم استرداد أي مبالغ إلا في حال وجود عطل تقني مثبت من قبل TrustedLinks أدى إلى عدم تقديم الخدمة المتفق عليها."
          )}
        </strong>
      </p>

      <ul>
        <li>
          {t(
            "Unused balances are not refundable.",
            "الأرصدة غير المستخدمة غير قابلة للاسترداد."
          )}
        </li>

        <li>
          {t(
            "Low campaign performance is not grounds for refund.",
            "انخفاض أداء الحملة لا يعتبر سبباً للاسترداد."
          )}
        </li>

        <li>
          {t(
            "Merchant inactivity is not grounds for refund.",
            "عدم نشاط المتاجر لا يعتبر سبباً للاسترداد."
          )}
        </li>

        <li>
          {t(
            "Account closure does not qualify for refund.",
            "إغلاق الحساب لا يمنح الحق في استرداد الرصيد."
          )}
        </li>
      </ul>

      <h2>
        {t(
          "4. Promotional Nature of Sponsored Credits",
          "4. الطبيعة الترويجية للأرصدة الممولة"
        )}
      </h2>

      <p>
        {t(
          "Sponsored balances issued to merchants are promotional marketing credits and shall not be considered cash deposits, bank balances, electronic money, or financial instruments.",
          "الأرصدة الممولة الممنوحة للتجار هي أرصدة تسويقية ترويجية ولا تعتبر ودائع نقدية أو أموالاً إلكترونية أو أدوات مالية أو أرصدة مصرفية."
        )}
      </p>

      <h2>
        {t(
          "5. Limitation of Liability",
          "5. حدود المسؤولية"
        )}
      </h2>

      <p>
        {t(
          "TrustedLinks shall not be liable for indirect or consequential damages arising from the use of the platform.",
          "لا تتحمل TrustedLinks أي مسؤولية عن الأضرار غير المباشرة أو التبعية الناتجة عن استخدام المنصة."
        )}
      </p>

      <h2>
        {t(
          "6. Governing Law",
          "6. القانون الواجب التطبيق"
        )}
      </h2>

      <p>
        {t(
          "These Terms shall be governed by the laws of the Hashemite Kingdom of Jordan and disputes shall be subject to the courts of Amman.",
          "تخضع هذه الأحكام والشروط لقوانين المملكة الأردنية الهاشمية وتختص محاكم عمان بالنظر في أي نزاع ينشأ عنها."
        )}
      </p>

      <h2>
        {t(
          "7. Contact",
          "7. التواصل"
        )}
      </h2>

      <p>
        support@trustedlinks.net
      </p>
    </div>
  );
}
