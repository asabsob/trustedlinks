import React from "react";
import { Link } from "react-router-dom";

export default function Home({ lang }) {
  const isArabic = lang === "ar";

  // =========================
  // Update with platform WhatsApp number
  // Example: 962790000000
  // =========================
  const whatsappNumber = "97472097723";
  const whatsappMessage = isArabic
    ? "مرحبا، أريد البحث عن نشاط عبر TrustedLinks"
    : "Hello, I want to search for a business via TrustedLinks";

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    whatsappLink
  )}`;

  const businessSteps = isArabic
    ? [
        {
          no: "01",
          title: "أنشئ ملف نشاطك",
          desc: "أضف اسم النشاط والبيانات الأساسية.",
        },
        {
          no: "02",
          title: "أضف الروابط والوصف",
          desc: "واتساب، الموقع، والوصف المناسب.",
        },
        {
          no: "03",
          title: "فعّل التوثيق",
          desc: "زد الثقة واجعل الوصول أوضح.",
        },
      ]
    : [
        {
          no: "01",
          title: "Create your profile",
          desc: "Add your business name and core details.",
        },
        {
          no: "02",
          title: "Add links and description",
          desc: "WhatsApp, location, and clear profile info.",
        },
        {
          no: "03",
          title: "Verify and grow",
          desc: "Build trust and make discovery easier.",
        },
      ];

  return (
    <div
      style={{
        fontFamily: isArabic ? "Tajawal, sans-serif" : "Inter, sans-serif",
        direction: isArabic ? "rtl" : "ltr",
        background:
          "radial-gradient(circle at top, rgba(34,197,94,0.08), transparent 28%), #f8fafc",
        minHeight: "100vh",
        padding: "24px 14px 50px",
      }}
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        {/* HERO */}
        <section
          style={{
            position: "relative",
            background: "linear-gradient(135deg, #16a34a 0%, #22c55e 55%, #4ade80 100%)",
            color: "#fff",
            borderRadius: "30px",
            padding: "56px 24px",
            boxShadow: "0 24px 60px rgba(34,197,94,0.20)",
            marginBottom: "22px",
            overflow: "hidden",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "260px",
              height: "260px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.10)",
              top: "-80px",
              [isArabic ? "left" : "right"]: "-70px",
              filter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "180px",
              height: "180px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              bottom: "-50px",
              [isArabic ? "right" : "left"]: "-40px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "840px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "9px 16px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.20)",
                fontSize: "0.86rem",
                fontWeight: "700",
                marginBottom: "18px",
                backdropFilter: "blur(6px)",
              }}
            >
              {isArabic ? "اكتشاف أوضح ووصول أسرع" : "Clearer discovery, faster access"}
            </div>

            <h1
              style={{
                fontSize: "clamp(2.1rem, 5vw, 3.6rem)",
                fontWeight: "900",
                lineHeight: "1.08",
                margin: "0 0 16px",
                letterSpacing: "-0.02em",
              }}
            >
              {isArabic
                ? "الوصول إلى الأنشطة أصبح أبسط وأكثر موثوقية"
                : "Reaching trusted businesses just became simpler"}
            </h1>

            <p
              style={{
                maxWidth: "760px",
                margin: "0 auto 28px",
                color: "rgba(255,255,255,0.96)",
                lineHeight: "1.95",
                fontSize: "1.02rem",
              }}
            >
              {isArabic
                ? "TrustedLinks تربط الأفراد بالشركات من خلال تجربة واضحة: اكتشف النشاط، افتح جهة التواصل، أو سجّل نشاطك ليصل إليك العملاء بسهولة."
                : "TrustedLinks helps people discover businesses, reach the right contact faster, and helps businesses present themselves more clearly."}
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
                  padding: "14px 24px",
                  borderRadius: "14px",
                  fontWeight: "800",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
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
                  padding: "14px 24px",
                  borderRadius: "14px",
                  fontWeight: "800",
                  boxShadow: "0 10px 25px rgba(15,23,42,0.18)",
                }}
              >
                {isArabic ? "سجّل نشاطك" : "Register Your Business"}
              </Link>
            </div>
          </div>
        </section>

        {/* PREMIUM SPLIT SECTION */}
        <section
          className="premium-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.08fr 0.92fr",
            gap: "18px",
            marginBottom: "22px",
          }}
        >
          {/* Businesses card */}
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(10px)",
              borderRadius: "26px",
              padding: "26px",
              border: "1px solid rgba(226,232,240,0.95)",
              boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "7px 13px",
                borderRadius: "999px",
                background: "#ecfdf5",
                color: "#16a34a",
                fontSize: "0.82rem",
                fontWeight: "800",
                marginBottom: "16px",
              }}
            >
              {isArabic ? "للشركات" : "For Businesses"}
            </div>

            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: "900",
                color: "#0f172a",
                margin: "0 0 10px",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic
                ? "قدّم نشاطك بصورة احترافية"
                : "Present your business with clarity"}
            </h2>

            <p
              style={{
                color: "#64748b",
                lineHeight: "1.9",
                margin: "0 0 20px",
                textAlign: isArabic ? "right" : "left",
                fontSize: "0.98rem",
              }}
            >
              {isArabic
                ? "أضف بيانات نشاطك، روابطك الرسمية، ورقم واتساب لتسهيل وصول العملاء إلى جهة التواصل الصحيحة."
                : "Add your business details, official links, and WhatsApp so customers can reach the right contact point faster."}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {businessSteps.map((step) => (
                <div
                  key={step.no}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "18px",
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      color: "#16a34a",
                      fontWeight: "900",
                      fontSize: "0.84rem",
                      marginBottom: "10px",
                    }}
                  >
                    {step.no}
                  </div>

                  <div
                    style={{
                      color: "#0f172a",
                      fontWeight: "800",
                      lineHeight: "1.55",
                      marginBottom: "6px",
                    }}
                  >
                    {step.title}
                  </div>

                  <div
                    style={{
                      color: "#64748b",
                      lineHeight: "1.7",
                      fontSize: "0.92rem",
                    }}
                  >
                    {step.desc}
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
                borderRadius: "14px",
                fontWeight: "800",
              }}
            >
              {isArabic ? "ابدأ تسجيل نشاطك" : "Start Business Registration"}
            </Link>
          </div>

          {/* Individuals card */}
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(10px)",
              borderRadius: "26px",
              padding: "26px",
              border: "1px solid rgba(226,232,240,0.95)",
              boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "7px 13px",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "0.82rem",
                fontWeight: "800",
                marginBottom: "16px",
              }}
            >
              {isArabic ? "للأفراد" : "For Individuals"}
            </div>

            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: "900",
                color: "#0f172a",
                margin: "0 0 10px",
              }}
            >
              {isArabic ? "ابحث عبر واتساب" : "Search via WhatsApp"}
            </h2>

            <p
              style={{
                color: "#64748b",
                lineHeight: "1.85",
                margin: "0 0 18px",
                fontSize: "0.98rem",
              }}
            >
              {isArabic
                ? "امسح رمز QR وافتح واتساب المنصة، ثم ابدأ البحث باسم النشاط أو الفئة."
                : "Scan the QR code, open the platform WhatsApp, and start searching by business name or category."}
            </p>

            <div
              style={{
                background: "linear-gradient(180deg, #f8fafc, #ffffff)",
                border: "1px solid #e2e8f0",
                borderRadius: "22px",
                padding: "20px",
              }}
            >
              <img
                src={qrCodeUrl}
                alt={isArabic ? "رمز واتساب" : "WhatsApp QR"}
                style={{
                  width: "100%",
                  maxWidth: "240px",
                  borderRadius: "16px",
                  background: "#fff",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
                }}
              />

              <div
                style={{
                  marginTop: "16px",
                  color: "#0f172a",
                  fontWeight: "800",
                  fontSize: "1rem",
                }}
              >
                {isArabic ? "امسح الرمز وابدأ البحث" : "Scan and start searching"}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  color: "#64748b",
                  fontSize: "0.92rem",
                  lineHeight: "1.75",
                }}
              >
                {isArabic
                  ? "أو افتح واتساب مباشرة من الزر التالي."
                  : "Or open WhatsApp directly from the button below."}
              </div>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  background: "#16a34a",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "12px 18px",
                  borderRadius: "14px",
                  fontWeight: "800",
                }}
              >
                {isArabic ? "فتح واتساب المنصة" : "Open Platform WhatsApp"}
              </a>
            </div>
          </div>
        </section>

        {/* VALUE STRIP */}
        <section
          className="value-strip"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          {[
            {
              title: isArabic ? "وصول أسرع" : "Faster access",
              desc: isArabic
                ? "الوصول إلى جهة التواصل الرسمية بسرعة أكبر."
                : "Reach the right contact point faster.",
            },
            {
              title: isArabic ? "صورة أوضح" : "Clearer presence",
              desc: isArabic
                ? "عرض النشاط بطريقة أبسط وأكثر مهنية."
                : "Present a business more clearly and professionally.",
            },
            {
              title: isArabic ? "تجربة أسهل" : "Simpler experience",
              desc: isArabic
                ? "تقليل الوقت والارتباك أثناء البحث."
                : "Reduce time and confusion while searching.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#fff",
                borderRadius: "20px",
                padding: "20px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
              }}
            >
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "900",
                  color: "#0f172a",
                  marginBottom: "8px",
                  textAlign: isArabic ? "right" : "left",
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  color: "#64748b",
                  lineHeight: "1.8",
                  textAlign: isArabic ? "right" : "left",
                  fontSize: "0.95rem",
                }}
              >
                {item.desc}
              </div>
            </div>
          ))}
        </section>

        {/* FINAL CTA */}
        <section
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,1))",
            borderRadius: "26px",
            padding: "34px 22px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
          }}
        >
          <h2
            style={{
              fontSize: "1.65rem",
              fontWeight: "900",
              color: "#0f172a",
              marginBottom: "12px",
            }}
          >
            {isArabic ? "ابدأ الآن مع TrustedLinks" : "Start now with TrustedLinks"}
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: "1.85",
              maxWidth: "700px",
              margin: "0 auto 22px",
              fontSize: "0.98rem",
            }}
          >
            {isArabic
              ? "للشركات: سجّل نشاطك ليصبح الوصول إليك أسهل. للأفراد: امسح الرمز وابدأ البحث مباشرة."
              : "For businesses: register your profile and become easier to reach. For individuals: scan the code and start searching instantly."}
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
                padding: "13px 22px",
                borderRadius: "14px",
                fontWeight: "800",
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
                padding: "13px 22px",
                borderRadius: "14px",
                fontWeight: "800",
                border: "1px solid #dbe2ea",
              }}
            >
              {isArabic ? "ابدأ البحث" : "Start Search"}
            </a>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 920px) {
          .premium-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          .value-strip {
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
