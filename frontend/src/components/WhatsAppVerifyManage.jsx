// ============================================================================
// WhatsAppVerifySignup.jsx
// Used in Signup ONLY — Does NOT update business (no token yet)
// ============================================================================

import React, { useState, useEffect } from "react";

export default function WhatsAppVerifySignup({
  lang = "en",
  whatsapp,
  setWhatsapp,
  onVerified,
}) {
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [metaVerified, setMetaVerified] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Countdown
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // 1️⃣ Send OTP
  const sendOtp = async () => {
    if (!whatsapp.trim()) {
      alert(lang === "ar" ? "أدخل رقم الواتساب" : "Enter WhatsApp number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to send OTP");
      } else {
        setOtpSent(true);
        setTimer(60);
        alert(lang === "ar" ? "تم إرسال الرمز" : "OTP sent!");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Verify OTP (no token yet)
  const verifyOtp = async () => {
    if (!otp.trim()) {
      alert(lang === "ar" ? "أدخل رمز التحقق" : "Enter OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Invalid OTP");
        return;
      }

      setOtpVerified(true);
      alert(lang === "ar" ? "تم التحقق" : "Verified!");

      // 3️⃣ Check Meta
      const metaRes = await fetch("/api/whatsapp/check-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp,
          phone_number_id: "780458835160824",
          business_name: "Business",
        }),
      });

      const metaData = await metaRes.json();

      setMetaVerified(metaData.verified);

      if (onVerified) onVerified(metaData.verified);
    } finally {
      setLoading(false);
    }
  };

  // UI
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
          {lang === "ar" ? "إرسال" : "Send"}
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
            {lang === "ar" ? "تحقق" : "Verify"}
          </button>

          <button
            onClick={sendOtp}
            disabled={timer > 0}
            style={{
              ...btn,
              background: timer > 0 ? "#9ca3af" : "#3b82f6",
            }}
          >
            {timer > 0
              ? `${timer}s`
              : lang === "ar"
              ? "إعادة الإرسال"
              : "Resend"}
          </button>
        </>
      )}

      {otpVerified && (
        <div>
          ✅ {metaVerified ? "Meta Verified" : "Pending Meta"}
        </div>
      )}
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
