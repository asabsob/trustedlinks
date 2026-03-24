// frontend/src/pages/Signup.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Listbox, Transition } from "@headlessui/react";
import WhatsAppVerify from "../components/WhatsAppVerify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function Signup({ lang = "en" }) {
  const navigate = useNavigate();
  const isArabic = lang === "ar";
  const locationInputRef = useRef(null);
  const autocompleteRef = useRef(null);

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

  const [countryCode, setCountryCode] = useState("jo");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mapLink, setMapLink] = useState("");

  const [instagram, setInstagram] = useState("");
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = (en, ar) => (isArabic ? ar : en);

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

  const countries = [
    { code: "jo", nameEn: "Jordan", nameAr: "الأردن" },
    { code: "sa", nameEn: "Saudi Arabia", nameAr: "السعودية" },
    { code: "qa", nameEn: "Qatar", nameAr: "قطر" },
    { code: "ae", nameEn: "UAE", nameAr: "الإمارات" },
  ];

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    if (!locationInputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      locationInputRef.current,
      {
        fields: ["formatted_address", "geometry", "name"],
        types: ["establishment", "geocode"],
        componentRestrictions: { country: countryCode },
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place) return;

      const formatted =
        place.formatted_address ||
        place.name ||
        locationInputRef.current?.value ||
        "";

      setLocationText(formatted);

      const lat = place?.geometry?.location?.lat?.();
      const lng = place?.geometry?.location?.lng?.();

      if (typeof lat === "number" && typeof lng === "number") {
        setLatitude(lat);
        setLongitude(lng);
        setMapLink(`https://www.google.com/maps?q=${lat},${lng}`);
      }
    });

    autocompleteRef.current = autocomplete;
  }, []);

  useEffect(() => {
    if (autocompleteRef.current) {
      autocompleteRef.current.setComponentRestrictions({
        country: countryCode,
      });
    }
  }, [countryCode]);

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      alert(
        t(
          "Geolocation is not supported on this device.",
          "تحديد الموقع غير مدعوم على هذا الجهاز."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setMapLink(`https://www.google.com/maps?q=${lat},${lng}`);
      },
      () => {
        alert(
          t(
            "Failed to get your current location.",
            "تعذر الحصول على موقعك الحالي."
          )
        );
      }
    );
  };

  const convertLogoToBase64 = async () => {
    if (!logo) return "";

    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressed);
      };

      reader.readAsDataURL(logo);
    });
  };

  const normalizeNumber = (value) => {
    const arabicNums = "٠١٢٣٤٥٦٧٨٩";
    const englishNums = "0123456789";

    return (value || "")
      .split("")
      .map((char) => {
        const index = arabicNums.indexOf(char);
        return index !== -1 ? englishNums[index] : char;
      })
      .join("");
  };

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

    if (!locationText.trim()) {
      alert(t("Please enter your business location.", "يرجى إدخال موقع النشاط."));
      return;
    }

    if (!email.trim()) {
      alert(t("Please enter your email.", "يرجى إدخال البريد الإلكتروني."));
      return;
    }

    if ((password || "").length < 8) {
      alert(
        t(
          "Password must be at least 8 characters.",
          "كلمة المرور يجب أن تكون 8 أحرف على الأقل."
        )
      );
      return;
    }

    if (password !== confirmPassword) {
      alert(t("Passwords do not match.", "كلمتا المرور غير متطابقتين."));
      return;
    }

    if (!agreedToTerms) {
      alert(
        t(
          "Please agree to the Terms and Conditions first.",
          "يرجى الموافقة على الشروط والأحكام أولاً."
        )
      );
      return;
    }

    setLoading(true);

    try {
      const logoBase64 = await convertLogoToBase64();

      const cleanInstagram = instagram.trim().replace(/^@+/, "");
      const instagramLink = cleanInstagram
        ? `https://instagram.com/${cleanInstagram}`
        : "";

      const selectedCountry = countries.find((c) => c.code === countryCode);

      const businessPayload = {
        name: businessNameEn.trim() || businessNameAr.trim(),
        name_ar: businessNameAr.trim(),
        description: description.trim(),
        category: [category.key],
        keywords: [],
        whatsapp: normalizeNumber(verifiedWhatsApp),
        countryCode,
        countryName: selectedCountry
          ? isArabic
            ? selectedCountry.nameAr
            : selectedCountry.nameEn
          : countryCode,
        locationText: locationText.trim(),
        latitude,
        longitude,
        mapLink: mapLink.trim(),
        mediaLink: instagramLink,
        otpToken,
        logo: logoBase64,
      };

      localStorage.setItem("otpToken", otpToken);

      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          agreedToTerms: true,
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
      <form onSubmit={handleSignup} style={formStyle(isArabic)}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            {t("Create Business Account", "إنشاء حساب النشاط التجاري")}
          </h2>
          <p style={subtitleStyle}>
            {t(
              "Set up your business profile and start building your trusted presence.",
              "ابدأ بإعداد ملف نشاطك التجاري وبناء حضور موثوق."
            )}
          </p>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            {t("Basic Information", "المعلومات الأساسية")}
          </h3>

          <label style={labelStyle}>
            {t("Business Name (Arabic)", "الاسم التجاري (عربي)")}
          </label>
          <input
            type="text"
            value={businessNameAr}
            onChange={(e) => setBusinessNameAr(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>
            {t("Business Name (English)", "الاسم التجاري (إنجليزي)")}
          </label>
          <input
            type="text"
            value={businessNameEn}
            onChange={(e) => setBusinessNameEn(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>{t("Description", "الوصف")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          />

          <label style={labelStyle}>{t("Category", "الفئة")}</label>
          <div className="relative z-20" style={{ marginBottom: 14 }}>
            <Listbox value={category} onChange={setCategory}>
              <>
                <Listbox.Button
                  className="w-full border rounded-lg py-3 px-3 bg-white text-left"
                  style={listboxButtonStyle(isArabic)}
                >
                  {isArabic ? category.nameAr : category.nameEn}
                </Listbox.Button>

                <Transition>
                  <Listbox.Options className="absolute w-full bg-white border rounded-lg shadow-md max-h-60 overflow-y-auto z-50">
                    {metaCategories.map((c) => (
                      <Listbox.Option key={c.key} value={c}>
                        <div className="p-3 hover:bg-green-50 cursor-pointer">
                          {isArabic ? c.nameAr : c.nameEn}
                        </div>
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </>
            </Listbox>
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            {t("Brand & Social", "الهوية والروابط")}
          </h3>

          <label style={labelStyle}>{t("Company Logo", "شعار الشركة")}</label>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              if (!file.type.startsWith("image/")) {
                alert(t("Invalid image file", "ملف غير صالح"));
                return;
              }

              setLogo(file);
              setLogoPreview(URL.createObjectURL(file));
            }}
            style={fileInputStyle}
          />

          {logoPreview ? (
            <div style={logoPreviewBoxStyle}>
              <img
                src={logoPreview}
                alt="Logo Preview"
                style={logoPreviewStyle}
              />
            </div>
          ) : null}

          <label style={labelStyle}>
            {t("Instagram Username", "اسم المستخدم في إنستغرام")}
          </label>
          <div style={prefixInputWrapperStyle}>
            <span style={prefixStyle}>@</span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace("@", ""))}
              style={{ ...inputStyle, marginBottom: 0, paddingInlineStart: 42 }}
              placeholder={t("yourbusiness", "اسم_الحساب")}
            />
          </div>
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            {t("WhatsApp Verification", "توثيق واتساب")}
          </h3>

          <WhatsAppVerify
            lang={lang}
            onVerified={(result) => {
              setVerifiedWhatsApp(result?.whatsapp || "");
              setOtpToken(result?.otpToken || "");
              if (result?.otpToken) {
                localStorage.setItem("otpToken", result.otpToken);
              }
            }}
          />
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            {t("Business Location", "موقع النشاط")}
          </h3>

          <label style={labelStyle}>{t("Country", "الدولة")}</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            style={inputStyle}
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {isArabic ? country.nameAr : country.nameEn}
              </option>
            ))}
          </select>

          <label style={labelStyle}>
            {t("Search your business location", "ابحث عن موقع النشاط")}
          </label>
          <input
            ref={locationInputRef}
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            style={inputStyle}
            placeholder={t(
              "Start typing your address or place name",
              "ابدأ بكتابة العنوان أو اسم المكان"
            )}
          />

          <button
            type="button"
            onClick={getMyLocation}
            style={secondaryButtonStyle}
          >
            {t("Use my current location", "استخدم موقعي الحالي")}
          </button>

          <div style={locationInfoStyle}>
            <div style={locationBoxStyle}>
              <span style={locationLabelStyle}>{t("Latitude", "خط العرض")}</span>
              <strong>{latitude ?? "--"}</strong>
            </div>

            <div style={locationBoxStyle}>
              <span style={locationLabelStyle}>{t("Longitude", "خط الطول")}</span>
              <strong>{longitude ?? "--"}</strong>
            </div>
          </div>

          <label style={labelStyle}>{t("Map Link", "رابط الخريطة")}</label>
          <input
            value={mapLink}
            onChange={(e) => setMapLink(e.target.value)}
            style={inputStyle}
            placeholder={t("Auto-filled after selection", "يتم تعبئته بعد اختيار الموقع")}
          />
        </div>

        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            {t("Account Details", "بيانات الحساب")}
          </h3>

          <label style={labelStyle}>{t("Email", "البريد الإلكتروني")}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>{t("Password", "كلمة المرور")}</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>
            {t("Confirm Password", "تأكيد كلمة المرور")}
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={termsWrapperStyle(isArabic)}>
          <label style={termsLabelStyle(isArabic)}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              style={termsCheckboxStyle}
            />
            <span>
              {t("I agree to the ", "أوافق على ")}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                style={termsLinkStyle}
              >
                {t("Terms and Conditions", "الشروط والأحكام")}
              </a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !verifiedWhatsApp || !otpToken || !agreedToTerms}
          style={{
            ...submitButtonStyle,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: !verifiedWhatsApp || !otpToken || !agreedToTerms ? 0.6 : 1,
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
  padding: "40px 16px",
  background: "#f8fafc",
  minHeight: "100vh",
};

const formStyle = (isArabic) => ({
  background: "#ffffff",
  padding: "32px",
  borderRadius: "20px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  maxWidth: "760px",
  width: "100%",
  textAlign: isArabic ? "right" : "left",
  direction: isArabic ? "rtl" : "ltr",
  fontFamily: isArabic ? "Tajawal, Inter, sans-serif" : "Inter, Tajawal, sans-serif",
  border: "1px solid #e5e7eb",
});

const headerStyle = {
  marginBottom: 24,
};

const titleStyle = {
  color: "#16a34a",
  marginBottom: 8,
  fontSize: "1.8rem",
  fontWeight: 800,
};

const subtitleStyle = {
  color: "#64748b",
  margin: 0,
  lineHeight: 1.8,
};

const sectionStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "18px",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: "1.05rem",
  fontWeight: 700,
  color: "#0f172a",
};

const labelStyle = {
  display: "block",
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "#334155",
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  marginBottom: "14px",
  boxSizing: "border-box",
  fontSize: "0.96rem",
  outline: "none",
  background: "#fff",
};

const fileInputStyle = {
  width: "100%",
  marginBottom: 12,
  padding: "10px 0",
};

const logoPreviewBoxStyle = {
  marginBottom: 14,
  display: "flex",
  alignItems: "center",
};

const logoPreviewStyle = {
  width: 84,
  height: 84,
  objectFit: "cover",
  borderRadius: 14,
  border: "1px solid #e2e8f0",
  background: "#fff",
};

const prefixInputWrapperStyle = {
  position: "relative",
  marginBottom: 14,
};

const prefixStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  left: 14,
  color: "#64748b",
  fontWeight: 700,
  zIndex: 1,
};

const secondaryButtonStyle = {
  width: "100%",
  marginBottom: 14,
  background: "#f1f5f9",
  color: "#0f172a",
  border: "1px solid #dbe2ea",
  padding: "12px 14px",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
};

const locationInfoStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginBottom: 14,
};

const locationBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "12px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const locationLabelStyle = {
  fontSize: "0.85rem",
  color: "#64748b",
};

const submitButtonStyle = {
  width: "100%",
  background: "#16a34a",
  color: "#fff",
  padding: "14px",
  borderRadius: 12,
  fontWeight: 700,
  border: "none",
  fontSize: "1rem",
};

const listboxButtonStyle = (isArabic) => ({
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  padding: "12px 14px",
  background: "#fff",
  textAlign: isArabic ? "right" : "left",
  direction: isArabic ? "rtl" : "ltr",
  fontSize: "0.96rem",
});

const termsWrapperStyle = (isArabic) => ({
  marginBottom: 18,
  direction: isArabic ? "rtl" : "ltr",
});

const termsLabelStyle = (isArabic) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  fontSize: "0.95rem",
  color: "#334155",
  lineHeight: 1.8,
  cursor: "pointer",
  textAlign: isArabic ? "right" : "left",
});

const termsCheckboxStyle = {
  marginTop: 4,
  width: 16,
  height: 16,
  accentColor: "#16a34a",
  cursor: "pointer",
  flexShrink: 0,
};

const termsLinkStyle = {
  color: "#16a34a",
  fontWeight: 700,
  textDecoration: "none",
};
