import React from "react";
import { Link } from "react-router-dom";

export default function Home({ lang }) {
  const isArabic = lang === "ar";

  const whatsappNumber = "97472097723";
  const whatsappMessage = isArabic
    ? "مرحباً، أريد البحث عن شركة أو نشاط عبر TrustedLinks"
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
          desc: "أضف اسم النشاط وبياناته الأساسية بطريقة واضحة واحترافية.",
        },
        {
          no: "02",
          title: "أضف الروابط والوصف",
          desc: "أدخل واتساب النشاط، الموقع، ووصفاً مختصراً يساعد العملاء.",
        },
        {
          no: "03",
          title: "فعّل التوثيق",
          desc: "ارفع مستوى الثقة واجعل الوصول إلى نشاطك أسهل وأوضح.",
        },
      ]
    : [
        {
          no: "01",
          title: "Create your profile",
          desc: "Add your business name and essential details clearly.",
        },
        {
          no: "02",
          title: "Add links and description",
          desc: "Include WhatsApp, location, and a short helpful description.",
        },
        {
          no: "03",
          title: "Enable verification",
          desc: "Build trust and make your business easier to reach.",
        },
      ];

  const valueItems = isArabic
    ? [
        {
          title: "وصول أسرع",
          desc: "الوصول إلى جهة التواصل الرسمية بسرعة وبخطوات أقل.",
        },
        {
          title: "صورة أوضح",
          desc: "عرض النشاط بطريقة أكثر احترافية ووضوحاً للعملاء.",
        },
        {
          title: "تجربة أسهل",
          desc: "تقليل الوقت والارتباك أثناء البحث والوصول.",
        },
      ]
    : [
        {
          title: "Faster access",
          desc: "Reach the official contact point in fewer steps.",
        },
        {
          title: "Clearer presence",
          desc: "Present businesses more professionally and clearly.",
        },
        {
          title: "Simpler experience",
          desc: "Reduce time and confusion while searching and connecting.",
        },
      ];

  return (
    <div
      style={{
        fontFamily: isArabic ? "Tajawal, sans-serif" : "Inter, sans-serif",
        direction: isArabic ? "rtl" : "ltr",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(34,197,94,0.08), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "26px 14px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "1160px",
          margin: "0 auto",
        }}
      >
        {/* HERO */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "30px",
            padding: "64px 24px",
            marginBottom: "24px",
            textAlign: "center",
            background:
              "linear-gradient(135deg, #16a34a 0%, #22c55e 52%, #4ade80 100%)",
            color: "#fff",
            boxShadow: "0 24px 60px rgba(34,197,94,0.20)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "250px",
              height: "250px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.10)",
              top: "-90px",
              [isArabic ? "left" : "right"]: "-70px",
              filter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "180px",
              height: "180px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.08)",
              bottom: "-55px",
              [isArabic ? "right" : "left"]: "-35px",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              maxWidth: "850px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "inline-block",
                marginBottom: "16px",
                padding: "8px 15px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.20)",
                fontWeight: "800",
                fontSize: "0.86rem",
                backdropFilter: "blur(6px)",
              }}
            >
              {isArabic
                ? "اكتشاف أوضح ووصول أسرع"
                : "Clearer discovery, faster access"}
            </div>

            <h1
              style={{
                margin: "0 0 14px",
                fontWeight: "900",
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                lineHeight: "1.08",
                letterSpacing: "-0.03em",
              }}
            >
              {isArabic
                ? "الوصول إلى الشركات أصبح أسهل وأكثر موثوقية"
                : "Reaching trusted businesses just became easier"}
            </h1>

            <p
              style={{
                maxWidth: "760px",
                margin: "0 auto 12px",
                fontSize: "1rem",
                lineHeight: "1.95",
                color: "rgba(255,255,255,0.96)",
              }}
            >
              {isArabic
                ? "TrustedLinks تساعد الأفراد على اكتشاف الأنشطة والوصول إلى جهة التواصل الصحيحة بسرعة، وتساعد الشركات على عرض نشاطها بطريقة أوضح وأكثر احترافية."
                : "TrustedLinks helps people discover businesses, reach the right contact faster, and helps businesses present themselves more clearly."}
            </p>

            <p
              style={{
                margin: "0 auto 28px",
                fontSize: "0.96rem",
                lineHeight: "1.9",
                color: "rgba(255,255,255,0.92)",
                fontWeight: "700",
              }}
            >
              {isArabic
                ? "يعمل بالكامل عبر واتساب — بدون تحميل تطبيق"
                : "Works fully via WhatsApp — no app needed"}
            </p>

            <div
              className="hero-actions"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "210px",
                  padding: "14px 24px",
                  borderRadius: "15px",
                  textDecoration: "none",
                  background: "#fff",
                  color: "#16a34a",
                  fontWeight: "900",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
                }}
              >
                {isArabic ? "ابدأ البحث الآن" : "Start Search Now"}
              </a>

              <Link
                to="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "210px",
                  padding: "14px 24px",
                  borderRadius: "15px",
                  textDecoration: "none",
                  background: "#0f172a",
                  color: "#fff",
                  fontWeight: "900",
                  boxShadow: "0 10px 24px rgba(15,23,42,0.18)",
                }}
              >
                {isArabic ? "سجّل نشاطك مجاناً" : "Register Your Business Free"}
              </Link>
            </div>
          </div>
        </section>

        {/* MAIN SPLIT */}
        <section
          className="premium-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "18px",
            marginBottom: "20px",
            alignItems: "stretch",
          }}
        >
          {/* Individuals */}
          <div
            style={{
              background: "rgba(255,255,255,0.94)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
              borderRadius: "26px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
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
                fontWeight: "900",
                marginBottom: "16px",
              }}
            >
              {isArabic ? "للأفراد" : "For Individuals"}
            </div>

            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "1.65rem",
                fontWeight: "900",
                color: "#0f172a",
                maxWidth: "430px",
              }}
            >
              {isArabic ? "ابحث مباشرة عبر واتساب" : "Search directly via WhatsApp"}
            </h2>

            <p
              style={{
                margin: "0 0 18px",
                color: "#64748b",
                lineHeight: "1.85",
                fontSize: "0.98rem",
                maxWidth: "430px",
              }}
            >
              {isArabic
                ? "امسح رمز QR وافتح واتساب المنصة، ثم ابدأ البحث باسم الشركة أو نوع النشاط."
                : "Scan the QR code, open the platform WhatsApp, and search by business name or category."}
            </p>

            <div
              style={{
                width: "100%",
                maxWidth: "360px",
                background: "linear-gradient(180deg, #f8fafc, #ffffff)",
                border: "1px solid #e2e8f0",
                borderRadius: "22px",
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              <img
                src={qrCodeUrl}
                alt={isArabic ? "رمز واتساب" : "WhatsApp QR"}
                style={{
                  width: "100%",
                  maxWidth: "220px",
                  display: "block",
                  borderRadius: "16px",
                  background: "#fff",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
                  marginBottom: "16px",
                }}
              />

              <div
                style={{
                  color: "#0f172a",
                  fontWeight: "900",
                  fontSize: "1rem",
                  marginBottom: "8px",
                }}
              >
                {isArabic ? "امسح الرمز وابدأ البحث" : "Scan and start searching"}
              </div>

              <div
                style={{
                  color: "#64748b",
                  fontSize: "0.92rem",
                  lineHeight: "1.75",
                  maxWidth: "285px",
                  marginBottom: "8px",
                }}
              >
                {isArabic
                  ? "أو افتح واتساب مباشرة من الزر التالي."
                  : "Or open WhatsApp directly from the button below."}
              </div>

              <div
                style={{
                  color: "#16a34a",
                  fontSize: "0.88rem",
                  fontWeight: "800",
                  marginBottom: "16px",
                }}
              >
                {isArabic ? "لا يحتاج تحميل تطبيق" : "No app download needed"}
              </div>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#16a34a",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "13px 18px",
                  borderRadius: "14px",
                  fontWeight: "900",
                  minWidth: "230px",
                  boxShadow: "0 10px 25px rgba(22,163,74,0.18)",
                }}
              >
                {isArabic ? "فتح واتساب المنصة" : "Open Platform WhatsApp"}
              </a>
            </div>
          </div>

          {/* Businesses */}
          <div
            style={{
              background: "rgba(255,255,255,0.94)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
              borderRadius: "26px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "7px 13px",
                  borderRadius: "999px",
                  background: "#ecfdf5",
                  color: "#16a34a",
                  fontSize: "0.82rem",
                  fontWeight: "900",
                  marginBottom: "16px",
                }}
              >
                {isArabic ? "للشركات" : "For Businesses"}
              </div>

              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: "1.65rem",
                  fontWeight: "900",
                  color: "#0f172a",
                  textAlign: isArabic ? "right" : "left",
                }}
              >
                {isArabic
                  ? "اجعل نشاطك أسهل وصولاً للعملاء"
                  : "Make your business easier to reach"}
              </h2>

              <p
                style={{
                  margin: "0 0 22px",
                  color: "#64748b",
                  lineHeight: "1.9",
                  fontSize: "0.98rem",
                  textAlign: isArabic ? "right" : "left",
                }}
              >
                {isArabic
                  ? "أضف بيانات نشاطك، روابطك الرسمية، ورقم واتساب لتسهيل وصول العملاء إلى جهة التواصل الصحيحة بسرعة أكبر."
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
                      textAlign: isArabic ? "right" : "left",
                      minHeight: "132px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
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
                        lineHeight: "1.75",
                        fontSize: "0.92rem",
                      }}
                    >
                      {step.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: isArabic ? "flex-start" : "flex-start",
              }}
            >
              <Link
                to="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#16a34a",
                  color: "#fff",
                  textDecoration: "none",
                  padding: "13px 18px",
                  borderRadius: "14px",
                  fontWeight: "900",
                  minWidth: "220px",
                }}
              >
                {isArabic ? "ابدأ تسجيل نشاطك" : "Start Business Registration"}
              </Link>
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
          {valueItems.map((item) => (
            <div
              key={item.title}
              style={{
                background: "#fff",
                borderRadius: "20px",
                padding: "22px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
                textAlign: isArabic ? "right" : "left",
              }}
            >
              <div
                style={{
                  fontSize: "1.03rem",
                  fontWeight: "900",
                  color: "#0f172a",
                  marginBottom: "8px",
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  color: "#64748b",
                  lineHeight: "1.85",
                  fontSize: "0.94rem",
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
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(248,250,252,1))",
            borderRadius: "26px",
            padding: "36px 22px",
            textAlign: "center",
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "1.7rem",
              fontWeight: "900",
              color: "#0f172a",
            }}
          >
            {isArabic ? "ابدأ الآن مع TrustedLinks" : "Start now with TrustedLinks"}
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: "1.9",
              maxWidth: "740px",
              margin: "0 auto 10px",
              fontSize: "0.98rem",
            }}
          >
            {isArabic
              ? "للشركات: سجّل نشاطك ليصبح الوصول إليك أسهل وأكثر وضوحاً. للأفراد: افتح واتساب المنصة وابدأ البحث مباشرة."
              : "For businesses: register your profile and become easier to reach. For individuals: open the platform WhatsApp and start searching instantly."}
          </p>

          <p
            style={{
              color: "#16a34a",
              fontWeight: "800",
              margin: "0 auto 22px",
              fontSize: "0.92rem",
            }}
          >
            {isArabic
              ? "بدون تطبيق — عبر واتساب مباشرة"
              : "No app needed — works directly on WhatsApp"}
          </p>

          <div
            className="cta-actions"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "200px",
                background: "#fff",
                color: "#0f172a",
                textDecoration: "none",
                padding: "13px 22px",
                borderRadius: "14px",
                fontWeight: "900",
                border: "1px solid #dbe2ea",
              }}
            >
              {isArabic ? "ابدأ البحث" : "Start Search"}
            </a>

            <Link
              to="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "200px",
                background: "#16a34a",
                color: "#fff",
                textDecoration: "none",
                padding: "13px 22px",
                borderRadius: "14px",
                fontWeight: "900",
              }}
            >
              {isArabic ? "سجّل نشاطك" : "Register Business"}
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 980px) {
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
          .hero-actions .register-link,
          .cta-actions a {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
