import React from "react";
import { Link } from "react-router-dom";

export default function Home({ lang }) {
  const isArabic = lang === "ar";

  const whatsappNumber = "97472097723";
  const whatsappMessage = isArabic
    ? "مرحبا، أريد البحث عن نشاط عبر TrustedLinks"
    : "Hello, I want to search for a business via TrustedLinks";

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    whatsappLink
  )}`;

  const businessSteps = isArabic
    ? [
        "سجّل نشاطك",
        "أضف البيانات والروابط",
        "فعّل واتساب",
        "ابدأ الظهور",
      ]
    : [
        "Register business",
        "Add profile details",
        "Verify WhatsApp",
        "Start getting discovered",
      ];

  return (
    <div
      style={{
        fontFamily: isArabic ? "Tajawal, sans-serif" : "Inter, sans-serif",
        direction: isArabic ? "rtl" : "ltr",
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "24px 14px 40px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* HERO */}
        <section
          style={{
            background: "linear-gradient(135deg, #16a34a, #22c55e)",
            color: "#fff",
            borderRadius: "28px",
            padding: "48px 22px",
            boxShadow: "0 18px 40px rgba(34,197,94,0.18)",
            marginBottom: "22px",
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
              fontSize: "0.85rem",
              fontWeight: "700",
              marginBottom: "16px",
            }}
          >
            {isArabic ? "طريقة أبسط للوصول إلى الأنشطة" : "A simpler way to reach businesses"}
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: "800",
              lineHeight: "1.15",
              margin: "0 0 14px",
              maxWidth: "780px",
              marginInline: "auto",
            }}
          >
            {isArabic
              ? "TrustedLinks تربط العملاء بالشركات بسرعة"
              : "TrustedLinks connects customers with businesses quickly"}
          </h1>

          <p
            style={{
              maxWidth: "700px",
              margin: "0 auto 24px",
              color: "rgba(255,255,255,0.95)",
              lineHeight: "1.9",
              fontSize: "1rem",
            }}
          >
            {isArabic
              ? "ابحث، تواصل، أو سجّل نشاطك في تجربة أوضح وأبسط."
              : "Search, connect, or register your business in a simpler experience."}
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
        </section>

        {/* TWO MAIN CARDS */}
        <section
          className="main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: "18px",
            marginBottom: "22px",
          }}
        >
          {/* BUSINESSES */}
          <div
            style={{
              background: "#fff",
              borderRadius: "22px",
              padding: "24px",
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
                fontSize: "0.82rem",
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
                margin: "0 0 10px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic ? "اعرض نشاطك بشكل أوضح" : "Show your business more clearly"}
            </h2>

            <p
              style={{
                color: "#64748b",
                lineHeight: "1.9",
                margin: "0 0 18px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic
                ? "أضف بيانات نشاطك، فعّل واتساب، وسهّل وصول العملاء إليك."
                : "Add your business details, verify WhatsApp, and make it easier for customers to reach you."}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              {businessSteps.map((step, i) => (
                <div
                  key={step}
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
                      fontSize: "0.85rem",
                      marginBottom: "8px",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  <div
                    style={{
                      color: "#0f172a",
                      fontWeight: "700",
                      lineHeight: "1.6",
                    }}
                  >
                    {step}
                  </div>
                </div>
              ))}
            </div>

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
              {isArabic ? "ابدأ التسجيل" : "Start Registration"}
            </Link>
          </div>

          {/* INDIVIDUALS */}
          <div
            style={{
              background: "#fff",
              borderRadius: "22px",
              padding: "24px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "0.82rem",
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
                margin: "0 0 10px",
              }}
            >
              {isArabic ? "ابحث عبر واتساب" : "Search through WhatsApp"}
            </h2>

            <p
              style={{
                color: "#64748b",
                lineHeight: "1.8",
                margin: "0 0 16px",
              }}
            >
              {isArabic
                ? "امسح الرمز وابدأ البحث مباشرة."
                : "Scan the code and start searching instantly."}
            </p>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                padding: "18px",
              }}
            >
              <img
                src={qrCodeUrl}
                alt={isArabic ? "رمز واتساب" : "WhatsApp QR"}
                style={{
                  width: "100%",
                  maxWidth: "220px",
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
                }}
              >
                {isArabic ? "امسح الرمز وابدأ البحث" : "Scan and start searching"}
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

        {/* SIMPLE FINAL CTA */}
        <section
          style={{
            background: "#fff",
            borderRadius: "22px",
            padding: "26px 20px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "1.45rem",
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: "10px",
            }}
          >
            {isArabic ? "ابدأ الآن" : "Start now"}
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: "1.8",
              maxWidth: "680px",
              margin: "0 auto 20px",
            }}
          >
            {isArabic
              ? "للشركات: سجّل نشاطك. للأفراد: امسح الرمز وابدأ البحث."
              : "For businesses: register your profile. For individuals: scan the code and start searching."}
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
              {isArabic ? "ابدأ البحث" : "Start Search"}
            </a>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .main-grid {
            grid-template-columns: 1fr !important;
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
