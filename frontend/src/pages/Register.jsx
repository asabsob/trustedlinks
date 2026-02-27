import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

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

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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

      // ⚠️ هذا لازم يكون موجود بالـ backend
      const res = await fetch(`${API_BASE}/api/business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Registration failed");

      localStorage.setItem("registeredBiz", JSON.stringify(data.biz || form));
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
        <input
          name="name_ar"
          value={form.name_ar}
          onChange={handleChange}
          dir="rtl"
        />

        <label>WhatsApp Number</label>
        <input
          name="whatsapp"
          value={form.whatsapp}
          onChange={handleChange}
          placeholder="+9627xxxxxxx"
        />

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

        <label>Media Link (YouTube / MP4 / Instagram)</label>
        <input
          name="mediaLink"
          value={form.mediaLink}
          onChange={handleChange}
          placeholder="https://instagram.com/…"
        />

        <label>Location / Address (EN)</label>
        <input
          name="address_en"
          value={form.address_en}
          onChange={handleChange}
          placeholder="Amman, Jordan"
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

        <div style={{ gridColumn: "1 / span 2", textAlign: "center", marginTop: "16px" }}>
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
