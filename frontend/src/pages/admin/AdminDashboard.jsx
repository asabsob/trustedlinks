import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  MousePointerClick,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import AIOperationsOverview from "../../components/admin/AIOperationsOverview";

const API_BASE = import.meta.env.VITE_API_BASE;
const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

export default function AdminDashboard() {
  const { lang } = useLang();
  const { token } = useAdminAuth();
  const isAr = lang === "ar";

  const t = useMemo(
    () => ({
      title: isAr ? "لوحة التحكم التنفيذية" : "Executive Dashboard",
      loading: isAr ? "تحميل..." : "Loading...",
    }),
    [isAr]
  );

  const [data, setData] = useState({
    stats: {},
    fraud: {},
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [token]);

  async function loadAll() {
    try {
      const [statsRes, fraudRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/fraud/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsJson = await statsRes.json();
      const fraudJson = await fraudRes.json();

      setData({
        stats: statsJson || {},
        fraud: fraudJson.data || {},
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">{t.loading}</div>;

  const users = data.stats.totalUsers || 0;
  const businesses = data.stats.totalBusinesses || 0;
  const clicks = data.stats.totalClicks || 0;

  const fraudData = [
    { name: "Blocked", value: data.fraud.blockedToday || 0 },
    { name: "Held", value: data.fraud.heldToday || 0 },
    { name: "Suspicious", value: data.fraud.suspiciousToday || 0 },
  ];

  return (
    <div className="p-6 space-y-6" dir={isAr ? "rtl" : "ltr"}>
      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 text-white p-6 rounded-2xl">
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card icon={Users} val={users} label="Users" />
        <Card icon={Building2} val={businesses} label="Businesses" />
        <Card icon={MousePointerClick} val={clicks} label="Clicks" />
        <Card icon={AlertTriangle} val={data.fraud.suspiciousToday} label="Suspicious" />
        <Card icon={ShieldAlert} val={data.fraud.pendingCharges} label="Pending" />
        <Card icon={TrendingUp} val={data.fraud.duplicateNoChargeToday} label="Duplicate" />
      </div>

    <div className="mt-2">
  <AIOperationsOverview lang={lang} />
</div>

      {/* AI STATUS BAR */}

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
    <div className="text-sm text-green-700 font-semibold">
      {isAr ? "حالة الذكاء الاصطناعي" : "AI Status"}
    </div>

    <div className="mt-2 text-2xl font-bold text-green-900">
      Operational
    </div>

    <div className="mt-1 text-xs text-green-700">
      {isAr
        ? "جميع أنظمة الذكاء الاصطناعي تعمل بشكل طبيعي."
        : "All AI systems are operating normally."}
    </div>
  </div>

  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
    <div className="text-sm text-yellow-700 font-semibold">
      {isAr ? "حالة مكافحة الاحتيال" : "Fraud Protection"}
    </div>

    <div className="mt-2 text-2xl font-bold text-yellow-900">
      Active
    </div>

    <div className="mt-1 text-xs text-yellow-700">
      {isAr
        ? "يتم تحليل الأنشطة المشبوهة بشكل مستمر."
        : "Suspicious activity monitoring is active."}
    </div>
  </div>

  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
    <div className="text-sm text-blue-700 font-semibold">
      {isAr ? "مراقبة العمليات" : "Operations Monitoring"}
    </div>

    <div className="mt-2 text-2xl font-bold text-blue-900">
      Live
    </div>

    <div className="mt-1 text-xs text-blue-700">
      {isAr
        ? "يتم تسجيل وتحليل العمليات بشكل مباشر."
        : "Operations are being monitored in real-time."}
    </div>
  </div>
</div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FRAUD PIE */}
        <ChartCard title="Fraud Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={fraudData} dataKey="value" outerRadius={90}>
                {fraudData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ACTIVITY */}
        <ChartCard title="Platform Activity">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.stats.activity || []}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="clicks" stroke="#22c55e" />
              <Line dataKey="users" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* BUSINESS DISTRIBUTION */}
      <ChartCard title="Business Categories">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.stats.categories || []}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

/* COMPONENTS */

function Card({ icon: Icon, val, label }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-2xl font-bold">{val || 0}</div>
      </div>
      <Icon />
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
