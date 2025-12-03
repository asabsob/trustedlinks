// ============================================================================
// TrustedLinks - Signup Page (Final Correct Version)
// ============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Listbox, Transition } from "@headlessui/react";
import WhatsAppVerify from "../components/WhatsAppVerify";

export default function Signup({ lang }) {
  const [businessNameAr, setBusinessNameAr] = useState("");
  const [businessNameEn, setBusinessNameEn] = useState("");

  const [category, setCategory] = useState({
    key: "PROFESSIONAL_SERVICES",
    nameEn: "Professional Services",
    nameAr: "خدمات مهنية",
  });

  const [verifiedWhatsApp, setVerifiedWhatsApp] = useState(null);
  const [metaVerified, setMetaVerified] = useState(null);

  const [mapLink, setMapLink] = useState("");
  const [mediaLink, setMediaLink] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Meta categories
  const metaCategories = [
    { key: "AUTOMOTIVE", nameEn: "Automotive", nameAr: "سيارات" },
    { key: "BEAUTY_SPA_SALON", nameEn: "Beauty, Spa and Salon", nameAr: "تجميل وصالون" },
    { key: "CLOTHING_APPAREL", nameEn: "Clothing and Apparel", nameAr: "ملابس وأزياء" },
    { key: "EDUCATION", nameEn: "Education", nameAr: "تعليم" },
    { key: "ENTERTAINMENT", nameEn: "Entertainment", nameAr: "ترفيه" },
    { key: "EVENT_PLANNING", nameEn: "Event Planning and Service", nameAr: "تنظيم الفعاليات والخدمات" },
    { key: "FINANCE_BANKING", nameEn: "Finance and Banking", nameAr: "تمويل وبنوك" },
    { key: "FOOD_GROCERY", nameEn: "Food and Grocery", nameAr: "طعام وبقالة" },
    { key: "ALCOHOLIC_BEVERAGES", nameEn: "Beverages", nameAr: "مشروبات" },
    { key: "PUBLIC_SERVICE", nameEn: "Public Service", nameAr: "خدمات عامة" },
    { key: "HOTEL_LODGING", nameEn: "Hotel and Lodging", nameAr: "فنادق وإقامة" },
    { key: "MEDICAL_HEALTH", nameEn: "Medical and Health", nameAr: "صحة وطبية" },
    { key: "OVER_THE_COUNTER_DRUGS", nameEn: "Over-the-counter Drugs", nameAr: "أدوية بدون وصفة" },
    { key: "NON_PROFIT", nameEn: "Non-profit", nameAr: "غير ربحي" },
    { key: "PROFESSIONAL_SERVICES", nameEn: "Professional Services", nameAr: "خدمات مهنية" },
    { key: "SHOPPING_RETAIL", nameEn: "Shopping and Retail", nameAr: "تسوق وتجزئة" },
    { key: "TRAVEL_TRANSPORTATION", nameEn: "Travel and Transportation", nameAr: "سفر ومواصلات" },
    { key: "RESTAURANT", nameEn: "Restaurant", nameAr: "مطعم / مقهى" },
    { key: "OTHER", nameEn: "Other", nameAr: "أخرى" },
  ];

  // -------------------------------------------------------------------------
  // Signup handler
  // -------------------------------------------------------------------------
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!businessNameAr.trim()) {
      alert(lang === "ar" ? "يرجى إدخال الاسم التجاري بالعربية" : "Enter Arabic business name");
      return;
    }

    if (!verifiedWhatsApp) {
      alert(lang === "ar" ? "يرجى التحقق من رقم واتساب" : "Verify WhatsApp first");
      return;
    }

    if (metaVerified === false) {
      alert(lang === "ar" ? "في انتظار توثيق ميتا" : "Wait for Meta verification");
      return;
    }

    if (password !== confirmPassword) {
      alert(lang === "ar" ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    setLoading(true);

    // --------------------------------------------------------------
    // Save entire business object to localStorage (pendingBusiness)
    // --------------------------------------------------------------
    localStorage.setItem(
      "pendingBusiness",
      JSON.stringify({
        nameAr: businessNameAr.trim(),
        nameEn: businessNameEn.trim(),
        category: category.key,
        whatsapp: verifiedWhatsApp.replace(/\D/g, ""),
        whatsappLink: `https://wa.me/${verifiedWhatsApp.replace(/\D/g, "")}`,
        mapLink,
        mediaLink,
        metaVerified,
        otpVerified: true,
      })
    );

    // --------------------------------------------------------------
    // Create user
    // --------------------------------------------------------------
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Signup failed");
        return;
      }

      alert(lang === "ar" ? "تم إنشاء الحساب!" : "Signup complete!");

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------
  return (
    <div style={containerStyle}>
      <form onSubmit={handleSignup} style={formStyle(lang)}>
        <h2 style={{ color: "#22c55e", marginBottom: 24 }}>
          {lang === "ar" ? "إنشاء حساب النشاط التجاري" : "Create Business Account"}
        </h2>

        {/* BUSINESS NAME ARABIC */}
        <label>{lang === "ar" ? "الاسم التجاري (عربي) *" : "Business Name (Arabic) *"}</label>
        <input
          type="text"
          value={businessNameAr}
          onChange={(e) => setBusinessNameAr(e.target.value)}
          style={inputStyle}
          required
        />

        {/* BUSINESS NAME ENGLISH */}
        <label>{lang === "ar" ? "الاسم التجاري (إنجليزي)" : "Business Name (English)"}</label>
        <input
          type="text"
          value={businessNameEn}
          onChange={(e) => setBusinessNameEn(e.target.value)}
          style={inputStyle}
        />

        {/* Category */}
        <label>{lang === "ar" ? "الفئة" : "Category"}</label>
        <div className="relative z-20 mb-5">
          <Listbox value={category} onChange={setCategory}>
            <>
              <Listbox.Button className="w-full border rounded-lg py-2 px-3 bg-white">
                {lang === "ar" ? category.nameAr : category.nameEn}
              </Listbox.Button>

              <Transition>
                <Listbox.Options className="absolute w-full bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto z-50">
                  {metaCategories.map((c) => (
                    <Listbox.Option key={c.key} value={c}>
                      <div className="p-2 hover:bg-green-100 cursor-pointer">
                        {lang === "ar" ? c.nameAr : c.nameEn}
                      </div>
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </>
          </Listbox>
        </div>

        {/* WhatsApp Verification */}
        <WhatsAppVerify
          lang={lang}
          businessName={businessNameAr}
          onVerified={(result) => {
            setVerifiedWhatsApp(result.whatsapp);
            setMetaVerified(result.metaVerified);
          }}
        />

        {/* MAP */}
        <label>{lang === "ar" ? "رابط الخريطة" : "Google Map Link"}</label>
        <input value={mapLink} onChange={(e) => setMapLink(e.target.value)} style={inputStyle} />

        {/* MEDIA */}
        <label>{lang === "ar" ? "رابط الانستغرام" : "Instagram Link"}</label>
        <input value={mediaLink} onChange={(e) => setMediaLink(e.target.value)} style={inputStyle} />

        <hr style={{ margin: "20px 0" }} />

        {/* Email */}
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

        {/* Password */}
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading || !verifiedWhatsApp}
          style={{
            width: "100%",
            background: "#22c55e",
            color: "#fff",
            padding: "10px",
            borderRadius: 6,
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: verifiedWhatsApp ? 1 : 0.5,
          }}
        >
          {lang === "ar" ? "متابعة" : "Continue"}
        </button>
      </form>
    </div>
  );
}

// Styles
const containerStyle = {
  display: "flex",
  justifyContent: "center",
  padding: "40px 0",
  background: "#f9fafb",
  minHeight: "100vh",
};

const formStyle = (lang) => ({
  background: "#fff",
  padding: "40px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  maxWidth: "450px",
  width: "100%",
  textAlign: lang === "ar" ? "right" : "left",
  direction: lang === "ar" ? "rtl" : "ltr",
  fontFamily: "Tajawal, Inter, sans-serif",
});

const inputStyle = {
  width: "100%",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  marginBottom: "14px",
};
