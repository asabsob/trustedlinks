import React, { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Wallet,
  AlertTriangle,
  TrendingUp,
  RefreshCcw,
  Building2,
  ShieldAlert,
  Search,
  Activity,
  BadgeDollarSign,
  Siren,
  Clock3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminSubscriptions() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [generatedAt, setGeneratedAt] = useState("");

  const [data, setData] = useState({
    totalWalletExposure: 0,
    totalRevenue: 0,
    totalRefunds: 0,
    netRevenue: 0,
    totalTopups: 0,
    approvedPendingAmount: 0,
    openPendingAmount: 0,
    lowBalanceBusinesses: 0,
    negativeBalanceBusinesses: 0,
    businessCount: 0,
    transactionCount: 0,
    totalCharges: 0,
    avgRevenuePerLead: 0,
    blockedFraudCount: 0,
    holdFraudCount: 0,
    suspiciousFraudCount: 0,
    topRevenueBusinesses: [],
    revenueTrend: [],
    refundTrend: [],
  });

  const loadRevenue = async (silent = false) => {
    if (!token) {
      setError(t("Admin token missing.", "توكن الأدمن غير موجود."));
      setLoading(false);
      return;
    }

    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      setError("");

      const res = await fetch(`${API_BASE}/api/admin/revenue`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load revenue");
      }

      setData(json?.data || {});
      setGeneratedAt(json?.generatedAt || "");
    } catch (e) {
      console.error(e);
      setError(
        t(
          "Failed to load revenue dashboard.",
          "فشل في تحميل لوحة الإيرادات."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRevenue(false);
  }, [token]);

  const revenueTrend = useMemo(() => {
    return Array.isArray(data.revenueTrend)
      ? data.revenueTrend.map((item) => ({
          ...item,
          label: item.date,
          amount: Number(item.amount || 0),
        }))
      : [];
  }, [data.revenueTrend]);

  const refundTrend = useMemo(() => {
    return Array.isArray(data.refundTrend)
      ? data.refundTrend.map((item) => ({
          ...item,
          label: item.date,
          amount: Number(item.amount || 0),
        }))
      : [];
  }, [data.refundTrend]);

  const combinedTrend = useMemo(() => {
    const map = new Map();

    revenueTrend.forEach((item) => {
      map.set(item.label, {
        label: item.label,
        revenue: Number(item.amount || 0),
        refunds: 0,
      });
    });

    refundTrend.forEach((item) => {
      const existing = map.get(item.label) || {
        label: item.label,
        revenue: 0,
        refunds: 0,
      };

      existing.refunds = Number(item.amount || 0);
      map.set(item.label, existing);
    });

    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [revenueTrend, refundTrend]);

  const topBusinesses = useMemo(() => {
    const list = Array.isArray(data.topRevenueBusinesses)
      ? data.topRevenueBusinesses
      : [];

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((item) =>
      String(item.name || item.id || "")
        .toLowerCase()
        .includes(q)
    );
  }, [data.topRevenueBusinesses, query]);

  const businessBars = useMemo(() => {
    return topBusinesses.slice(0, 8).map((item) => ({
      name: item.name?.length > 18 ? `${item.name.slice(0, 18)}…` : item.name,
      revenue: Number(item.totalRevenue || 0),
      refunds: Number(item.totalRefunds || 0),
      roi: Number(item.roi || 0),
      charges: Number(item.totalCharges || 0),
      walletBalance: Number(item.walletBalance || 0),
      suspiciousEvents: Number(item.suspiciousEvents || 0),
      blockedEvents: Number(item.blockedEvents || 0),
      holdEvents: Number(item.holdEvents || 0),
      fullName: item.name || item.id,
      id: item.id,
    }));
  }, [topBusinesses]);

  const formatMoney = (value) =>
    `${Number(value || 0).toFixed(2)} ${t("USD", "دولار")}`;

  const summaryCards = [
    {
      title: t("Total Revenue", "إجمالي الإيرادات"),
      value: formatMoney(data.totalRevenue),
      icon: DollarSign,
      tone: "emerald",
    },
    {
      title: t("Net Revenue", "صافي الإيرادات"),
      value: formatMoney(data.netRevenue),
      icon: BadgeDollarSign,
      tone: "blue",
    },
    {
      title: t("Wallet Exposure", "إجمالي الأرصدة"),
      value: formatMoney(data.totalWalletExposure),
      icon: Wallet,
      tone: "blue",
    },
    {
      title: t("Refunds", "الاستردادات"),
      value: formatMoney(data.totalRefunds),
      icon: RefreshCcw,
      tone: "amber",
    },
    {
      title: t("Top-ups", "التعبئات"),
      value: formatMoney(data.totalTopups),
      icon: TrendingUp,
      tone: "violet",
    },
    {
      title: t("Open Pending", "مبالغ معلقة مفتوحة"),
      value: formatMoney(data.openPendingAmount),
      icon: Clock3,
      tone: "red",
    },
    {
      title: t("Approved Pending", "المبالغ المعلقة المعتمدة"),
      value: formatMoney(data.approvedPendingAmount),
      icon: ShieldAlert,
      tone: "emerald",
    },
    {
      title: t("Avg Revenue / Lead", "متوسط الإيراد لكل ليد"),
      value: formatMoney(data.avgRevenuePerLead),
      icon: Activity,
      tone: "violet",
    },
    {
      title: t("Total Charges", "إجمالي الخصومات"),
      value: Number(data.totalCharges || 0),
      icon: DollarSign,
      tone: "emerald",
    },
    {
      title: t("Blocked Fraud", "عمليات احتيال محجوبة"),
      value: Number(data.blockedFraudCount || 0),
      icon: Siren,
      tone: "red",
    },
    {
      title: t("Held Fraud", "عمليات معلقة للمراجعة"),
      value: Number(data.holdFraudCount || 0),
      icon: AlertTriangle,
      tone: "amber",
    },
    {
      title: t("Suspicious Events", "أحداث مشتبه بها"),
      value: Number(data.suspiciousFraudCount || 0),
      icon: ShieldAlert,
      tone: "red",
    },
    {
      title: t("Low Balance Businesses", "أنشطة برصيد منخفض"),
      value: Number(data.lowBalanceBusinesses || 0),
      icon: Building2,
      tone: "amber",
    },
    {
      title: t("Negative Balance Businesses", "أنشطة برصيد سالب"),
      value: Number(data.negativeBalanceBusinesses || 0),
      icon: AlertTriangle,
      tone: "red",
    },
  ];

  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };

  if (loading) {
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className={`space-y-4 ${isAr ? "text-right" : "text-left"}`}
      >
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-gray-500">
            {t("Loading revenue dashboard...", "جارٍ تحميل لوحة الإيرادات...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`space-y-6 ${isAr ? "text-right" : "text-left"}`}
    >
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {t("Revenue Dashboard", "لوحة الإيرادات")}
            </h1>
            <p className="mt-2 text-sm text-white/90">
              {t(
                "Track wallet exposure, revenue movement, refunds, fraud activity, and top-performing businesses.",
                "تابع الأرصدة والإيرادات والاستردادات والمخاطر وأفضل الأنشطة أداءً."
              )}
            </p>
            {generatedAt ? (
              <p className="mt-2 text-xs text-white/80">
                {t("Generated at:", "تم التحديث في:")}{" "}
                {new Date(generatedAt).toLocaleString(isAr ? "ar" : "en")}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/15 px-4 py-2 text-sm">
              {t("Businesses", "الأنشطة")}: {Number(data.businessCount || 0)}
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-2 text-sm">
              {t("Transactions", "المعاملات")}:{" "}
              {Number(data.transactionCount || 0)}
            </div>
            <button
              onClick={() => loadRevenue(true)}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              {refreshing
                ? t("Refreshing...", "جارٍ التحديث...")
                : t("Refresh", "تحديث")}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`rounded-2xl border p-4 shadow-sm ${toneClasses[card.tone]}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm opacity-80">{card.title}</p>
                  <p className="mt-2 text-2xl font-bold">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("Revenue Trend", "اتجاه الإيرادات")}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                "Recent billed activity over the last 30 days.",
                "تطور الإيرادات المفوترة خلال آخر 30 يومًا."
              )}
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="amount"
                  strokeWidth={2}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("Revenue vs Refund Trend", "اتجاه الإيرادات مقابل الاستردادات")}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                "Compare gross revenue and refund activity over time.",
                "قارن بين الإيرادات الإجمالية والاستردادات عبر الزمن."
              )}
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" strokeWidth={2} />
                <Line type="monotone" dataKey="refunds" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("Top Business ROI", "أفضل الأنشطة حسب صافي العائد")}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                "Ranked by revenue minus refunds.",
                "مرتبة حسب الإيراد مطروحًا منه الاستردادات."
              )}
            </p>
          </div>

          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search business...", "ابحث عن نشاط...")}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="roi" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("Top Revenue Businesses", "أعلى الأنشطة إيرادًا")}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                "Revenue by business with quick comparison.",
                "مقارنة الإيرادات حسب النشاط."
              )}
            </p>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {t("Business Revenue Table", "جدول إيرادات الأنشطة")}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                "Detailed operational, financial, and fraud health per business.",
                "عرض تفصيلي للصحة التشغيلية والمالية والمخاطر لكل نشاط."
              )}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-4 py-3 text-start">{t("Business", "النشاط")}</th>
                <th className="px-4 py-3 text-start">{t("Revenue", "الإيراد")}</th>
                <th className="px-4 py-3 text-start">{t("Refunds", "الاستردادات")}</th>
                <th className="px-4 py-3 text-start">{t("ROI", "صافي العائد")}</th>
                <th className="px-4 py-3 text-start">{t("Charges", "عدد الخصومات")}</th>
                <th className="px-4 py-3 text-start">{t("Wallet", "الرصيد")}</th>
                <th className="px-4 py-3 text-start">{t("Suspicious", "مشتبه بها")}</th>
                <th className="px-4 py-3 text-start">{t("Blocked", "محجوبة")}</th>
                <th className="px-4 py-3 text-start">{t("Held", "معلقة")}</th>
              </tr>
            </thead>
            <tbody>
              {topBusinesses.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={9}>
                    {t(
                      "No business revenue data found.",
                      "لا توجد بيانات إيرادات للأنشطة."
                    )}
                  </td>
                </tr>
              ) : (
                topBusinesses.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.name || item.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatMoney(item.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-amber-700">
                      {formatMoney(item.totalRefunds)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-700">
                      {formatMoney(item.roi)}
                    </td>
                    <td className="px-4 py-3">{Number(item.totalCharges || 0)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          Number(item.walletBalance || 0) < 0
                            ? "bg-red-100 text-red-700"
                            : Number(item.walletBalance || 0) < 5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {formatMoney(item.walletBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          Number(item.suspiciousEvents || 0) > 0
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {Number(item.suspiciousEvents || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                        {Number(item.blockedEvents || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {Number(item.holdEvents || 0)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
