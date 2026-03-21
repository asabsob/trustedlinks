```jsx
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

  const navItems = [
    {
      title: isArabic ? "لوحة التحكم" : "Dashboard",
      desc: isArabic ? "نظرة عامة سريعة" : "Quick overview",
      to: "/dashboard",
    },
    {
      title: isArabic ? "إدارة الروابط" : "Manage Links",
      desc: isArabic ? "تنظيم روابطك" : "Organize your links",
      to: "/manage-links",
    },
    {
      title: isArabic ? "توثيق واتساب" : "WhatsApp Verify",
      desc: isArabic ? "تأكيد الرقم" : "Verify your number",
      to: "/whatsapp-verify",
    },
  ];

  return (
    <div
      style={{
        fontFamily: isArabic ? "Tajawal, sans-serif" : "Inter, sans-serif",
        direction: isArabic ? "rtl" : "ltr",
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "28px 18px 50px",
      }}
    >
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={handleBack}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#0f172a",
              boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
            }}
          >
            {isArabic ? "← رجوع" : "← Back"}
          </button>

          <div
            style={{
              fontSize: "0.92rem",
              color: "#64748b",
              fontWeight: "500",
            }}
          >
            {isArabic ? "الرئيسية" : "Home"}
          </div>
        </div>

        <section
          style={{
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            color: "#fff",
            borderRadius: "26px",
            padding: "56px 26px",
            boxShadow: "0 16px 35px rgba(34,197,94,0.18)",
            marginBottom: "24px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              maxWidth: "840px",
              margin: "0 auto",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: "0.9rem",
                fontWeight: "600",
                marginBottom: "18px",
              }}
            >
              {isArabic ? "روابط موثوقة للشركات والعملاء" : "Trusted links for businesses and customers"}
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 3.1rem)",
                fontWeight: "800",
                lineHeight: "1.2",
                marginBottom: "16px",
              }}
            >
              {isArabic
                ? "TrustedLinks تجعل الوصول إلى الشركات أكثر وضوحًا وثقة"
                : "TrustedLinks makes reaching businesses clearer and more trusted"}
            </h1>

            <p
              style={{
                fontSize: "1.06rem",
                lineHeight: "1.9",
                color: "rgba(255,255,255,0.95)",
                maxWidth: "760px",
                margin: "0 auto 28px",
              }}
            >
              {isArabic
                ? "منصة تساعد الأفراد على الوصول إلى روابط واتساب والروابط الرسمية بسرعة، وتساعد الشركات على الظهور بصورة احترافية وإدارة وجودها الرقمي بسهولة."
                : "A platform that helps people reach official links and WhatsApp contacts quickly, while helping businesses present themselves professionally and manage their digital presence with ease."}
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/search"
                style={{
                  background: "#fff",
                  color: "#16a34a",
                  textDecoration: "none",
                  padding: "13px 22px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                }}
              >
                {isArabic ? "استكشف الأنشطة" : "Explore Businesses"}
              </Link>

              <Link
                to="/register"
                style={{
                  background: "#0f172a",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "13px 22px",
                  borderRadius: "12px",
                  fontWeight: "700",
                }}
              >
                {isArabic ? "سجّل نشاطك" : "Register Your Business"}
              </Link>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "12px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic ? "للأفراد" : "For Individuals"}
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: "1.9",
                margin: 0,
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic
                ? "ابحث بسهولة عن الشركات، وصل بسرعة إلى جهة التواصل الصحيحة، وتجنب الروابط غير الواضحة أو غير الموثوقة."
                : "Search for businesses easily, reach the right contact faster, and avoid unclear or untrusted links."}
            </p>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "12px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic ? "للشركات" : "For Businesses"}
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: "1.9",
                margin: 0,
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic
                ? "اعرض روابطك الرسمية، فعّل توثيق واتساب، وقدم حضورًا رقميًا أكثر مهنية وثقة أمام العملاء."
                : "Show your official links, verify WhatsApp, and build a more professional and trusted digital presence for customers."}
            </p>
          </div>
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: "22px",
            padding: "28px 24px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            marginBottom: "24px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <h2
              style={{
                fontSize: "1.55rem",
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: "10px",
              }}
            >
              {isArabic ? "كيف تعمل المنصة" : "How it works"}
            </h2>
            <p
              style={{
                color: "#64748b",
                lineHeight: "1.8",
                maxWidth: "720px",
                margin: "0 auto",
              }}
            >
              {isArabic
                ? "تجربة بسيطة تساعد المستخدمين على الوصول، وتساعد الشركات على الإدارة والظهور بشكل أفضل."
                : "A simple experience that helps users reach businesses and helps companies manage their presence better."}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            {[
              {
                no: "01",
                title: isArabic ? "ابحث أو سجّل" : "Search or Register",
              },
              {
                no: "02",
                title: isArabic ? "أضف بياناتك" : "Add Your Details",
              },
              {
                no: "03",
                title: isArabic ? "فعّل التوثيق" : "Verify WhatsApp",
              },
              {
                no: "04",
                title: isArabic ? "ابدأ التواصل" : "Start Connecting",
              },
            ].map((step) => (
              <div
                key={step.no}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "16px",
                  padding: "18px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#16a34a",
                    fontWeight: "800",
                    fontSize: "0.92rem",
                    marginBottom: "8px",
                  }}
                >
                  {step.no}
                </div>
                <div
                  style={{
                    color: "#0f172a",
                    fontWeight: "700",
                    fontSize: "1rem",
                  }}
                >
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: "22px",
            padding: "24px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div style={{ textAlign: isArabic ? "right" : "left" }}>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "800",
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                {isArabic ? "تنقل سريع" : "Quick navigation"}
              </h2>
              <p
                style={{
                  color: "#64748b",
                  margin: 0,
                  lineHeight: "1.8",
                }}
              >
                {isArabic
                  ? "وصول أسهل إلى أهم الصفحات بدون ازدحام بصري."
                  : "Easy access to key pages without visual clutter."}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {navItems.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                style={{
                  textDecoration: "none",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  minWidth: "200px",
                  flex: "1 1 220px",
                  color: "#0f172a",
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    marginBottom: "4px",
                    fontSize: "1rem",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: "0.92rem",
                    color: "#64748b",
                  }}
                >
                  {item.desc}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section
          style={{
            background: "linear-gradient(180deg, #ffffff, #f8fafc)",
            borderRadius: "22px",
            padding: "34px 24px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "1.65rem",
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "12px",
            }}
          >
            {isArabic ? "ابدأ الآن مع TrustedLinks" : "Start now with TrustedLinks"}
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: "1.8",
              maxWidth: "760px",
              margin: "0 auto 22px",
            }}
          >
            {isArabic
              ? "سواء كنت تبحث عن شركة موثوقة أو تريد تسجيل نشاطك التجاري، المنصة تمنحك تجربة أوضح وأسهل."
              : "Whether you are looking for a trusted business or want to register your own, the platform gives you a clearer and easier experience."}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/register"
              style={{
                background: "#16a34a",
                color: "#fff",
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
                background: "#fff",
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
```
