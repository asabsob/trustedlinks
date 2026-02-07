// ============================================================================
// WhatsAppVerifySignup.jsx
// JAVNA ONLY — Used in Signup ONLY (no token)
// Endpoints:
//   POST /api/whatsapp/request-otp  { whatsapp }
//   POST /api/whatsapp/verify-otp   { whatsapp, code }
// ============================================================================

import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  const txt = await res.text();
  let data = {};
  try {
    data = JSON.parse(txt);
  } catch {
    throw new Error(`Non-JSON response (${res.status}). Check API_BASE and backend routes.`);
  }

  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export default function WhatsAppVerifySignup({ lang = "en", whatsapp, setWhatsapp, onVerified }) {
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // 1) Send OTP
  const sendOtp = async () => {
    if (!String(whatsapp || "").trim()) {
      alert(lang === "ar" ? "أدخل رقم الواتساب" : "Enter WhatsApp number");
      return;
    }

    setLoading(true);
    try {
      await post("/api/whatsapp/request-otp", { whatsapp });
      setOtpSent(true);
      setTimer(60);
      alert(lang === "ar" ? "تم إرسال الرمز على واتساب" : "OTP sent on WhatsApp");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2) Verify OTP
  const verifyOtp = async () => {
    if (!String(otp || "").trim()) {
      alert(lang === "ar" ? "أدخل رمز التحقق" : "Enter OTP");
      return;
    }

    setLoading(true);
    try {
      // backend expects { whatsapp, code } (NOT otp)
      await post("/api/whatsapp/verify-otp", { whatsapp, code: otp.trim() });

      setOtpVerified(true);
      alert(lang === "ar" ? "تم التحقق ✅" : "Verified ✅");

      // JAVNA ONLY: no meta verification now
      onVerified?.({
        whatsapp: String(whatsapp).replace(/\D/g, ""),
        otpVerified: true,
      });
    } catch (e) {
      alert(lang === "ar" ? `فشل التحقق: ${e.message}` : `Verify failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <input
        type="text"
        placeholder="+9627xxxxxxx"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", flex: 1 }}
      />

      {!otpSent && (
        <button onClick={sendOtp} disabled={loading} style={btn}>
          {loading ? (lang === "ar" ? "جاري الإرسال..." : "Sending...") : (lang === "ar" ? "إرسال" : "Send")}
        </button>
      )}

      {otpSent && !otpVerified && (
        <>
          <input
            type="text"
            value={otp}
            placeholder={lang === "ar" ? "رمز التحقق" : "OTP"}
            onChange={(e) => setOtp(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />

          <button onClick={verifyOtp} disabled={loading} style={btn}>
            {loading ? (lang === "ar" ? "جاري التحقق..." : "Verifying...") : (lang === "ar" ? "تحقق" : "Verify")}
          </button>

          <button
            onClick={sendOtp}
            disabled={timer > 0 || loading}
            style={{
              ...btn,
              background: timer > 0 ? "#9ca3af" : "#3b82f6",
            }}
          >
            {timer > 0 ? `${timer}s` : lang === "ar" ? "إعادة الإرسال" : "Resend"}
          </button>
        </>
      )}

      {otpVerified && <div>✅ {lang === "ar" ? "تم توثيق واتساب" : "WhatsApp verified"}</div>}
    </div>
  );
}

const btn = {
  background: "#22c55e",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
};
