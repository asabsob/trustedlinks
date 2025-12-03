import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name_en: "",
    name_ar: "",
    whatsapp: "",
    category: "",
    email: "",
    mediaLink: "",
  });
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const checkWhatsappVerification = async () => {
    if (!form.whatsapp) return alert("Please enter a WhatsApp number first.");
    setChecking(true);
    try {
      const res = await fetch("http://localhost:5175/api/check-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: form.whatsapp }),
      });
      const data = await res.json();
      setVerified(data.verified);
    } catch {
      alert("Unable to verify number. Try again.");
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name_en || !form.whatsapp || !form.category)
      return alert("Please fill in required fields (Name, WhatsApp, Category).");

    if (!token) {
      alert("Please log in first.");
      navigate("/signup");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5175/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      alert("✅ Business registered successfully!");
      console.log("Response:", data);
      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Failed to register business: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section" style={{ fontFamily: "Tajawal, Inter, sans-serif" }}>
      <div
        style={{
          background: "#22c55e",
          color: "white",
          padding: "40px 0",
          textAlign: "center",
          borderRadius: "12px",
          marginBottom: "32px",
        }}
      >
        <h2>Register Your Business / تسجيل نشاطك التجاري</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          maxWidth: "950px",
          margin: "0 auto",
          padding: "40px",
          borderRadius: "12px",
          background: "white",
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <label>Business Name (English)</label>
        <input name="name_en" value={form.name_en} onChange={handleChange} placeholder="Kark Cafe" />

        <label style={{ textAlign: "right" }}>اسم النشاط (عربي)</label>
        <input name="name_ar" value={form.name_ar} onChange={handleChange} dir="rtl" />

        <label>WhatsApp Number</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
            placeholder="+9627xxxxxxx"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={checkWhatsappVerification}
            disabled={checking}
            style={{
              background: "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            {checking ? "Checking..." : "Verify ✅"}
          </button>
        </div>

        {verified !== null && (
          <p
            style={{
              gridColumn: "1 / span 2",
              color: verified ? "green" : "red",
              fontWeight: "500",
            }}
          >
            {verified
              ? "✅ Verified WhatsApp Business Account"
              : "❌ Not Verified – Verification Required for Visibility"}
          </p>
        )}

        <label>Business Category</label>
        <input name="category" value={form.category} onChange={handleChange} placeholder="Restaurant, Fashion, etc." />

        <label>Email Address</label>
        <input name="email" value={form.email} onChange={handleChange} placeholder="admin@wifaqemd.com" />

        <label>Media Link</label>
        <input name="mediaLink" value={form.mediaLink} onChange={handleChange} placeholder="Instagram / Google Maps" />

        <div
          style={{
            gridColumn: "1 / span 2",
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          <button
            type="submit"
            disabled={loading || !form.name_en || !form.whatsapp || !form.category}
            style={{
              background: loading ? "#ccc" : "#22c55e",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "10px 24px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : "Register / تسجيل"}
          </button>
        </div>
      </form>
    </div>
  );
}
