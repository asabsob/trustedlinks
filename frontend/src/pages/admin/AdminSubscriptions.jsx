import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Building2,
  RefreshCcw,
  Search,
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
  Clock3,
  CreditCard,
  Globe,
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
} from "recharts";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminRevenue() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState(
    localStorage.getItem("adminCountry") || "JO"
  );
  const [generatedAt, setGeneratedAt] = useState("");

  const [data, setData] = useState({
    totalRevenue: 0,
    netRevenue: 0,
    totalRefunds: 0,
    totalTopups: 0,
    totalWalletExposure: 0,
    openPendingAmount: 0,
    approvedPendingAmount: 0,
    businessCount: 0,
    transactionCount: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    pendingSubscriptions: 0,
    monthlyRecurringRevenue: 0,
    annualRecurringRevenue: 0,
    avgRevenuePerBusiness: 0,
    topRevenueBusinesses: [],
    revenueTrend: [],
  });

  const countries = [
    { code: "all", name: t("All Countries", "كل الدول"), currency: "JOD" },
    { code: "JO", name: t("Jordan", "الأردن"), currency: "JOD" },
    { code: "SA", name: t("Saudi Arabia", "السعودية"), currency: "SAR" },
    { code: "AE", name: t("UAE", "الإمارات"), currency: "AED" },
    { code: "QA", name: t("Qatar", "قطر"), currency: "QAR" },
  ];

  const currency =
    countries.find((item) => item.code === country)?.currency || "JOD";

  const formatMoney = (value) =>
    `${Number(value || 0).toFixed(2)} ${currency}`;

  const loadRevenue = async (silent = false) => {
    if (!token) {
      setError(t("Admin token missing.", "توكن الأدمن غير موجود."));
      setLoading(false);
      return;
    }

    try {
      silent ? setRefreshing(true) : setLoading(true);
      setError("");

      localStorage.setItem("adminCountry", country);

      const countryParam = country === "all" ? "" : `?country=${country}`;

      const res = await fetch(`${API_BASE}/api/admin/revenue${countryParam}`, {
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
        t("Failed to load revenue dashboard.", "فشل في تحميل لوحة الإيرادات.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRevenue(false);
  }, [token, country]);

  const revenueTrend = useMemo(() => {
    return Array.isArray(data.revenueTrend)
      ? data.revenueTrend.map((item) => ({
          label: item.date || item.label,
          amount: Number(item.amount || item.revenue || 0),
        }))
      : [];
  }, [data.revenueTrend]);

  const businesses = useMemo(() => {
    const list = Array.isArray(data.topRevenueBusinesses)
      ? data.topRevenueBusinesses
      : [];

    const q = query.trim().toLowerCase();

    const filtered = q
      ? list.filter((item) =>
          String(item.name || item.business_name || item.id || "")
            .toLowerCase()
            .includes(q)
        )
      : list;

    return filtered.map((item) => ({
      id: item.id,
      name: item.name || item.business_name || item.id,
      plan: item.plan || item.subscription_plan || "-",
      status: item.status || item.subscription_status || "-",
      revenue: Number(item.totalRevenue || item.revenue || 0),
      refunds: Number(item.totalRefunds || item.refunds || 0),
      walletBalance: Number(item.walletBalance || item.wallet_balance || 0),
      transactions: Number(item.totalCharges || item.transactions || 0),
    }));
  }, [data.topRevenueBusinesses, query]);

  const businessBars = businesses.slice(0, 8).map((item) => ({
    name: item.name?.length > 16 ? `${item.name.slice(0, 16)}…` : item.name,
    revenue: item.revenue,
  }));

  const summaryCards = [
    {
      title: t("Subscription Revenue", "إيرادات الاشتراكات"),
      value: formatMoney(data.totalRevenue),
      icon: BadgeDollarSign,
      tone: "emerald",
    },
    {
      title: t("Net Revenue", "صافي الإيرادات"),
      value: formatMoney(data.netRevenue || data.totalRevenue),
      icon: TrendingUp,
      tone: "blue",
    },
    {
      title: t("MRR", "الإيراد الشهري المتكرر"),
      value: formatMoney(data.monthlyRecurringRevenue || data.totalRevenue),
      icon: CreditCard,
      tone: "violet",
    },
    {
      title: t("ARR", "الإيراد السنوي المتوقع"),
      value: formatMoney(
        data.annualRecurringRevenue ||
          Number(data.monthlyRecurringRevenue || data.totalRevenue || 0) * 12
      ),
      icon: TrendingUp,
      tone: "emerald",
    },
    {
      title: t("Active Subscriptions", "الاشتراكات النشطة"),
      value: Number(data.activeSubscriptions || data.businessCount || 0),
      icon: Users,
      tone: "emerald",
    },
    {
      title: t("Pending Subscriptions", "اشتراكات معلقة"),
      value: Number(data.pendingSubscriptions || 0),
      icon: Clock3,
      tone: "amber",
    },
    {
      title: t("Expired Subscriptions", "اشتراكات منتهية"),
      value: Number(data.expiredSubscriptions || 0),
      icon: AlertTriangle,
      tone: "red",
    },
    {
      title: t("Wallet Exposure", "إجمالي أرصدة المحافظ"),
      value: formatMoney(data.totalWalletExposure),
      icon: Wallet,
      tone: "blue",
    },
    {
      title: t("Businesses", "الأنشطة"),
      value: Number(data.businessCount || 0),
      icon: Building2,
      tone: "violet",
    },
    {
      title: t("Transactions", "المعاملات"),
      value: Number(data.transactionCount || 0),
      icon: RefreshCcw,
      tone: "blue",
    },
    {
      title: t("Pending Amount", "مبالغ معلقة"),
      value: formatMoney(data.openPendingAmount),
      icon: Clock3,
      tone: "amber",
    },
    {
      title: t("Refunds", "الاستردادات"),
      value: formatMoney(data.totalRefunds),
      icon: RefreshCcw,
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
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
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
      className={`space-y-5 sm:space-y-6 ${isAr ? "text-right" : "text-left"}`}
    >
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-green-400 p-4 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">
              {t("Revenue & Subscriptions", "الإيرادات والاشتراكات")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">
              {t(
                "Track subscription revenue, recurring income, wallet exposure, countries, and business performance.",
                "تابع إيرادات الاشتراكات، الدخل المتكرر، أرصدة المحافظ، الدول، وأداء الأنشطة."
              )}
            </p>

            {generatedAt ? (
              <p className="mt-2 text-xs text-white/80">
                {t("Generated at:", "تم التحديث في:")}{" "}
                {new Date(generatedAt).toLocaleString(isAr ? "ar" : "en")}
              </p>
            ) : null}
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
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-2 text-sm">
              {t("Currency", "العملة")}: {currency}
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

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`rounded-2xl border p-4 shadow-sm ${toneClasses[card.tone]}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm opacity-80">{card.title}</p>
                  <p className="mt-2 break-words text-xl font-bold sm:text-2xl">
                    {card.value}
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-white/70 p-3">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("Revenue Trend", "اتجاه الإيرادات")}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                "Subscription and billing activity over time.",
                "حركة الاشتراكات والفوترة عبر الزمن."
              )}
            </p>
          </div>

          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
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

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t("Top Revenue Businesses", "أعلى الأنشطة إيرادًا")}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                "Highest subscription and billing contributors.",
                "أعلى الأنشطة مساهمة في الاشتراكات والفوترة."
              )}
            </p>
          </div>

          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {t("Business Subscription Revenue", "إيرادات اشتراكات الأنشطة")}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                "Business-level revenue, subscription status, wallet balance, and transactions.",
                "إيرادات كل نشاط، حالة الاشتراك، رصيد المحفظة، والمعاملات."
              )}
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 lg:max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search business...", "ابحث عن نشاط...")}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="px-4 py-3 text-start">{t("Business", "النشاط")}</th>
                <th className="px-4 py-3 text-start">{t("Plan", "الباقة")}</th>
                <th className="px-4 py-3 text-start">{t("Status", "الحالة")}</th>
                <th className="px-4 py-3 text-start">{t("Revenue", "الإيراد")}</th>
                <th className="px-4 py-3 text-start">{t("Refunds", "الاستردادات")}</th>
                <th className="px-4 py-3 text-start">{t("Wallet", "الرصيد")}</th>
                <th className="px-4 py-3 text-start">{t("Transactions", "المعاملات")}</th>
              </tr>
            </thead>

            <tbody>
              {businesses.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={7}>
                    {t(
                      "No revenue data found.",
                      "لا توجد بيانات إيرادات."
                    )}
                  </td>
                </tr>
              ) : (
                businesses.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.plan}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {formatMoney(item.revenue)}
                    </td>
                    <td className="px-4 py-3 text-amber-700">
                      {formatMoney(item.refunds)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.walletBalance < 0
                            ? "bg-red-100 text-red-700"
                            : item.walletBalance < 5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {formatMoney(item.walletBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.transactions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {businesses.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
              {t("No revenue data found.", "لا توجد بيانات إيرادات.")}
            </div>
          ) : (
            businesses.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {t("Plan", "الباقة")}: {item.plan}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : item.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">
                      {t("Revenue", "الإيراد")}
                    </p>
                    <p className="font-semibold text-emerald-700">
                      {formatMoney(item.revenue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      {t("Refunds", "الاستردادات")}
                    </p>
                    <p className="font-semibold text-amber-700">
                      {formatMoney(item.refunds)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      {t("Wallet", "الرصيد")}
                    </p>
                    <p className="font-semibold text-blue-700">
                      {formatMoney(item.walletBalance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      {t("Transactions", "المعاملات")}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {item.transactions}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
