import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home({ lang }) {
  const navigate = useNavigate();

  const isArabic = lang === "ar";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const sectionTitleStyle = {
    fontSize: "1.8rem",
    fontWeight: "700",
    marginBottom: "14px",
    color: "#0f172a",
  };

  const sectionTextStyle = {
    fontSize: "1rem",
    color: "#475569",
    lineHeight: "1.8",
    maxWidth: "760px",
    margin: "0 auto",
  };

  const cardStyle = {
    background: "white",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
    border: "1px solid #e5e7eb",
    textAlign: isArabic ? "right" : "left",
  };

  return (
    <div
      style={{
        fontFamily: isArabic ? "Tajawal, sans-serif" : "Inter, sans-serif",
        direction: isArabic ? "rtl" : "ltr",
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "32px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              background: "white",
              border: "1px solid #dbe2ea",
              borderRadius: "12px",
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#0f172a",
              boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
            }}
          >
            {isArabic ? "← العودة" : "← Back"}
          </button>

          <div
            style={{
              fontSize: "0.95rem",
              color: "#64748b",
              fontWeight: "500",
            }}
          >
            {isArabic
              ? "الرئيسية / TrustedLinks"
              : "Home / TrustedLinks"}
          </div>
        </div>

        {/* Hero */}
        <section
          style={{
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            color: "white",
            borderRadius: "24px",
            padding: "56px 28px",
            boxShadow: "0 12px 30px rgba(34,197,94,0.22)",
            marginBottom: "28px",
          }}
        >
          <div style={{ maxWidth: "860px", margin: "0 auto", textAlign: "center" }}>
            <div
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.22)",
                padding: "8px 14px",
                borderRadius: "999px",
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "18px",
              }}
            >
              {isArabic ? "روابط موثوقة • تواصل أسرع" : "Verified Links • Faster Access"}
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: "800",
                marginBottom: "18px",
                lineHeight: "1.2",
              }}
            >
              {isArabic
                ? "TrustedLinks تربط الأفراد بالشركات بطريقة أوضح وأكثر ثقة"
                : "TrustedLinks connects people and businesses with clarity and trust"}
            </h1>

            <p
              style={{
                fontSize: "1.08rem",
                lineHeight: "1.9",
                maxWidth: "780px",
                margin: "0 auto 32px",
                color: "rgba(255,255,255,0.95)",
              }}
            >
              {isArabic
                ? "منصة تساعد المستخدمين على الوصول إلى روابط واتساب والروابط الرسمية للشركات بشكل مباشر، وتساعد الشركات على الظهور بصورة احترافية وإدارة حضورها الرقمي بسهولة."
                : "A platform that helps users reach official business links and WhatsApp contacts directly, while helping businesses present themselves professionally and manage their digital presence with ease."}
            </p>

            <div
              style={{
                display: "flex",
                gap: "14px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/search"
                style={{
                  background: "white",
                  color: "#16a34a",
                  borderRadius: "12px",
                  padding: "13px 24px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  textDecoration: "none",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                }}
              >
                {isArabic ? "استكشف الأنشطة" : "Explore Businesses"}
              </Link>

              <Link
                to="/register"
                style={{
                  background: "#0f172a",
                  color: "white",
                  borderRadius: "12px",
                  padding: "13px 24px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                {isArabic ? "سجّل نشاطك الآن" : "Register Your Business"}
              </Link>

              <Link
                to="/dashboard"
                style={{
                  background: "transparent",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.5)",
                  borderRadius: "12px",
                  padding: "13px 24px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  textDecoration: "none",
                }}
              >
                {isArabic ? "لوحة التحكم" : "Go to Dashboard"}
              </Link>
            </div>
          </div>
        </section>

        {/* Importance */}
        <section style={{ marginBottom: "28px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            <div style={cardStyle}>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "700",
                  color: "#16a34a",
                  marginBottom: "14px",
                }}
              >
                {isArabic ? "للأفراد" : "For Individuals"}
              </h2>

              <ul
                style={{
                  margin: 0,
                  paddingInlineStart: "20px",
                  color: "#475569",
                  lineHeight: "2",
                  fontSize: "1rem",
                }}
              >
                <li>
                  {isArabic
                    ? "الوصول السريع إلى جهات التواصل الصحيحة"
                    : "Quick access to the right business contacts"}
                </li>
                <li>
                  {isArabic
                    ? "تقليل احتمالية الوصول إلى روابط غير موثوقة"
                    : "Reduced risk of reaching untrusted links"}
                </li>
                <li>
                  {isArabic
                    ? "البحث بشكل أسهل داخل منصة واضحة ومنظمة"
                    : "Easier search inside a clear, organized platform"}
                </li>
                <li>
                  {isArabic
                    ? "التواصل المباشر عبر واتساب أو الرابط الرسمي"
                    : "Direct contact through WhatsApp or official links"}
                </li>
              </ul>
            </div>

            <div style={cardStyle}>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "700",
                  color: "#16a34a",
                  marginBottom: "14px",
                }}
              >
                {isArabic ? "للشركات" : "For Businesses"}
              </h2>

              <ul
                style={{
                  margin: 0,
                  paddingInlineStart: "20px",
                  color: "#475569",
                  lineHeight: "2",
                  fontSize: "1rem",
                }}
              >
                <li>
                  {isArabic
                    ? "ظهور احترافي ومنظم أمام العملاء"
                    : "Professional and organized visibility to customers"}
                </li>
                <li>
                  {isArabic
                    ? "إضافة الروابط الرسمية في مكان واحد"
                    : "All official links in one place"}
                </li>
                <li>
                  {isArabic
                    ? "توثيق واتساب لزيادة الثقة"
                    : "WhatsApp verification to increase trust"}
                </li>
                <li>
                  {isArabic
                    ? "إدارة أسهل من خلال لوحة تحكم موحدة"
                    : "Simpler management through one dashboard"}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          style={{
            ...cardStyle,
            marginBottom: "28px",
            textAlign: "center",
          }}
        >
          <h2 style={sectionTitleStyle}>
            {isArabic ? "كيف تعمل المنصة؟" : "How the platform works"}
          </h2>
          <p style={sectionTextStyle}>
            {isArabic
              ? "عملية بسيطة وواضحة للمستخدمين ولأصحاب الأعمال، تساعد على الوصول السريع وبناء الثقة."
              : "A simple and clear process for both users and businesses, designed for fast access and stronger trust."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginTop: "28px",
              textAlign: isArabic ? "right" : "left",
            }}
          >
            {[
              {
                number: "01",
                title: isArabic ? "ابحث أو سجّل" : "Search or Register",
                text: isArabic
                  ? "المستخدم يبحث عن نشاط، أو الشركة تبدأ بتسجيل حسابها."
                  : "Users search for a business, or companies start by creating an account.",
              },
              {
                number: "02",
                title: isArabic ? "أضف المعلومات" : "Add Information",
                text: isArabic
                  ? "تتم إضافة الروابط وبيانات النشاط بشكل منظم."
                  : "Business details and official links are added in an organized way.",
              },
              {
                number: "03",
                title: isArabic ? "فعّل التحقق" : "Verify WhatsApp",
                text: isArabic
                  ? "تأكيد رقم واتساب يعزز الموثوقية أمام العملاء."
                  : "WhatsApp verification increases trust for customers.",
              },
              {
                number: "04",
                title: isArabic ? "ابدأ الاستخدام" : "Start Using",
                text: isArabic
                  ? "يصل العميل بسرعة إلى الجهة الصحيحة، وتدير الشركة حضورها بسهولة."
                  : "Customers reach the right contact faster, and businesses manage their presence easily.",
              },
            ].map((item) => (
              <div
                key={item.number}
                style={{
                  background: "#f8fafc",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "800",
                    color: "#16a34a",
                    marginBottom: "10px",
                  }}
                >
                  {item.number}
                </div>
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: "10px",
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ color: "#475569", lineHeight: "1.8", margin: 0 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation cards */}
        <section style={{ marginBottom: "28px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={sectionTitleStyle}>
              {isArabic ? "التنقل بين الصفحات" : "Move between pages"}
            </h2>
            <p style={sectionTextStyle}>
              {isArabic
                ? "كل صفحة داخل TrustedLinks لها وظيفة واضحة لتسهيل الإدارة والمتابعة."
                : "Each page inside TrustedLinks has a clear purpose to make navigation and management easier."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "18px",
            }}
          >
            {[
              {
                title: isArabic ? "Dashboard" : "Dashboard",
                text: isArabic
                  ? "عرض سريع للحساب والإحصائيات والحالة العامة."
                  : "Quick view of account status, stats, and overview.",
                link: "/dashboard",
              },
              {
                title: isArabic ? "Manage Links" : "Manage Links",
                text: isArabic
                  ? "إدارة روابط النشاط وروابط التواصل الرسمية."
                  : "Manage business links and official contact links.",
                link: "/manage-links",
              },
              {
                title: isArabic ? "WhatsApp Verify" : "WhatsApp Verify",
                text: isArabic
                  ? "توثيق رقم واتساب وربطه بالنشاط."
                  : "Verify and connect your WhatsApp number.",
                link: "/whatsapp-verify",
              },
              {
                title: isArabic ? "البحث" : "Search",
                text: isArabic
                  ? "استكشاف الأنشطة والوصول السريع إلى النتائج."
                  : "Explore businesses and reach results quickly.",
                link: "/search",
              },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.link}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    ...cardStyle,
                    height: "100%",
                    transition: "0.2s ease",
                    cursor: "pointer",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.08rem",
                      fontWeight: "700",
                      color: "#0f172a",
                      marginBottom: "10px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      color: "#64748b",
                      lineHeight: "1.8",
                      marginBottom: 0,
                    }}
                  >
                    {item.text}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "36px 24px",
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: "1.7rem",
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "14px",
            }}
          >
            {isArabic
              ? "ابدأ الآن مع TrustedLinks"
              : "Start now with TrustedLinks"}
          </h2>

          <p
            style={{
              fontSize: "1rem",
              color: "#64748b",
              lineHeight: "1.8",
              maxWidth: "760px",
              margin: "0 auto 24px",
            }}
          >
            {isArabic
              ? "سواء كنت فردًا يبحث عن جهة موثوقة، أو شركة تريد الظهور بشكل أفضل، TrustedLinks تمنحك طريقة أسهل وأوضح للتواصل."
              : "Whether you are an individual looking for a trusted contact or a business wanting better visibility, TrustedLinks gives you a clearer and easier way to connect."}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/register"
              style={{
                background: "#16a34a",
                color: "white",
                textDecoration: "none",
                padding: "12px 22px",
                borderRadius: "12px",
                fontWeight: "700",
              }}
            >
              {isArabic ? "سجّل نشاطك" : "Register Business"}
            </Link>

            <Link
              to="/search"
              style={{
                background: "#f1f5f9",
                color: "#0f172a",
                textDecoration: "none",
                padding: "12px 22px",
                borderRadius: "12px",
                fontWeight: "700",
                border: "1px solid #dbe2ea",
              }}
            >
              {isArabic ? "جرّب البحث" : "Try Search"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
