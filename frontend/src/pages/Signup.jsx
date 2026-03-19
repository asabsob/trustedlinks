// frontend/src/pages/Signup.jsx
// ============================================================================
// TrustedLinks - Signup Page
// Creates USER only, stores business draft locally until subscribe/publish step
// ============================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Listbox, Transition } from "@headlessui/react";
import WhatsAppVerify from "../components/WhatsAppVerify";
import LocationPicker from "../components/LocationPicker";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function Signup({ lang = "en" }) {
  const navigate = useNavigate();

  const [businessNameAr, setBusinessNameAr] = useState("");
  const [businessNameEn, setBusinessNameEn] = useState("");
  const [description, setDescription] = useState("");

  const [category, setCategory] = useState({
    key: "PROFESSIONAL_SERVICES",
    nameEn: "Professional Services",
    nameAr: "خدمات مهنية",
  });

  const [verifiedWhatsApp, setVerifiedWhatsApp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [mediaLink, setMediaLink] = useState("");

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const t = (en, ar) => (lang === "ar" ? ar : en);

  const metaCategories = [
    { key: "AUTOMOTIVE", nameEn: "Automotive", nameAr: "سيارات" },
    { key: "BEAUTY_SPA_SALON", nameEn: "Beauty, Spa and Salon", nameAr: "تجميل وصالون" },
    { key: "CLOTHING_APPAREL", nameEn: "Clothing and Apparel", nameAr: "ملابس وأزياء" },
    { key: "EDUCATION", nameEn: "Education", nameAr: "تعليم" },
    { key: "ENTERTAINMENT", nameEn: "Entertainment", nameAr: "ترفيه" },
    { key: "EVENT_PLANNING", nameEn: "Event Planning and Service", nameAr: "تنظيم الفعاليات والخدمات" },
    { key: "FINANCE_BANKING", nameEn: "Finance and Banking", nameAr: "تمويل وبنوك" },
    { key: "FOOD_GROCERY", nameEn: "Food and Grocery", nameAr: "طعام وبقالة" },
    { key: "BEVERAGES", nameEn: "Beverages", nameAr: "مشروبات" },
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

 const handleSignup = async (e) => {
  e.preventDefault();

  if (!businessNameAr.trim() && !businessNameEn.trim()) {
    alert(t("Please enter a business name.", "يرجى إدخال اسم النشاط."));
    return;
  }

  if (!verifiedWhatsApp || !otpToken) {
    alert(t("Please verify WhatsApp first.", "يرجى توثيق واتساب أولاً."));
    return;
  }

  if (latitude == null || longitude == null) {
    alert(t("Please choose a location on the map.", "يرجى اختيار الموقع على الخريطة."));
    return;
  }

  if (!email.trim()) {
    alert(t("Please enter your email.", "يرجى إدخال البريد الإلكتروني."));
    return;
  }

  if ((password || "").length < 8) {
    alert(t("Password must be at least 8 characters.", "كلمة المرور يجب أن تكون 8 أحرف على الأقل."));
    return;
  }

  if (password !== confirmPassword) {
    alert(t("Passwords do not match.", "كلمتا المرور غير متطابقتين."));
    return;
  }

  setLoading(true);

  try {
    const businessPayload = {
      name: businessNameEn.trim() || businessNameAr.trim(),
      name_ar: businessNameAr.trim(),
      description: description.trim(),
      category: [category.key],
      keywords: [],
      whatsapp: verifiedWhatsApp,
      mapLink: mapLink.trim(),
      mediaLink: mediaLink.trim(),
      latitude,
      longitude,
      otpToken,
    };

    // optional backup فقط
    localStorage.setItem("pendingBusiness", JSON.stringify(businessPayload));
    localStorage.setItem("otpToken", otpToken);

    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        business: businessPayload,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data?.error || t("Signup failed.", "فشل إنشاء الحساب."));
      return;
    }

    alert(
      t(
        "Account and business created successfully. Please verify your email, then log in.",
        "تم إنشاء الحساب والنشاط بنجاح. يرجى تفعيل البريد الإلكتروني ثم تسجيل الدخول."
      )
    );

    navigate("/login", { replace: true });
  } catch (err) {
    alert(err?.message || t("Unexpected error.", "حدث خطأ غير متوقع."));
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={containerStyle}>
      <form onSubmit={handleSignup} style={formStyle(lang)}>
        <h2 style={{ color: "#22c55e", marginBottom: 24 }}>
          {t("Create Business Account", "إنشاء حساب النشاط التجاري")}
        </h2>

        <label>{t("Business Name (Arabic)", "الاسم التجاري (عربي)")}</label>
        <input
          type="text"
          value={businessNameAr}
          onChange={(e) => setBusinessNameAr(e.target.value)}
          style={inputStyle}
        />

        <label>{t("Business Name (English)", "الاسم التجاري (إنجليزي)")}</label>
        <input
          type="text"
          value={businessNameEn}
          onChange={(e) => setBusinessNameEn(e.target.value)}
          style={inputStyle}
        />

        <label>{t("Description", "الوصف")}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, minHeight: 90 }}
        />

        <label>{t("Category", "الفئة")}</label>
        <div className="relative z-20 mb-5">
          <Listbox value={category} onChange={setCategory}>
            <>
              <Listbox.Button className="w-full border rounded-lg py-2 px-3 bg-white text-left">
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

        <WhatsAppVerify
          lang={lang}
          onVerified={(result) => {
            setVerifiedWhatsApp(result?.whatsapp || "");
            setOtpToken(result?.otpToken || "");
            if (result?.otpToken) localStorage.setItem("otpToken", result.otpToken);
          }}
        />

        <label style={{ marginBottom: 8, display: "block" }}>
          {t("Business Location", "موقع النشاط على الخريطة")}
        </label>

        <div style={{ marginBottom: 14 }}>
          <LocationPicker
            value={
              latitude != null && longitude != null
                ? { lat: latitude, lng: longitude }
                : null
            }
            onChange={({ lat, lng }) => {
              setLatitude(lat);
              setLongitude(lng);
              setMapLink(
                `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
              );
            }}
            height={320}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>{t("Latitude", "خط العرض")}</label>
            <input
              value={latitude ?? ""}
              onChange={(e) =>
                setLatitude(e.target.value === "" ? null : Number(e.target.value))
              }
              style={inputStyle}
              placeholder="31.9539"
            />
          </div>

          <div>
            <label>{t("Longitude", "خط الطول")}</label>
            <input
              value={longitude ?? ""}
              onChange={(e) =>
                setLongitude(e.target.value === "" ? null : Number(e.target.value))
              }
              style={inputStyle}
              placeholder="35.9106"
            />
          </div>
        </div>

        <label>{t("Map Link", "رابط الخريطة")}</label>
        <input
          value={mapLink}
          onChange={(e) => setMapLink(e.target.value)}
          style={inputStyle}
          placeholder="Auto-generated map link"
        />

        <label>{t("Instagram / Media Link", "رابط الانستغرام / الوسائط")}</label>
        <input
          value={mediaLink}
          onChange={(e) => setMediaLink(e.target.value)}
          style={inputStyle}
          placeholder="https://instagram.com/..."
        />

        <hr style={{ margin: "20px 0" }} />

        <label>{t("Email", "البريد الإلكتروني")}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label>{t("Password", "كلمة المرور")}</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <label>{t("Confirm Password", "تأكيد كلمة المرور")}</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading || !verifiedWhatsApp || !otpToken}
          style={{
            width: "100%",
            background: "#22c55e",
            color: "#fff",
            padding: "10px",
            borderRadius: 6,
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: !verifiedWhatsApp || !otpToken ? 0.6 : 1,
            border: "none",
          }}
        >
          {loading
            ? t("Creating account...", "جارٍ إنشاء الحساب...")
            : t("Continue", "متابعة")}
        </button>
      </form>
    </div>
  );
}

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
  maxWidth: "520px",
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
  boxSizing: "border-box",
};
