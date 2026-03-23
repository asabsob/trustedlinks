// ============================================================================
// WhatsAppVerify Component — Clean UI + JAVNA ONLY
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

function normalizeArabicDigits(v = "") {
  const arabicNums = "٠١٢٣٤٥٦٧٨٩";
  const englishNums = "0123456789";

  return String(v)
    .split("")
    .map((char) => {
      const index = arabicNums.indexOf(char);
      return index !== -1 ? englishNums[index] : char;
    })
    .join("");
}

function digitsOnly(v = "") {
  return normalizeArabicDigits(v).replace(/\D/g, "");
}

function sanitizePhoneInput(v = "") {
  return digitsOnly(v).slice(0, 15);
}

function formatPhoneForDisplay(v = "") {
  const digits = sanitizePhoneInput(v);

  if (!digits) return "";

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
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
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [whatsapp, setWhatsapp] = useState(formatPhoneForDisplay(currentWhatsapp || ""));
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });

  const dropdownRef = useRef(null);

  const countries = [
    { code: "JO", dial: "+962" },
    { code: "SA", dial: "+966" },
    { code: "AE", dial: "+971" },
    { code: "QA", dial: "+974" },
    { code: "KW", dial: "+965" },
    { code: "BH", dial: "+973" },
    { code: "OM", dial: "+968" },
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

  const handleWhatsappChange = (e) => {
    const sanitized = sanitizePhoneInput(e.target.value);
    setWhatsapp(formatPhoneForDisplay(sanitized));
  };

  const sendOtp = async () => {
    if (loading) return;

    const digits = digitsOnly(whatsapp);

    if (!digits) {
      setMessage({
        type: "error",
        text: t("Please enter your phone number.", "يرجى إدخال رقم الهاتف."),
      });
      return;
    }

    if (digits.length < 8) {
      setMessage({
        type: "error",
        text: t("Invalid phone number.", "رقم الهاتف غير صالح."),
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      await post("/api/whatsapp/request-otp", {
        whatsapp: fullNumber,
      });

      setOtpSent(true);
      setTimer(60);
      setMessage({
        type: "success",
        text: t("OTP sent successfully on WhatsApp.", "تم إرسال رمز التحقق عبر واتساب بنجاح."),
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: e.message || t("Failed to send OTP.", "فشل إرسال رمز التحقق."),
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setMessage({
        type: "error",
        text: t("Please enter the OTP.", "يرجى إدخال رمز التحقق."),
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const data = await post("/api/whatsapp/verify-otp", {
        whatsapp: fullNumber,
        code: digitsOnly(otp),
      });

      const digits = fullNumber.replace(/\D/g, "");
      const otpToken = data?.token || data?.otpToken || "";

      localStorage.setItem("otpToken", otpToken);
      setOtpVerified(true);

      if (onVerified) {
        onVerified({
          whatsapp: digits,
          whatsappLink: `https://wa.me/${digits}`,
          otpToken,
          metaVerified: null,
        });
      }

      setMessage({
        type: "success",
        text: t("WhatsApp verified successfully.", "تم توثيق رقم واتساب بنجاح."),
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: e.message || t("Verification failed.", "فشل التحقق."),
      });
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
    <div style={wrapStyle(isAr)}>
      <div style={headerStyle}>
        <h4 style={titleStyle}>
          {t("WhatsApp Verification", "توثيق واتساب")}
        </h4>
        <p style={descStyle}>
          {t(
            "Use OTP verification to confirm the WhatsApp number connected to your business.",
            "استخدم رمز التحقق لتأكيد رقم واتساب المرتبط بنشاطك."
          )}
        </p>
      </div>

      <div style={rowStyle}>
        <div style={{ ...fieldStyle, maxWidth: 140 }} ref={dropdownRef}>
          <label style={labelStyle}>{t("Country", "الدولة")}</label>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={dropdownButtonStyle}
          >
            <span>{country.dial}</span>
            <span>▾</span>
          </button>

          {dropdownOpen && (
            <div style={dropdownMenuStyle}>
              {countries.map((c) => (
                <div
                  key={c.code}
                  onClick={() => {
                    setCountry(c);
                    setDropdownOpen(false);
                  }}
                  style={dropdownItemStyle}
                >
                  {c.dial}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...fieldStyle, flex: 1 }}>
          <label style={labelStyle}>{t("Phone Number", "رقم الهاتف")}</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            dir="ltr"
            value={whatsapp}
            onChange={handleWhatsappChange}
            placeholder={t("Phone number", "رقم الهاتف")}
            style={{
              ...inputStyle,
              direction: "ltr",
              textAlign: "left",
            }}
          />
        </div>
      </div>

      <div style={helperTextStyle}>
        {t("Sending to:", "سيتم الإرسال إلى:")} <strong>{fullNumber}</strong>
      </div>

      {message.text ? (
        <div
          style={
            message.type === "success" ? successMessageStyle : errorMessageStyle
          }
        >
          {message.text}
        </div>
      ) : null}

      {!otpSent && !otpVerified && (
        <button onClick={sendOtp} disabled={loading} style={primaryBtn}>
          {loading ? "..." : t("Send OTP", "إرسال الرمز")}
        </button>
      )}

      {otpSent && !otpVerified && (
        <div style={{ marginTop: 16 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>{t("OTP Code", "رمز التحقق")}</label>
            <input
              type="tel"
              inputMode="numeric"
              dir="ltr"
              value={otp}
              onChange={(e) => setOtp(digitsOnly(e.target.value).slice(0, 8))}
              placeholder="OTP"
              style={{
                ...inputStyle,
                direction: "ltr",
                textAlign: "left",
              }}
            />
          </div>

          <div style={actionRowStyle}>
            <button onClick={verifyOtp} disabled={loading} style={primaryBtn}>
              {loading ? "..." : t("Verify", "تحقق")}
            </button>

            <button
              onClick={resendOtp}
              disabled={timer > 0 || loading}
              style={secondaryBtn(timer > 0 || loading)}
            >
              {timer > 0
                ? `${t("Resend in", "إعادة خلال")} ${timer}s`
                : t("Resend OTP", "إعادة الإرسال")}
            </button>
          </div>
        </div>
      )}

      {otpVerified && (
        <div style={verifiedBadgeStyle}>
          ✅ {t("WhatsApp verified", "تم توثيق واتساب")}
        </div>
      )}
    </div>
  );
}

const wrapStyle = (isAr) => ({
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
  direction: isAr ? "rtl" : "ltr",
});

const headerStyle = {
  marginBottom: "16px",
};

const titleStyle = {
  margin: "0 0 6px",
  fontSize: "20px",
  color: "#111827",
};

const descStyle = {
  margin: 0,
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const rowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px",
  color: "#111827",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  background: "#fff",
  boxSizing: "border-box",
  fontSize: "15px",
};

const dropdownButtonStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  padding: "12px 14px",
  background: "#fff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
  fontSize: "15px",
};

const dropdownMenuStyle = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  marginTop: "6px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
  zIndex: 20,
  overflow: "hidden",
};

const dropdownItemStyle = {
  padding: "10px 14px",
  cursor: "pointer",
  borderBottom: "1px solid #f3f4f6",
};

const helperTextStyle = {
  marginTop: "10px",
  color: "#6b7280",
  fontSize: "13px",
};

const actionRowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "14px",
};

const primaryBtn = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn = (disabled) => ({
  background: disabled ? "#d1d5db" : "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
});

const successMessageStyle = {
  marginTop: "14px",
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#166534",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
};

const errorMessageStyle = {
  marginTop: "14px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  borderRadius: "12px",
  padding: "12px 14px",
  fontSize: "14px",
};

const verifiedBadgeStyle = {
  marginTop: "16px",
  background: "#ecfdf5",
  color: "#166534",
  border: "1px solid #a7f3d0",
  borderRadius: "999px",
  padding: "10px 14px",
  display: "inline-block",
  fontWeight: 700,
};
