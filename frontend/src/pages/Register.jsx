import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Subscribe from "./Subscribe";

export default function Register() {
const [form, setForm] = useState({
  name_en: "",
  name_ar: "",
  whatsapp: "",
  category: "",
  email: "",
  mediaLink: "",
  address_en: "",
  address_ar: "",
  mapLink: "",
});

  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registeredBiz, setRegisteredBiz] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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

    if (!form.name_en || !form.whatsapp || !form.category) {
      alert("Please fill in required fields (Name, WhatsApp, Category).");
      return;
    }

    setLoading(true);

    try {
      if (!token) {
        localStorage.setItem("pendingBusiness", JSON.stringify(form));
        alert("Please create your account to complete registration.");
        navigate("/signup");
        return;
      }

     const res = await fetch("http://localhost:5175/api/business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // ✅ Navigate directly to subscription page after registration
      setRegisteredBiz(data.biz);
      navigate("/subscribe");
    } catch (err) {
      console.error("❌ Registration error:", err);
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
        <input
          name="name_en"
          value={form.name_en}
          onChange={handleChange}
          placeholder="Kark Cafe"
        />

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
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="">Select a category…</option>
          <option value="Restaurant">Restaurant</option>
          <option value="Cafe">Cafe</option>
          <option value="Shop">Shop</option>
          <option value="Service">Service</option>
        </select>

        <label>Email Address</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="admin@yourdomain.com"
        />

        <label>Media Link (YouTube / Image / MP4 / Instagram / Google Maps)</label>
        <input
          name="mediaLink"
          value={form.mediaLink}
          onChange={handleChange}
          placeholder="https://youtube.com/… or https://share.google/…"
        />

        <label>Location / Address (EN)</label>
        <input
          name="address_en"
          value={form.address_en}
          onChange={handleChange}
          placeholder="Amman, Jordan or a maps share link"
        />

        <label style={{ textAlign: "right" }}>العنوان (عربي)</label>
        <input
          name="address_ar"
          value={form.address_ar}
          onChange={handleChange}
          dir="rtl"
          placeholder="عمّان، الأردن"
        />

<label>Google Maps Link</label>
<input
  name="mapLink"
  value={form.mapLink || ""}
  onChange={handleChange}
  placeholder="https://maps.app.goo.gl/..."
/>

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