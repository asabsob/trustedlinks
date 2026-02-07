// ============================================================================
// WhatsAppVerify Component — JAVNA ONLY (Production-ready)
// Uses VITE_API_BASE for Railway/Vercel
// Endpoints:
//   POST /api/whatsapp/request-otp  { whatsapp }
//   POST /api/whatsapp/verify-otp   { whatsapp, code }
// ============================================================================

import React, { useEffect, useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

async function post(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  const txt = await r.text();
  let data = {};
  try {
    data = JSON.parse(txt);
  } catch {
    // If backend returns HTML by mistake, show a helpful error
    throw new Error(`Non-JSON response (${r.status}). Check API_BASE / routes.`);
  }

  if (!r.ok) {
    throw new Error(data?.error || `Request failed (${r.status})`);
  }

  return data;
}

export default function WhatsAppVerify({
  lang = "en",
  businessName = "",
  currentWhatsapp = "",
  onVerified,
}) {
  const [whatsapp, setWhatsapp] = useState(currentWhatsapp || "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const dropdownRef = useRef();

  const countries = [
    { code: "JO", dial: "+962", flag: "/flags/jo.png", nameAr: "الأردن" },
    { code: "SA", dial: "+966", flag: "/flags/sa.png", nameAr: "السعودية" },
    { code: "AE", dial: "+971", flag: "/flags/ae.png", nameAr: "الإمارات" },
    { code: "QA", dial: "+974", flag: "/flags/qa.png", nameAr: "قطر" },
    { code: "KW", dial: "+965", flag: "/flags/kw.png", nameAr: "الكويت" },
    { code: "BH", dial: "+973", flag: "/flags/bh.png", nameAr: "البحرين" },
    { code: "OM", dial: "+968", flag: "/flags/om.png", nameAr: "عمان" },
  ];

  const [country, setCountry] = useState(countries[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // keep + + remove local 0 after country code (e.g. +9620XXXXXXXX -> +962XXXXXXXX)
  const fullNumber = (country.dial + whatsapp).replace(/(\+?\d+)(0)(\d{7,})/, "$1$3");

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const sendOtp = async () => {
    if (!whatsapp.trim()) {
      alert(lang === "ar" ? "أدخل رقم الهاتف" : "Enter your phone number");
      return;
    }

    setLoading(true);
    try {
      await post("/api/whatsapp/request-otp", { whatsapp: fullNumber });
      setOtpSent(true);
      setTimer(60);
      alert(lang === "ar" ? "تم إرسال الرمز على واتساب" : "OTP sent on WhatsApp");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      alert(lang === "ar" ? "أدخل الرمز" : "Enter OTP");
      return;
    }

    setLoading(true);
    try {
      // backend expects { whatsapp, code }
      await post("/api/whatsapp/verify-otp", { whatsapp: fullNumber, code: otp.trim() });

      setOtpVerified(true);

      // JAVNA ONLY: no meta checks
      if (onVerified) {
        const digits = fullNumber.replace(/\D/g, "");
        onVerified({
          whatsapp: digits, // digits only
          whatsappLink: `https://wa.me/${digits}`,
          metaVerified: null, // not used
        });
      }

      alert(lang === "ar" ? "تم التحقق بنجاح ✅" : "Verified ✅");
    } catch (e) {
      alert(lang === "ar" ? `فشل التحقق: ${e.message}` : `Verify failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (timer > 0) return;
    await sendOtp();
  };

  const CountryItem = ({ item }) => (
    <div className="flex items-center gap-2">
      <img src={item.flag} className="w-5 h-4 rounded-sm" alt={item.code} />
      <span dir="ltr" className="inline-block">
        {item.dial}
      </span>
    </div>
  );

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="w-full bg-white p-4 border rounded-xl shadow-sm space-y-3"
    >
      <div className="flex gap-3">
        <div className="relative w-40" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full border border-gray-400 rounded-xl px-3 py-2 bg-white flex items-center justify-between"
            style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
          >
            <CountryItem item={country} />
            <span>▾</span>
          </button>

          {dropdownOpen && (
            <div
              className="absolute w-full bg-white border rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto z-20"
              style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
            >
              {countries.map((c) => (
                <div
                  key={c.code}
                  onClick={() => {
                    setCountry(c);
                    setDropdownOpen(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between text-sm"
                >
                  <CountryItem item={c} />
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          type="text"
          placeholder={lang === "ar" ? "رقم الهاتف" : "Phone number"}
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {!otpSent && (
        <button
          type="button"
          onClick={sendOtp}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
        >
          {loading ? (lang === "ar" ? "جاري الإرسال..." : "Sending...") : (lang === "ar" ? "إرسال الرمز" : "Send OTP")}
        </button>
      )}

      {otpSent && !otpVerified && (
        <div className="space-y-3">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            type="text"
            placeholder={lang === "ar" ? "رمز التحقق" : "Enter OTP"}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
          >
            {loading ? (lang === "ar" ? "جاري التحقق..." : "Verifying...") : (lang === "ar" ? "تحقق" : "Verify")}
          </button>

          <button
            type="button"
            onClick={resendOtp}
            disabled={timer > 0 || loading}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition ${
              timer > 0 ? "bg-gray-400 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {timer > 0
              ? (lang === "ar" ? `إعادة خلال ${timer}s` : `Resend in ${timer}s`)
              : (lang === "ar" ? "إعادة الإرسال" : "Resend")}
          </button>
        </div>
      )}

      {otpVerified && (
        <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
          <span>✅</span>
          <span>{lang === "ar" ? "تم توثيق واتساب" : "WhatsApp verified"}</span>
        </div>
      )}
    </div>
  );
}
