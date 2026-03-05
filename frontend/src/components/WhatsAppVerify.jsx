// ============================================================================
// WhatsAppVerify Component — JAVNA ONLY (Production-ready)
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from "react";

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
    throw new Error(`Non-JSON response (${r.status}). Check API_BASE / routes.`);
  }

  if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
  return data;
}

function digitsOnly(v = "") {
  return String(v).replace(/\D/g, "");
}

function buildInternational(dial, localInput) {
  const localDigits = digitsOnly(localInput);
  const normalizedLocal = localDigits.replace(/^0+/, "");
  const dialDigits = String(dial || "").replace(/\D/g, "");

  return `+${dialDigits}${normalizedLocal}`;
}

export default function WhatsAppVerify({
  lang = "en",
  currentWhatsapp = "",
  onVerified,
}) {
  const [whatsapp, setWhatsapp] = useState(currentWhatsapp || "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const dropdownRef = useRef(null);

  const countries = [
    { code: "JO", dial: "+962", flag: "/flags/jo.png" },
    { code: "SA", dial: "+966", flag: "/flags/sa.png" },
    { code: "AE", dial: "+971", flag: "/flags/ae.png" },
    { code: "QA", dial: "+974", flag: "/flags/qa.png" },
    { code: "KW", dial: "+965", flag: "/flags/kw.png" },
    { code: "BH", dial: "+973", flag: "/flags/bh.png" },
    { code: "OM", dial: "+968", flag: "/flags/om.png" },
  ];

  const [country, setCountry] = useState(countries[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fullNumber = useMemo(
    () => buildInternational(country.dial, whatsapp),
    [country.dial, whatsapp]
  );

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
    const id = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [timer]);

  // ================= SEND OTP =================
  const sendOtp = async () => {
    if (loading) return;

    const digits = digitsOnly(whatsapp);

    if (!digits) {
      alert(lang === "ar" ? "أدخل رقم الهاتف" : "Enter phone number");
      return;
    }

    if (digits.length < 8) {
      alert(lang === "ar" ? "رقم غير صالح" : "Invalid phone number");
      return;
    }

    try {
      setLoading(true);

      await post("/api/whatsapp/request-otp", {
        whatsapp: fullNumber,
      });

      setOtpSent(true);
      setTimer(60);

      alert(lang === "ar" ? "تم إرسال الرمز على واتساب" : "OTP sent on WhatsApp");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY OTP =================
  const verifyOtp = async () => {
    if (!otp.trim()) {
      alert(lang === "ar" ? "أدخل الرمز" : "Enter OTP");
      return;
    }

    try {
      setLoading(true);

      const data = await post("/api/whatsapp/verify-otp", {
        whatsapp: fullNumber,
        code: otp.trim(),
      });

      const digits = fullNumber.replace(/\D/g, "");
   const otpToken = data?.token || data?.otpToken || "";
      localStorage.setItem("otpToken", otpToken);

      setOtpVerified(true);

      // حفظ التوكن
      localStorage.setItem("otpToken", otpToken);

      // إرسال النتيجة للأب
      if (onVerified) {
        onVerified({
          whatsapp: digits,
          whatsappLink: `https://wa.me/${digits}`,
          otpToken: otpToken,
          metaVerified: null,
        });
      }

      alert(lang === "ar" ? "تم التحقق بنجاح" : "Verified successfully");
    } catch (e) {
      alert(lang === "ar" ? `فشل التحقق: ${e.message}` : `Verify failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (timer > 0 || loading) return;
    setOtp("");
    await sendOtp();
  };

  return (
    <div className="w-full bg-white border rounded-xl p-4 space-y-3">

      {/* Country + Phone */}
      <div className="flex gap-3">

        <div className="relative w-36" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full border rounded-lg px-3 py-2 bg-white flex justify-between items-center"
          >
            <span>{country.dial}</span>
            <span>▾</span>
          </button>

          {dropdownOpen && (
            <div className="absolute w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-20">
              {countries.map((c) => (
                <div
                  key={c.code}
                  onClick={() => {
                    setCountry(c);
                    setDropdownOpen(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                >
                  {c.dial}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder={lang === "ar" ? "رقم الهاتف" : "Phone number"}
          className="flex-1 border rounded-lg px-3 py-2"
        />
      </div>

      <div className="text-xs text-gray-500">
        {lang === "ar" ? "سيتم الإرسال إلى:" : "Sending to:"} {fullNumber}
      </div>

      {!otpSent && (
        <button
          onClick={sendOtp}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg"
        >
          {loading ? "..." : lang === "ar" ? "إرسال الرمز" : "Send OTP"}
        </button>
      )}

      {otpSent && !otpVerified && (
        <div className="space-y-3">

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="OTP"
            className="w-full border rounded-lg px-3 py-2"
          />

          <button
            onClick={verifyOtp}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg"
          >
            {loading ? "..." : lang === "ar" ? "تحقق" : "Verify"}
          </button>

          <button
            onClick={resendOtp}
            disabled={timer > 0 || loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {timer > 0
              ? `${lang === "ar" ? "إعادة خلال" : "Resend in"} ${timer}s`
              : lang === "ar"
              ? "إعادة الإرسال"
              : "Resend OTP"}
          </button>
        </div>
      )}

      {otpVerified && (
        <div className="text-green-600 font-semibold text-sm">
          ✅ {lang === "ar" ? "تم توثيق واتساب" : "WhatsApp verified"}
        </div>
      )}
    </div>
  );
}
