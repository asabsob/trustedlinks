import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Building2,
  MousePointerClick,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  RefreshCcw,
  Globe,
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
import AISystemMap from "../../components/admin/AISystemMap";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

export default function AdminDashboard() {
  const { lang } = useLang();
  const { token } = useAdminAuth();
  const isAr = lang === "ar";
  const tr = (en, ar) => (isAr ? ar : en);

  const [country, setCountry] = useState(
    localStorage.getItem("adminCountry") || "JO"
  );

  const [data, setData] = useState({
    stats: {},
    fraud: {},
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const countries = [
    { code: "all", label: tr("All Countries", "كل الدول") },
    { code: "JO", label: tr("Jordan", "الأردن") },
    { code: "SA", label: tr("Saudi Arabia", "السعودية") },
    { code: "AE", label: tr("UAE", "الإمارات") },
    { code: "QA", label: tr("Qatar", "قطر") },
  ];

  useEffect(() => {
    loadAll(false);
  }, [token, country]);

  async function loadAll(silent = false) {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      silent ? setRefreshing(true) : setLoading(true);

      localStorage.setItem("adminCountry", country);

      const countryParam = country === "all" ? "" : `?country=${country}`;

      const [statsRes, fraudRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats${countryParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/fraud/overview${countryParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsJson = await statsRes.json().catch(() => ({}));
      const fraudJson = await fraudRes.json().catch(() => ({}));

      setData({
        stats: statsJson?.data || statsJson || {},
        fraud: fraudJson?.data || fraudJson || {},
      });
    } catch (e) {
      console.error("Admin dashboard error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const users = Number(data.stats.totalUsers || 0);
  const businesses = Number(data.stats.totalBusinesses || 0);
  const clicks = Number(data.stats.totalClicks || 0);

  const fraudData = [
    {
      name: tr("Blocked", "محجوبة"),
      value: Number(data.fraud.blockedToday || 0),
    },
    {
      name: tr("Held", "معلقة"),
      value: Number(data.fraud.heldToday || 0),
    },
    {
      name: tr("Suspicious", "مشتبه بها"),
      value: Number(data.fraud.suspiciousToday || 0),
    },
  ];

  const activityData = Array.isArray(data.stats.activity)
    ? data.stats.activity
    : [];

  const categoryData = Array.isArray(data.stats.categories)
    ? data.stats.categories
    : [];

  if (loading) {
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className={`p-4 sm:p-6 ${isAr ? "text-right" : "text-left"}`}
      >
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          {tr("Loading dashboard...", "جارٍ تحميل لوحة التحكم...")}
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`space-y-5 sm:space-y-6 ${isAr ? "text-right" : "text-left"}`}
    >
      <div className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-400 p-4 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">
              {tr("Executive Dashboard", "لوحة التحكم التنفيذية")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">
              {tr(
                "Monitor users, businesses, clicks, fraud protection, and AI operations.",
                "راقب المستخدمين، الأنشطة، النقرات، مكافحة الاحتيال، وعمليات الذكاء الاصطناعي."
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm">
              <Globe size={16} />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-transparent text-white outline-none [&>option]:text-gray-900"
              >
                {countries.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadAll(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              <RefreshCcw size={16} />
              {refreshing ? tr("Refreshing...", "جارٍ التحديث...") : tr("Refresh", "تحديث")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card icon={Users} val={users} label={tr("Users", "المستخدمون")} />
        <Card icon={Building2} val={businesses} label={tr("Businesses", "الأنشطة")} />
        <Card icon={MousePointerClick} val={clicks} label={tr("Clicks", "النقرات")} />
        <Card icon={AlertTriangle} val={data.fraud.suspiciousToday} label={tr("Suspicious", "مشتبه بها")} />
        <Card icon={ShieldAlert} val={data.fraud.pendingCharges} label={tr("Pending", "معلقة")} />
        <Card icon={TrendingUp} val={data.fraud.duplicateNoChargeToday} label={tr("Duplicate", "مكررة")} />
      </div>

      <div className="space-y-5">
        <AIOperationsOverview lang={lang} />
        <AISystemMap lang={lang} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          title={tr("AI Status", "حالة الذكاء الاصطناعي")}
          value={tr("Operational", "يعمل")}
          desc={tr(
            "All AI systems are operating normally.",
            "جميع أنظمة الذكاء الاصطناعي تعمل بشكل طبيعي."
          )}
          tone="green"
        />

        <StatusCard
          title={tr("Fraud Protection", "مكافحة الاحتيال")}
          value={tr("Active", "نشط")}
          desc={tr(
            "Suspicious activity monitoring is active.",
            "يتم تحليل الأنشطة المشبوهة بشكل مستمر."
          )}
          tone="yellow"
        />

        <StatusCard
          title={tr("Operations Monitoring", "مراقبة العمليات")}
          value={tr("Live", "مباشر")}
          desc={tr(
            "Operations are being monitored in real-time.",
            "يتم تسجيل وتحليل العمليات بشكل مباشر."
          )}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title={tr("Fraud Distribution", "توزيع حالات الاحتيال")}>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="75%"
                  label
                >
                  {fraudData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={tr("Platform Activity", "نشاط المنصة")}>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line dataKey="clicks" stroke="#22c55e" strokeWidth={2} />
                <Line dataKey="users" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title={tr("Business Categories", "تصنيفات الأنشطة")}>
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}

function Card({ icon: Icon, val, label }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm text-gray-500">{label}</div>
          <div className="mt-2 break-words text-2xl font-bold text-gray-900">
            {Number(val || 0)}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-emerald-50 p-3 text-emerald-600">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, desc, tone }) {
  const styles = {
    green: "border-green-200 bg-green-50 text-green-900",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
  };

  const textStyles = {
    green: "text-green-700",
    yellow: "text-yellow-700",
    blue: "text-blue-700",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[tone]}`}>
      <div className={`text-sm font-semibold ${textStyles[tone]}`}>
        {title}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className={`mt-1 text-xs leading-5 ${textStyles[tone]}`}>
        {desc}
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 text-base font-bold text-gray-900 sm:text-lg">
        {title}
      </h3>
      {children}
    </div>
  );
}
