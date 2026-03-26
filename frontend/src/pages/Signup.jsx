// frontend/src/pages/Signup.jsx

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Listbox, Transition } from "@headlessui/react";
import WhatsAppVerify from "../components/WhatsAppVerify";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

let googleMapsPromise = null;

function loadGoogleMaps() {
  if (window.google?.maps?.places?.PlaceAutocompleteElement) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!key) {
      reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
      return;
    }

    const existing = document.getElementById("googleMapsScript");
    if (existing) {
      existing.addEventListener(
        "load",
        () => {
          if (window.google?.maps?.places?.PlaceAutocompleteElement) {
            resolve(window.google);
          } else {
            reject(new Error("Google Maps Places widget is unavailable"));
          }
        },
        { once: true }
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Maps")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "googleMapsScript";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps?.places?.PlaceAutocompleteElement) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps Places widget is unavailable"));
      }
    };

    script.onerror = () => reject(new Error("Failed to load Google Maps"));

    document.body.appendChild(script);
  });

  return googleMapsPromise;
}

function getCountryBounds(code) {
  switch (code) {
    case "jo":
      return { north: 33.5, south: 29.0, east: 39.3, west: 34.8 };
    case "sa":
      return { north: 32.2, south: 16.0, east: 55.7, west: 34.5 };
    case "qa":
      return { north: 26.2, south: 24.4, east: 51.7, west: 50.7 };
    case "ae":
      return { north: 26.1, south: 22.6, east: 56.4, west: 51.5 };
    default:
      return null;
  }
}

function detectCountryCodeFromResults(results = []) {
  for (const result of results) {
    const components = result.address_components || [];
    const countryComponent = components.find(
      (c) => Array.isArray(c.types) && c.types.includes("country")
    );

    if (countryComponent?.short_name) {
      return String(countryComponent.short_name).toLowerCase();
    }
  }

  return null;
}

function normalizePhone(value = "") {
  const arabicNums = "٠١٢٣٤٥٦٧٨٩";
  const englishNums = "0123456789";

  return String(value)
    .split("")
    .map((char) => {
      const index = arabicNums.indexOf(char);
      return index !== -1 ? englishNums[index] : char;
    })
    .join("")
    .replace(/[^\d+]/g, "")
    .replace(/^00/, "+");
}

function getCountryDialCode(code) {
  switch (code) {
    case "jo":
      return "962";
    case "sa":
      return "966";
    case "qa":
      return "974";
    case "ae":
      return "971";
    default:
      return "";
  }
}

function isWhatsappMatchingCountry(whatsappNumber, countryCode) {
  const normalized = normalizePhone(whatsappNumber);
  const dialCode = getCountryDialCode(countryCode);

  if (!normalized || !dialCode) return false;

  const digitsOnly = normalized.replace(/^\+/, "");
  return digitsOnly.startsWith(dialCode);
}

export default function Signup({ lang = "en" }) {
  const navigate = useNavigate();
  const isArabic = lang === "ar";

  const autocompleteContainerRef = useRef(null);
  const autocompleteElementRef = useRef(null);

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
    let cancelled = false;

    async function initPlaceAutocomplete() {
      try {
        await loadGoogleMaps();

        if (cancelled) return;
        if (!autocompleteContainerRef.current) return;
        if (
          autocompleteElementRef.current &&
          autocompleteContainerRef.current?.hasChildNodes()
        ) {
          return;
        }

        const PlaceAutocompleteElement =
          window.google?.maps?.places?.PlaceAutocompleteElement;

        if (!PlaceAutocompleteElement) {
          throw new Error("PlaceAutocompleteElement is unavailable");
        }

        const element = new PlaceAutocompleteElement();

        element.style.width = "100%";
        element.style.maxWidth = "100%";
        element.style.boxSizing = "border-box";

        const bounds = getCountryBounds(countryCode);
        if (bounds) {
          element.locationRestriction = bounds;
        }

        element.setAttribute(
          "placeholder",
          t(
            "Start typing your address or place name",
            "ابدأ بكتابة العنوان أو اسم المكان"
          )
        );

        element.addEventListener("gmp-select", async (event) => {
          try {
            const place = event.placePrediction?.toPlace?.();
            if (!place) return;

            await place.fetchFields({
              fields: ["displayName", "formattedAddress", "location"],
            });

            const formatted = place.formattedAddress || place.displayName || "";

            setLocationText(formatted);

            const lat =
              typeof place.location?.lat === "function"
                ? place.location.lat()
                : null;
            const lng =
              typeof place.location?.lng === "function"
                ? place.location.lng()
                : null;

            if (typeof lat === "number" && typeof lng === "number") {
              setLatitude(lat);
              setLongitude(lng);
              setMapLink(`https://www.google.com/maps?q=${lat},${lng}`);
            }
          } catch (err) {
            console.error("Place select error:", err);
          }
        });

        autocompleteContainerRef.current.innerHTML = "";
        autocompleteContainerRef.current.appendChild(element);
        autocompleteElementRef.current = element;
      } catch (err) {
        console.error("Google Maps load error:", err);
      }
    }

    initPlaceAutocomplete();

    return () => {
      cancelled = true;
    };
  }, [lang, countryCode]);

  useEffect(() => {
    const el = autocompleteElementRef.current;
    if (!el) return;

    const bounds = getCountryBounds(countryCode);
    if (bounds) {
      el.locationRestriction = bounds;
    }
  }, [countryCode]);

  useEffect(() => {
    setVerifiedWhatsApp("");
    setOtpToken("");
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
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);
        setMapLink(`https://www.google.com/maps?q=${lat},${lng}`);

        try {
          await loadGoogleMaps();

          const geocoder = new window.google.maps.Geocoder();

          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && Array.isArray(results) && results.length > 0) {
              const formattedAddress = results[0]?.formatted_address || "";
              if (formattedAddress) {
                setLocationText(formattedAddress);
              }

              const detectedCountry = detectCountryCodeFromResults(results);

              if (
                detectedCountry &&
                countries.some((c) => c.code === detectedCountry)
              ) {
                setCountryCode(detectedCountry);

                alert(
                  t(
                    `Country detected automatically: ${detectedCountry.toUpperCase()}`,
                    `تم تحديد الدولة تلقائيًا: ${detectedCountry.toUpperCase()}`
                  )
                );
              }
            } else {
              console.error("Geocoder failed:", status);
            }
          });
        } catch (err) {
          console.error("Geocode error:", err);
        }
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
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
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

    if (!isWhatsappMatchingCountry(verifiedWhatsApp, countryCode)) {
      alert(
        t(
          "The verified WhatsApp number does not match the selected country.",
          "رقم الواتساب الموثق لا يطابق الدولة المختارة."
        )
      );
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
        whatsapp: normalizePhone(verifiedWhatsApp),
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
                  <Listbox.Options className="absolute z-50 max-h-60 w-full overflow-y-auto rounded-lg border bg-white shadow-md">
                    {metaCategories.map((c) => (
                      <Listbox.Option key={c.key} value={c}>
                        <div className="cursor-pointer p-3 hover:bg-green-50">
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

        {verifiedWhatsApp ? (
          <>
            <div style={helperNoteStyle}>
              {isWhatsappMatchingCountry(verifiedWhatsApp, countryCode)
                ? t(
                    "WhatsApp number matches the selected country.",
                    "رقم الواتساب يطابق الدولة المختارة."
                  )
                : t(
                    "WhatsApp number does not match the selected country.",
                    "رقم الواتساب لا يطابق الدولة المختارة."
                  )}
            </div>

            {!isWhatsappMatchingCountry(verifiedWhatsApp, countryCode) && (
              <div style={{ ...helperNoteStyle, color: "#dc2626" }}>
                {t(
                  `Expected country code: +${getCountryDialCode(countryCode)}`,
                  `رمز الدولة المطلوب: +${getCountryDialCode(countryCode)}`
                )}
              </div>
            )}
          </>
        ) : null}

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

          <div style={fieldHintStyle}>
            {t("Search within the selected country", "البحث داخل الدولة المختارة")}
          </div>

          <div style={addressFieldWrapperStyle}>
            <div style={addressFieldInnerStyle}>
              <div ref={autocompleteContainerRef} style={autocompleteContainerStyle} />
            </div>
          </div>

          {locationText ? (
            <div style={selectedLocationStyle}>
              <strong>{t("Selected address", "العنوان المختار")}:</strong> {locationText}
            </div>
          ) : null}

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
            placeholder={t(
              "Auto-filled after selection",
              "يتم تعبئته بعد اختيار الموقع"
            )}
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
          disabled={
            loading ||
            !verifiedWhatsApp ||
            !otpToken ||
            !agreedToTerms ||
            !isWhatsappMatchingCountry(verifiedWhatsApp, countryCode)
          }
          style={{
            ...submitButtonStyle,
            cursor: loading ? "not-allowed" : "pointer",
            opacity:
              loading ||
              !verifiedWhatsApp ||
              !otpToken ||
              !agreedToTerms ||
              !isWhatsappMatchingCountry(verifiedWhatsApp, countryCode)
                ? 0.6
                : 1,
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

const addressFieldWrapperStyle = {
  width: "100%",
  marginBottom: "14px",
};

const addressFieldInnerStyle = {
  width: "100%",
  minHeight: 56,
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "#ffffff",
  padding: "10px 12px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
};

const autocompleteContainerStyle = {
  width: "100%",
  minHeight: 36,
  display: "flex",
  alignItems: "center",
};

const selectedLocationStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "12px 14px",
  marginBottom: "14px",
  color: "#334155",
  fontSize: "0.95rem",
  lineHeight: 1.7,
  wordBreak: "break-word",
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
  background: "#f8fafc",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  padding: "14px 16px",
  borderRadius: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "0.96rem",
  minHeight: 52,
};

const locationInfoStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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

const fieldHintStyle = {
  fontSize: "0.85rem",
  color: "#64748b",
  marginBottom: 8,
};

const helperNoteStyle = {
  fontSize: "0.9rem",
  color: "#475569",
  marginTop: "8px",
  lineHeight: 1.7,
};
