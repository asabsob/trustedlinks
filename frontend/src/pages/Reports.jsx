import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useSpring, animated } from "@react-spring/web";

const COLORS = ["#22c55e", "#34d399", "#4ade80", "#86efac"];

export default function Reports({ lang = "en" }) {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  // ✅ animation for fade-in
  const fadeIn = useSpring({
    opacity: 1,
    from: { opacity: 0.3 },
    config: { tension: 210, friction: 22 },
    reset: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/signup");

    // ✅ Updated route + header
    fetch("http://localhost:5175/api/business/reports", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        setData({
          ...d,
          sources: d.sources || [],
          activity: d.activity || [],
        });
      })
      .catch(() => setMsg("Failed to load reports"));
  }, []);

  if (!data)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px",
          color: "#666",
          fontFamily: "Tajawal, Inter, sans-serif",
        }}
      >
        {msg || (lang === "ar" ? "جاري تحميل التقارير..." : "Loading reports...")}
      </div>
    );

  // ✅ Safe conversion rate calculation
  const convRate =
    data.totalClicks && data.totalMessages
      ? `${Math.round((data.totalMessages / data.totalClicks) * 100)}%`
      : "0%";

  return (
    <div
      style={{
        fontFamily: "Tajawal, Inter, sans-serif",
        background: "#f9fafb",
        minHeight: "100vh",
        direction: lang === "ar" ? "rtl" : "ltr",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px",
        }}
      >
        <h2
          style={{
            color: "#16a34a",
            fontWeight: "700",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          {lang === "ar" ? "تقارير الأداء" : "Performance Reports"}
        </h2>
        <p style={{ textAlign: "center", color: "#555", marginBottom: "30px" }}>
          {data.business || "Business"} — {data.category || "Category"}
        </p>

        {/* 📊 Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <SummaryCard
            label={lang === "ar" ? "إجمالي النقرات" : "Total Clicks"}
            value={data.totalClicks ?? 0}
            color="#22c55e"
          />
          <SummaryCard
            label={lang === "ar" ? "إجمالي الرسائل" : "Total Messages"}
            value={data.totalMessages ?? 0}
            color="#34d399"
          />
          <SummaryCard
            label={lang === "ar" ? "إجمالي الوسائط" : "Total Media Views"}
            value={data.mediaViews ?? 0}
            color="#4ade80"
          />
          <SummaryCard
            label={lang === "ar" ? "إجمالي المشاهدات" : "Total Views"}
            value={data.views ?? 0}
            color="#86efac"
          />
          <SummaryCard
            label={lang === "ar" ? "معدل التحويل" : "Conversion Rate"}
            value={convRate}
            color="#f97316"
          />
          <SummaryCard
            label={lang === "ar" ? "النمو الأسبوعي" : "Weekly Growth"}
            value={`${data.weeklyGrowth ?? 0}%`}
            color="#16a34a"
          />
        </div>

        {/* 📈 Weekly Activity Trends */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            marginBottom: "30px",
          }}
        >
          <h3 style={{ marginBottom: 12, color: "#16a34a" }}>
            {lang === "ar" ? "الاتجاه الأسبوعي للنشاط" : "Weekly Activity Trends"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.activity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="total"
                stroke="#22c55e"
                strokeWidth={2}
                name="Total Clicks"
              />
              <Line
                type="monotone"
                dataKey="whatsapp"
                stroke="#10b981"
                strokeWidth={2}
                name="WhatsApp"
              />
              <Line
                type="monotone"
                dataKey="media"
                stroke="#facc15"
                strokeWidth={2}
                name="Media Views"
              />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Messages"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 🥧 Animated Interaction Sources */}
        <animated.div style={fadeIn}>
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              textAlign: "center",
            }}
          >
            <h3 style={{ color: "#16a34a", marginBottom: "10px" }}>
              {lang === "ar" ? "مصادر التفاعل" : "Interaction Sources"}
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={(data.sources || []).map((s) => ({
                    name: lang === "ar" ? s.name_ar || s.name : s.name_en || s.name,
                    value: s.value,
                  }))}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  paddingAngle={2}
                  label={({ name, value, cx, cy, midAngle, outerRadius }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 28;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#16a34a"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        fontSize={18}
                        fontWeight="700"
                      >
                        {`${name}: ${value}`}
                      </text>
                    );
                  }}
                  isAnimationActive={true}
                >
                  {(data.sources || []).map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </animated.div>
      </div>
    </div>
  );
}

// ✅ Reusable summary card component
const SummaryCard = ({ label, value, color }) => (
  <div
    style={{
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: "20px",
      textAlign: "center",
    }}
  >
    <h4 style={{ color: "#444", marginBottom: "8px" }}>{label}</h4>
    <p style={{ fontSize: "1.8rem", fontWeight: "900", color }}>{value}</p>
  </div>
);
