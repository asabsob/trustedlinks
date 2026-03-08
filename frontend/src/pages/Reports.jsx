import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";
const COLORS = ["#22c55e", "#34d399", "#4ade80", "#86efac"];

export default function Reports({ lang = "en" }) {
  const isAr = lang === "ar";
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const fadeIn = useSpring({
    opacity: 1,
    from: { opacity: 0.3 },
    config: { tension: 210, friction: 22 },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setMsg("");

        const res = await fetch(`${API_BASE}/api/business/reports`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const d = await res.json().catch(() => null);

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
            return;
          }

          if (res.status === 404) {
            throw new Error(
              isAr
                ? "لا توجد بيانات تقارير متاحة بعد."
                : "No report data available yet."
            );
          }

          throw new Error(d?.error || `HTTP ${res.status}`);
        }

        if (cancelled) return;

        setData({
          ...d,
          sources: Array.isArray(d?.sources) ? d.sources : [],
          activity: Array.isArray(d?.activity) ? d.activity : [],
        });
      } catch (e) {
        console.error("Reports load error:", e);
        if (!cancelled) {
          setMsg(
            e?.message ||
              (isAr
                ? "تعذر تحميل التقارير حالياً."
                : "Unable to load reports right now.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isAr, navigate]);

  const pieData = useMemo(
    () =>
      (data?.sources || []).map((s) => ({
        name: isAr ? s.name_ar || s.name || "" : s.name_en || s.name || "",
        value: Number(s.value || 0),
      })),
    [data?.sources, isAr]
  );

  const convRate =
    data?.totalClicks && data?.totalMessages
      ? `${Math.round((data.totalMessages / data.totalClicks) * 100)}%`
      : "0%";

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px",
          color: "#666",
          fontFamily: "Tajawal, Inter, sans-serif",
          direction: isAr ? "rtl" : "ltr",
        }}
      >
        {isAr ? "جارٍ تحميل التقارير..." : "Loading reports..."}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px",
          color: "#666",
          fontFamily: "Tajawal, Inter, sans-serif",
          direction: isAr ? "rtl" : "ltr",
        }}
      >
        {msg || (isAr ? "لا توجد بيانات متاحة." : "No data available.")}
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Tajawal, Inter, sans-serif",
        background: "#f9fafb",
        minHeight: "100vh",
        direction: isAr ? "rtl" : "ltr",
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
          {isAr ? "تقارير الأداء" : "Performance Reports"}
        </h2>

        <p style={{ textAlign: "center", color: "#555", marginBottom: "30px" }}>
          {data.business || "Business"} — {data.category || "Category"}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <SummaryCard label={isAr ? "إجمالي النقرات" : "Total Clicks"} value={data.totalClicks ?? 0} color="#22c55e" />
          <SummaryCard label={isAr ? "إجمالي الرسائل" : "Total Messages"} value={data.totalMessages ?? 0} color="#34d399" />
          <SummaryCard label={isAr ? "إجمالي الوسائط" : "Total Media Views"} value={data.mediaViews ?? 0} color="#4ade80" />
          <SummaryCard label={isAr ? "إجمالي المشاهدات" : "Total Views"} value={data.views ?? 0} color="#86efac" />
          <SummaryCard label={isAr ? "معدل التحويل" : "Conversion Rate"} value={convRate} color="#f97316" />
          <SummaryCard label={isAr ? "النمو الأسبوعي" : "Weekly Growth"} value={`${data.weeklyGrowth ?? 0}%`} color="#16a34a" />
        </div>

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
            {isAr ? "الاتجاه الأسبوعي للنشاط" : "Weekly Activity Trends"}
          </h3>

          {data.activity?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.activity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} name={isAr ? "إجمالي النقرات" : "Total Clicks"} />
                <Line type="monotone" dataKey="whatsapp" stroke="#10b981" strokeWidth={2} name="WhatsApp" />
                <Line type="monotone" dataKey="media" stroke="#facc15" strokeWidth={2} name={isAr ? "مشاهدات الوسائط" : "Media Views"} />
                <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} name={isAr ? "الرسائل" : "Messages"} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#777", textAlign: "center", padding: "30px 0" }}>
              {isAr ? "لا توجد بيانات نشاط كافية بعد." : "No activity data available yet."}
            </p>
          )}
        </div>

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
              {isAr ? "مصادر التفاعل" : "Interaction Sources"}
            </h3>

            {pieData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    paddingAngle={2}
                    isAnimationActive
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: "#777", textAlign: "center", padding: "30px 0" }}>
                {isAr ? "لا توجد مصادر تفاعل بعد." : "No interaction sources available yet."}
              </p>
            )}
          </div>
        </animated.div>
      </div>
    </div>
  );
}

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
