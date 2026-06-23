import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  ShieldAlert,
  TrendingUp,
  Wallet,
  RefreshCcw,
  Globe,
} from "lucide-react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function AdminBusinesses() {
  const { lang } = useLang();
  const { token } = useAdminAuth();
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(
    localStorage.getItem("adminCountry") || "JO"
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const countries = [
    { code: "all", name: t("All Countries", "كل الدول"), currency: "JOD" },
    { code: "JO", name: t("Jordan", "الأردن"), currency: "JOD" },
    { code: "SA", name: t("Saudi Arabia", "السعودية"), currency: "SAR" },
    { code: "AE", name: t("UAE", "الإمارات"), currency: "AED" },
    { code: "QA", name: t("Qatar", "قطر"), currency: "QAR" },
  ];

  const currency =
    countries.find((item) => item.code === country)?.currency || "JOD";

  useEffect(() => {
    load(false);
  }, [token, country]);

  async function load(silent = false) {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      silent ? setRefreshing(true) : setLoading(true);

      localStorage.setItem("adminCountry", country);

      const countryParam = country === "all" ? "" : `?country=${country}`;

      const res = await fetch(`${API_BASE}/api/admin/businesses${countryParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => ({}));
      const list = json.results || json.data || json.businesses || [];

      setData(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Admin businesses error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function action(id, type) {
    try {
      await fetch(`${API_BASE}/api/admin/businesses/${id}/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      load(true);
    } catch (e) {
      console.error("Business action error:", e);
    }
  }

  const normalizedBusinesses = useMemo(() => {
    return data.map((b) => {
      const status = String(b.status || b.business_status || "").toLowerCase();
      const walletBalance = Number(b.wallet_balance || b.walletBalance || 0);
      const sponsoredBalance = Number(b.sponsored_balance || 0);
      const paidBalance = Number(b.paid_balance || walletBalance || 0);
      const totalBalance =
        Number(b.total_balance || 0) || sponsoredBalance + paidBalance;

      return {
        ...b,
        id: b.id,
        name: b.name || b.business_name || t("Unnamed Business", "نشاط بدون اسم"),
        country: b.country || b.country_code || "-",
        city: b.city || "-",
        status,
        displayStatus: status || "-",
        totalClicks: Number(b.totalClicks || b.total_clicks || b.clicks || 0),
        walletBalance,
        sponsoredBalance,
        paidBalance,
        totalBalance,
        suspiciousEvents: Number(b.suspicious_events || b.suspiciousEvents || 0),
      };
    });
  }, [data, isAr]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return normalizedBusinesses;

    return normalizedBusinesses.filter((b) =>
      [b.name, b.country, b.city, b.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, normalizedBusinesses]);

  const total = normalizedBusinesses.length;
  const active = normalizedBusinesses.filter((b) =>
    ["active", "approved"].includes(b.status)
  ).length;
  const pending = normalizedBusinesses.filter((b) =>
    ["pending", "review", "under_review"].includes(b.status)
  ).length;
  const highRisk = normalizedBusinesses.filter(
    (b) => b.suspiciousEvents > 10
  ).length;

  const formatMoney = (value) =>
    `${Number(value || 0).toFixed(2)} ${currency}`;

  const statusLabel = (status) => {
    if (["active", "approved"].includes(status)) return t("Active", "نشط");
    if (["pending", "review", "under_review"].includes(status))
      return t("Pending", "معلق");
    if (["suspended", "blocked"].includes(status)) return t("Suspended", "موقوف");
    if (["rejected"].includes(status)) return t("Rejected", "مرفوض");
    return status || "-";
  };

  const statusClass = (status) => {
    if (["active", "approved"].includes(status))
      return "bg-emerald-100 text-emerald-700";
    if (["pending", "review", "under_review"].includes(status))
      return "bg-amber-100 text-amber-700";
    if (["suspended", "blocked", "rejected"].includes(status))
      return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  const riskLabel = (risk) => {
    if (risk > 10) return t("High", "مرتفع");
    if (risk > 0) return t("Watch", "مراقبة");
    return t("Safe", "آمن");
  };

  const riskClass = (risk) => {
    if (risk > 10) return "bg-red-100 text-red-700";
    if (risk > 0) return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  if (loading) {
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className={`p-4 sm:p-6 ${isAr ? "text-right" : "text-left"}`}
      >
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
          {t("Loading businesses...", "جارٍ تحميل الأنشطة...")}
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
              {t("Businesses Management", "إدارة الأنشطة")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">
              {t(
                "Manage businesses, approvals, wallet balances, countries, and risk status.",
                "إدارة الأنشطة، الموافقات، أرصدة المحافظ، الدول، وحالة المخاطر."
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
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-2 text-sm">
              {t("Currency", "العملة")}: {currency}
            </div>

            <button
              onClick={() => load(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              <RefreshCcw size={16} />
              {refreshing
                ? t("Refreshing...", "جارٍ التحديث...")
                : t("Refresh", "تحديث")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={Building2} val={total} label={t("Total", "الإجمالي")} />
        <Card icon={TrendingUp} val={active} label={t("Active", "نشط")} />
        <Card icon={ShieldAlert} val={pending} label={t("Pending", "معلق")} />
        <Card icon={ShieldAlert} val={highRisk} label={t("High Risk", "مخاطر عالية")} />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <Search size={18} className="shrink-0 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search business, country, city, status...", "ابحث عن نشاط، دولة، مدينة، حالة...")}
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-start">{t("Name", "الاسم")}</th>
              <th className="px-4 py-3 text-start">{t("Country", "الدولة")}</th>
              <th className="px-4 py-3 text-start">{t("Status", "الحالة")}</th>
              <th className="px-4 py-3 text-start">{t("Clicks", "النقرات")}</th>
              <th className="px-4 py-3 text-start">{t("Sponsored", "ممولة")}</th>
              <th className="px-4 py-3 text-start">{t("Paid", "مدفوعة")}</th>
              <th className="px-4 py-3 text-start">{t("Total Wallet", "إجمالي الرصيد")}</th>
              <th className="px-4 py-3 text-start">{t("Risk", "المخاطر")}</th>
              <th className="px-4 py-3 text-start">{t("Actions", "الإجراءات")}</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-gray-500">
                  {t("No businesses found.", "لا توجد أنشطة.")}
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-gray-100 transition hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div>{b.name}</div>
                    <div className="text-xs text-gray-400">{b.city}</div>
                  </td>

                  <td className="px-4 py-3 text-gray-600">{b.country}</td>

                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(b.status)}`}>
                      {statusLabel(b.status)}
                    </span>
                  </td>

                  <td className="px-4 py-3">{b.totalClicks}</td>

                  <td className="px-4 py-3 text-blue-700">
                    {formatMoney(b.sponsoredBalance)}
                  </td>

                  <td className="px-4 py-3 text-emerald-700">
                    {formatMoney(b.paidBalance)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        b.totalBalance < 0
                          ? "bg-red-100 text-red-700"
                          : b.totalBalance < 5
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {formatMoney(b.totalBalance)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskClass(b.suspiciousEvents)}`}>
                      {riskLabel(b.suspiciousEvents)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => action(b.id, "activate")}
                        className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                      >
                        {t("Activate", "تفعيل")}
                      </button>

                      <button
                        onClick={() => action(b.id, "suspend")}
                        className="rounded-xl bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                      >
                        {t("Suspend", "إيقاف")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
            {t("No businesses found.", "لا توجد أنشطة.")}
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-gray-900">{b.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {b.country} · {b.city}
                  </p>
                </div>

                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(b.status)}`}>
                  {statusLabel(b.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <MiniStat label={t("Clicks", "النقرات")} value={b.totalClicks} />
                <MiniStat label={t("Risk", "المخاطر")} value={riskLabel(b.suspiciousEvents)} />
                <MiniStat label={t("Sponsored", "ممولة")} value={formatMoney(b.sponsoredBalance)} />
                <MiniStat label={t("Paid", "مدفوعة")} value={formatMoney(b.paidBalance)} />
                <MiniStat label={t("Total Wallet", "إجمالي الرصيد")} value={formatMoney(b.totalBalance)} wide />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => action(b.id, "activate")}
                  className="rounded-2xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700"
                >
                  {t("Activate", "تفعيل")}
                </button>

                <button
                  onClick={() => action(b.id, "suspend")}
                  className="rounded-2xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  {t("Suspend", "إيقاف")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Card({ icon: Icon, val, label }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm text-gray-500">{label}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
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

function MiniStat({ label, value, wide = false }) {
  return (
    <div className={`rounded-2xl bg-gray-50 p-3 ${wide ? "col-span-2" : ""}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-900">{value}</p>
    </div>
  );
}
