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

  // =========================
  // WhatsApp QR setup
  // غيّر الرقم أدناه إلى رقم واتساب المنصة
  // مثال: 9627XXXXXXXX
  // =========================
  const whatsappNumber = "97472097723";
  const whatsappMessage = isArabic
    ? "مرحبا، أريد البحث عن نشاط عبر TrustedLinks"
    : "Hello, I want to search for a business via TrustedLinks";

const whatsappLink = `https://wa.me/${whatsappNumber}`;
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    whatsappLink
  )}`;

  const navItems = [
    {
      title: isArabic ? "لوحة التحكم" : "Dashboard",
      desc: isArabic ? "نظرة عامة سريعة" : "Quick overview",
      to: "/dashboard",
    },
    {
      title: isArabic ? "إدارة الروابط" : "Manage Links",
      desc: isArabic ? "تنظيم وتحديث بيانات نشاطك" : "Manage and update your business profile",
      to: "/manage-links",
    },
    {
      title: isArabic ? "استكشاف الأنشطة" : "Explore Businesses",
      desc: isArabic ? "تصفح الأنشطة المدرجة" : "Browse listed businesses",
      to: "/search",
    },
  ];

  const businessSteps = isArabic
    ? [
        {
          no: "01",
          title: "سجّل نشاطك",
          desc: "أنشئ ملف نشاطك التجاري وابدأ بإضافة بياناته الأساسية.",
        },
        {
          no: "02",
          title: "أضف الروابط والبيانات",
          desc: "أضف رابط واتساب، الموقع، الوصف، والكلمات المفتاحية.",
        },
        {
          no: "03",
          title: "فعّل التوثيق",
          desc: "وثّق رقم واتساب ليظهر نشاطك بصورة أكثر موثوقية.",
        },
        {
          no: "04",
          title: "ابدأ الظهور للعملاء",
          desc: "يصبح نشاطك قابلاً للوصول والبحث من قبل المستخدمين بسهولة.",
        },
      ]
    : [
        {
          no: "01",
          title: "Register your business",
          desc: "Create your business profile and start adding the core details.",
        },
        {
          no: "02",
          title: "Add links and profile info",
          desc: "Add WhatsApp, location, description, and keywords.",
        },
        {
          no: "03",
          title: "Verify WhatsApp",
          desc: "Verify your WhatsApp number to build more trust.",
        },
        {
          no: "04",
          title: "Start getting discovered",
          desc: "Your business becomes easier for customers to find and reach.",
        },
      ];

  return (
    <div
      style={{
        fontFamily: isArabic ? "Tajawal, sans-serif" : "Inter, sans-serif",
        direction: isArabic ? "rtl" : "ltr",
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "20px 14px 40px",
      }}
    >
      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
        {/* Topbar */}
        <div
          className="home-topbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "18px",
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

        {/* Hero */}
        <section
          style={{
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            color: "#fff",
            borderRadius: "24px",
            padding: "42px 20px",
            boxShadow: "0 16px 35px rgba(34,197,94,0.18)",
            marginBottom: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              maxWidth: "860px",
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
                fontSize: "0.88rem",
                fontWeight: "600",
                marginBottom: "16px",
              }}
            >
              {isArabic
                ? "منصة تسهّل الوصول إلى الأنشطة"
                : "A simpler way to reach businesses"}
            </div>

            <h1
              style={{
                fontSize: "clamp(1.8rem, 5vw, 3rem)",
                fontWeight: "800",
                lineHeight: "1.2",
                marginBottom: "14px",
              }}
            >
              {isArabic
                ? "TrustedLinks تربط العملاء بالشركات بسرعة وثقة"
                : "TrustedLinks connects customers with businesses quickly and clearly"}
            </h1>

            <p
              style={{
                fontSize: "1rem",
                lineHeight: "1.9",
                color: "rgba(255,255,255,0.95)",
                maxWidth: "760px",
                margin: "0 auto 24px",
              }}
            >
              {isArabic
                ? "سواء كنت فردًا يبحث عن جهة تواصل موثوقة، أو شركة تريد الظهور بصورة احترافية، تساعدك المنصة على الوصول السريع والتواصل المباشر."
                : "Whether you are an individual looking for a trusted contact or a business seeking better visibility, the platform helps make discovery and communication easier."}
            </p>

            <div
              className="hero-actions"
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

        {/* Two main sections */}
        <section
          className="intro-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 1fr",
            gap: "18px",
            marginBottom: "20px",
          }}
        >
          {/* Businesses */}
          <div
            style={{
              background: "#fff",
              borderRadius: "22px",
              padding: "24px 20px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "999px",
                background: "#ecfdf5",
                color: "#16a34a",
                fontSize: "0.85rem",
                fontWeight: "700",
                marginBottom: "14px",
              }}
            >
              {isArabic ? "للشركات" : "For Businesses"}
            </div>

            <h2
              style={{
                fontSize: "1.45rem",
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: "10px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic
                ? "كيف تستفيد الشركات من المنصة؟"
                : "How businesses benefit from the platform"}
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: "1.9",
                margin: "0 0 18px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic
                ? "تساعد TrustedLinks الشركات على عرض جهة التواصل الرسمية، تحسين الظهور، وتسهيل وصول العملاء إلى رقم واتساب والموقع والروابط المهمة."
                : "TrustedLinks helps businesses show their official contact point, improve visibility, and make it easier for customers to reach WhatsApp, location, and key links."}
            </p>

            <div
              className="steps-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "12px",
              }}
            >
              {businessSteps.map((step) => (
                <div
                  key={step.no}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      color: "#16a34a",
                      fontWeight: "800",
                      fontSize: "0.9rem",
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
                      marginBottom: "8px",
                      lineHeight: "1.5",
                    }}
                  >
                    {step.title}
                  </div>

                  <div
                    style={{
                      color: "#64748b",
                      lineHeight: "1.8",
                      fontSize: "0.93rem",
                    }}
                  >
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "18px" }}>
              <Link
                to="/register"
                style={{
                  display: "inline-block",
                  background: "#16a34a",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  fontWeight: "700",
                }}
              >
                {isArabic ? "ابدأ تسجيل نشاطك" : "Start registering your business"}
              </Link>
            </div>
          </div>

          {/* Individuals */}
          <div
            style={{
              background: "#fff",
              borderRadius: "22px",
              padding: "24px 20px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "0.85rem",
                fontWeight: "700",
                marginBottom: "14px",
              }}
            >
              {isArabic ? "للأفراد" : "For Individuals"}
            </div>

            <h2
              style={{
                fontSize: "1.45rem",
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: "10px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic
                ? "ابحث من واتساب مباشرة"
                : "Search directly from WhatsApp"}
            </h2>

            <p
              style={{
                color: "#475569",
                lineHeight: "1.9",
                margin: "0 0 18px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic
                ? "امسح رمز QR لفتح واتساب المنصة، ثم ابدأ البحث باسم النشاط أو الفئة أو الموقع للحصول على جهة التواصل المناسبة."
                : "Scan the QR code to open the platform WhatsApp, then start searching by business name, category, or location."}
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "18px",
                textAlign: "center",
              }}
            >
              <img
                src={qrCodeUrl}
                alt={isArabic ? "رمز واتساب" : "WhatsApp QR"}
                style={{
                  width: "100%",
                  maxWidth: "230px",
                  borderRadius: "14px",
                  background: "#fff",
                  padding: "10px",
                  border: "1px solid #e5e7eb",
                }}
              />

              <div
                style={{
                  marginTop: "14px",
                  color: "#0f172a",
                  fontWeight: "700",
                  lineHeight: "1.8",
                }}
              >
                {isArabic
                  ? "امسح الرمز وابدأ البحث"
                  : "Scan the code and start searching"}
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "0.92rem",
                  lineHeight: "1.8",
                }}
              >
                {isArabic
                  ? "يمكنك أيضًا الضغط على الزر وفتح واتساب مباشرة."
                  : "You can also open WhatsApp directly using the button below."}
              </div>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "14px",
                  background: "#16a34a",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  fontWeight: "700",
                }}
              >
                {isArabic ? "فتح واتساب المنصة" : "Open Platform WhatsApp"}
              </a>
            </div>
          </div>
        </section>

        {/* Simple benefits */}
        <section
          className="benefits-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {[
            {
              title: isArabic ? "وصول أسرع" : "Faster access",
              desc: isArabic
                ? "الوصول إلى جهة التواصل الرسمية بشكل أوضح."
                : "Reach the official contact point more clearly.",
            },
            {
              title: isArabic ? "ثقة أعلى" : "More trust",
              desc: isArabic
                ? "إظهار الروابط وبيانات النشاط بطريقة أكثر موثوقية."
                : "Show links and business data in a more trusted way.",
            },
            {
              title: isArabic ? "تجربة أبسط" : "Simpler experience",
              desc: isArabic
                ? "تقليل الوقت والارتباك في الوصول إلى النشاط المناسب."
                : "Reduce the time and confusion in finding the right business.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#fff",
                borderRadius: "18px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.08rem",
                  fontWeight: "800",
                  color: "#0f172a",
                  marginBottom: "8px",
                  textAlign: isArabic ? "right" : "left",
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  color: "#64748b",
                  lineHeight: "1.9",
                  margin: 0,
                  textAlign: isArabic ? "right" : "left",
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Quick navigation */}
        <section
          style={{
            background: "#fff",
            borderRadius: "22px",
            padding: "24px 18px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
            marginBottom: "20px",
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
                  fontSize: "1.3rem",
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
                  ? "وصول أسهل إلى أهم الصفحات."
                  : "Quick access to the main pages."}
              </p>
            </div>
          </div>

          <div
            className="nav-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
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
                  padding: "16px",
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

        {/* Final CTA */}
        <section
          style={{
            background: "linear-gradient(180deg, #ffffff, #f8fafc)",
            borderRadius: "22px",
            padding: "30px 20px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
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
              ? "إذا كنت شركة، سجّل نشاطك. وإذا كنت فردًا، امسح الرمز وابدأ البحث مباشرة."
              : "If you are a business, register your profile. If you are an individual, scan the code and start searching instantly."}
          </p>

          <div
            className="cta-actions"
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

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
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
              {isArabic ? "ابدأ البحث عبر واتساب" : "Start Search on WhatsApp"}
            </a>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .intro-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .home-topbar {
            align-items: stretch !important;
          }
        }

        @media (max-width: 640px) {
          .hero-actions,
          .cta-actions {
            flex-direction: column;
          }

          .hero-actions a,
          .cta-actions a {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
