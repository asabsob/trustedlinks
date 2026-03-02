import React, { useEffect, useMemo, useState } from "react";
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
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";
const COLORS = ["#22c55e", "#34d399", "#4ade80", "#86efac", "#a7f3d0"];

export default function AdminDashboard() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";

  const t = useMemo(
    () => ({
      title: isAr ? "لوحة تحليلات الأدمن" : "Admin Analytics Dashboard",
      subtitle: isAr
        ? "نظرة عامة على أداء المنصّة والتفاعل"
        : "Overview of platform performance and engagement",
      kpiUsers: isAr ? "إجمالي المستخدمين" : "Total Users",
      kpiBiz: isAr ? "إجمالي الأنشطة التجارية" : "Total Businesses",
      kpiClicks: isAr ? "إجمالي النقرات" : "Total Clicks",
      kpiAvg: isAr ? "متوسط النقرات لكل نشاط" : "Avg Clicks / Business",
      trendsTitle: isAr ? "نشاط المنصّة" : "Platform Activity",
      categoriesTitle: isAr ? "توزيع الأنشطة التجارية" : "Business Distribution",
      loading: isAr ? "جاري تحميل إحصاءات الأدمن..." : "Loading admin stats...",
      needLogin: isAr ? "أنت غير مسجل دخول كأدمن." : "You are not logged in as admin.",
      noData: isAr ? "لا توجد بيانات بعد" : "No data yet",
      failed: isAr ? "فشل تحميل الإحصاءات" : "Failed to load stats",
    }),
    [isAr]
  );

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fadeIn = useSpring({
    from: { opacity: 0.3, transform: "translateY(6px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    config: { tension: 210, friction: 22 },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      if (!token) {
        setErr(t.needLogin);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/admin/stats`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const txt = await res.text();
        let data = {};
        try {
          data = JSON.parse(txt);
        } catch {
          data = {};
        }

        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        const normalized = {
          users: data.users ?? data.totalUsers ?? 0,
          businesses: data.businesses ?? data.totalBusinesses ?? 0,
          clicks: data.clicks ?? data.totalClicks ?? 0,
          activity: Array.isArray(data.activity) ? data.activity : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
        };

        if (!cancelled) setStats(normalized);
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr(e.message || t.failed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  if (loading) {
    return (
      <div
        style={{
          fontFamily: "Tajawal, Inter, sans-serif",
          direction: isAr ? "rtl" : "ltr",
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
          direction: isAr ? "rtl" : "ltr",
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
        direction: isAr ? "rtl" : "ltr",
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
          textAlign: isAr ? "right" : "left",
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
            <h3 style={{ marginBottom: 12, color: "#16a34a" }}>{t.categoriesTitle}</h3>

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
