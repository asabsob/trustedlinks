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

const COLORS = ["#22c55e", "#34d399", "#4ade80", "#86efac", "#a7f3d0"];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ✅ Always read language directly from localStorage
  const lang = localStorage.getItem("lang") || "en";
  const token = localStorage.getItem("admintoken") || "";

  const t = {
    en: {
      title: "Admin Analytics Dashboard",
      subtitle: "Overview of platform performance and engagement",
      kpiUsers: "Total Users",
      kpiBiz: "Total Businesses",
      kpiClicks: "Total Clicks",
      kpiAvg: "Avg Clicks / Business",
      trendsTitle: "Platform Activity (coming soon)",
      categoriesTitle: "Business Distribution (coming soon)",
      loading: "Loading admin stats...",
      needLogin: "You are not logged in as admin.",
      noData: "No data yet",
    },
    ar: {
      title: "لوحة تحليلات الأدمن",
      subtitle: "نظرة عامة على أداء المنصّة والتفاعل",
      kpiUsers: "إجمالي المستخدمين",
      kpiBiz: "إجمالي الأنشطة التجارية",
      kpiClicks: "إجمالي النقرات",
      kpiAvg: "متوسط النقرات لكل نشاط",
      trendsTitle: "نشاط المنصّة (قريبًا)",
      categoriesTitle: "توزيع الأنشطة التجارية (قريبًا)",
      loading: "جاري تحميل إحصاءات الأدمن...",
      needLogin: "أنت غير مسجل دخول كأدمن.",
      noData: "لا توجد بيانات بعد",
    },
  }[lang];

  const fadeIn = useSpring({
    from: { opacity: 0.3, transform: "translateY(6px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    config: { tension: 210, friction: 22 },
  });

  useEffect(() => {
    if (!token) {
      setErr(t.needLogin);
      setLoading(false);
      return;
    }

    fetch("http://localhost:5175/api/admin/stats", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setStats({
          users: data.users ?? 0,
          businesses: data.businesses ?? 0,
          clicks: data.clicks ?? 0,
          activity: data.activity ?? [],
          categories: data.categories ?? [],
        });
      })
      .catch((e) => setErr(e.message || "Failed"))
      .finally(() => setLoading(false));
  }, [token, lang]);

  if (loading) {
    return (
      <div
        style={{
          fontFamily: "Tajawal, Inter, sans-serif",
          direction: lang === "ar" ? "rtl" : "ltr",
          textAlign: "center",
          padding: 48,
          color: "#666",
        }}
      >
        {t.loading}
      </div>
    );
  }

  if (err) {
    return (
      <div
        style={{
          fontFamily: "Tajawal, Inter, sans-serif",
          direction: lang === "ar" ? "rtl" : "ltr",
          textAlign: "center",
          padding: 48,
        }}
      >
        <h3>⚠️ {err}</h3>
      </div>
    );
  }

  const users = stats?.users ?? 0;
  const businesses = stats?.businesses ?? 0;
  const clicks = stats?.clicks ?? 0;
  const avg = businesses > 0 ? Math.round((clicks / businesses) * 10) / 10 : 0;

  return (
    <div
      style={{
        fontFamily: "Tajawal, Inter, sans-serif",
        background: "#f9fafb",
        minHeight: "100vh",
        direction: lang === "ar" ? "rtl" : "ltr",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg,#22c55e,#34d399)",
          color: "#fff",
          padding: "32px",
          borderRadius: 14,
          margin: "20px auto",
          maxWidth: 1150,
          textAlign: lang === "ar" ? "right" : "left",
        }}
      >
        <h2 style={{ margin: 0 }}>{t.title}</h2>
        <p style={{ margin: "8px 0 0" }}>{t.subtitle}</p>
      </div>

      <animated.div
        style={{
          ...fadeIn,
          maxWidth: 1150,
          margin: "0 auto",
          padding: "0 20px 40px",
        }}
      >
        {/* KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <KPI label={t.kpiUsers} value={users} accent="#22c55e" />
          <KPI label={t.kpiBiz} value={businesses} accent="#34d399" />
          <KPI label={t.kpiClicks} value={clicks} accent="#4ade80" />
          <KPI label={t.kpiAvg} value={avg} accent="#86efac" />
        </div>

        {/* Charts Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 16,
          }}
        >
          {/* Trends */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              padding: 20,
              minHeight: 360,
            }}
          >
            <h3 style={{ marginBottom: 12, color: "#16a34a" }}>{t.trendsTitle}</h3>
            {Array.isArray(stats.activity) && stats.activity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.activity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="users" name="Users" stroke="#34d399" strokeWidth={2} />
                  <Line type="monotone" dataKey="businesses" name="Businesses" stroke="#4ade80" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text={t.noData} />
            )}
          </div>

          {/* Categories */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              padding: 20,
              minHeight: 360,
            }}
          >
            <h3 style={{ marginBottom: 12, color: "#16a34a" }}>
              {t.categoriesTitle}
            </h3>
            {Array.isArray(stats.categories) && stats.categories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.categories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    paddingAngle={2}
                    label={({ name, value, cx, cy, midAngle, outerRadius }) => {
                      const RAD = Math.PI / 180;
                      const r = outerRadius + 26;
                      const x = cx + r * Math.cos(-midAngle * RAD);
                      const y = cy + r * Math.sin(-midAngle * RAD);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#16a34a"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          fontSize={14}
                          fontWeight={700}
                        >
                          {`${name}: ${value}`}
                        </text>
                      );
                    }}
                  >
                    {stats.categories.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text={t.noData} />
            )}
          </div>
        </div>
      </animated.div>
    </div>
  );
}

/* ---------- Small components ---------- */

function KPI({ label, value, accent }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        padding: 20,
        textAlign: "center",
      }}
    >
      <h4 style={{ color: "#444", marginBottom: 8 }}>{label}</h4>
      <p style={{ fontSize: "1.9rem", fontWeight: 800, color: accent }}>{value}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div
      style={{
        height: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#9ca3af",
        border: "1px dashed #e5e7eb",
        borderRadius: 12,
      }}
    >
      {text}
    </div>
  );
}