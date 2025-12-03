import React, { useEffect, useState } from "react";

export default function Subscribe({ lang = "en" }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");

  const t = {
    en: {
      title: "Choose Your Plan",
      confirm: "Confirm Subscription",
      success: "Subscription successful!",
      fail: "Subscription failed.",
      loginFirst: "Please login first.",
      loading: "Loading plans...",
    },
    ar: {
      title: "اختر الخطة",
      confirm: "تأكيد الاشتراك",
      success: "تم الاشتراك بنجاح!",
      fail: "فشل الاشتراك",
      loginFirst: "الرجاء تسجيل الدخول أولاً",
      loading: "جاري تحميل الخطط...",
    },
  }[lang];

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (plan) => {
    const token = localStorage.getItem("token");
    if (!token) return setMessage(t.loginFirst);

    const businessData = JSON.parse(localStorage.getItem("pendingBusiness") || "{}");

    console.log("📦 Sending to /api/select-plan:", {
      token,
      plan,
      ...businessData,
    });

    try {
      const res = await fetch("/api/select-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          plan,
          ...businessData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || t.fail);
        return;
      }

      setMessage(t.success);

      localStorage.removeItem("pendingBusiness");

      setTimeout(() => (window.location.href = "/dashboard"), 1200);
    } catch {
      setMessage(t.fail);
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>{t.loading}</p>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", textAlign: "center" }}>
      <h2 style={{ color: "#22c55e", marginBottom: 20 }}>{t.title}</h2>

      {message && (
        <div
          style={{
            background: "#f0fdf4",
            color: "#166534",
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "flex", gap: 16 }}>
        {plans.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelected(p.id)}
            style={{
              flex: 1,
              border: selected === p.id ? "3px solid #22c55e" : "1px solid #ccc",
              borderRadius: 12,
              padding: 20,
              cursor: "pointer",
            }}
          >
            <h3>{p.name}</h3>
            <p>{p.price === 0 ? "Free" : `$${p.price}/${p.period}`}</p>
          </div>
        ))}
      </div>

      {selected && (
        <button
          onClick={() => handleSubscribe(selected)}
          style={{
            marginTop: 25,
            background: "#22c55e",
            color: "white",
            padding: "10px 24px",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {t.confirm}
        </button>
      )}
    </div>
  );
}
