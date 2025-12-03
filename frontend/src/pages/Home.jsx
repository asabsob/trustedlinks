import React from "react";
import { Link } from "react-router-dom";

export default function Home({ lang }) {
  return (
    <div
      style={{
        fontFamily: lang === "ar" ? "Tajawal, sans-serif" : "Inter, sans-serif",
        direction: lang === "ar" ? "rtl" : "ltr",
        textAlign: "center",
        padding: "60px 20px",
        background: "#f9fafb",
        minHeight: "80vh",
      }}
    >
      {/* 🟩 Hero Section */}
      <section
        style={{
          background: "#22c55e",
          color: "white",
          borderRadius: "12px",
          padding: "80px 20px",
          maxWidth: "1000px",
          margin: "0 auto 40px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            marginBottom: "20px",
          }}
        >
          {lang === "ar"
            ? "منصة الروابط الموثوقة"
            : "Trusted Links Platform"}
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            lineHeight: "1.6",
            maxWidth: "700px",
            margin: "0 auto 40px",
          }}
        >
          {lang === "ar"
            ? "اكتشف الأنشطة التجارية الموثوقة أو قم بتسجيل نشاطك التجاري وتواصل مع عملائك عبر روابط واتساب معتمدة."
            : "Discover verified businesses or register your own to connect with customers through verified WhatsApp links."}
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/search"
            style={{
              background: "white",
              color: "#22c55e",
              borderRadius: "8px",
              padding: "12px 28px",
              fontSize: "1rem",
              fontWeight: "600",
              textDecoration: "none",
              border: "2px solid white",
            }}
          >
            {lang === "ar" ? "استكشف الأنشطة" : "Explore Businesses"}
          </Link>

          <Link
            to="/register"
            style={{
              background: "#1e293b",
              color: "white",
              borderRadius: "8px",
              padding: "12px 28px",
              fontSize: "1rem",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            {lang === "ar" ? "سجّل نشاطك الآن" : "Register Your Business"}
          </Link>
        </div>
      </section>

      {/* 🏢 Features Section */}
      <section style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h2 style={{ marginBottom: "30px", fontWeight: "700" }}>
          {lang === "ar" ? "لماذا تختارنا؟" : "Why Choose Trusted Links?"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ color: "#22c55e" }}>
              {lang === "ar" ? "أنشطة موثوقة" : "Verified Businesses"}
            </h3>
            <p style={{ color: "#555" }}>
              {lang === "ar"
                ? "تصفح الشركات والمتاجر الموثوقة فقط في منطقتك."
                : "Browse only trusted and verified businesses near you."}
            </p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ color: "#22c55e" }}>
              {lang === "ar" ? "روابط واتساب معتمدة" : "Verified WhatsApp Links"}
            </h3>
            <p style={{ color: "#555" }}>
              {lang === "ar"
                ? "تواصل مباشرة مع أصحاب الأنشطة من خلال روابط موثوقة."
                : "Connect directly with verified business owners via secure WhatsApp links."}
            </p>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ color: "#22c55e" }}>
              {lang === "ar" ? "سهولة التسجيل" : "Easy Registration"}
            </h3>
            <p style={{ color: "#555" }}>
              {lang === "ar"
                ? "سجّل نشاطك التجاري خلال دقائق وابدأ في جذب العملاء فوراً."
                : "Register your business in minutes and start attracting customers instantly."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
