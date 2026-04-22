import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  CircleDollarSign,
  Search,
  RefreshCcw,
} from "lucide-react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function AdminSubscriptions() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    load();
  }, [token]);

  async function load() {
    if (!token) {
      setError(t("Admin token missing.", "لا يوجد توكن أدمن."));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/admin/businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Failed to load accounts");
      }

      const list = Array.isArray(json?.results)
        ? json.results
        : Array.isArray(json?.data)
        ? json.data
        : [];

      setBusinesses(list);
    } catch (e) {
      console.error(e);
      setError(t("Failed to load accounts.", "فشل تحميل الحسابات."));
    } finally {
      setLoading(false);
    }
  }

  const normalizedBusinesses = useMemo(() => {
    return businesses.map((b) => {
      const walletBalance =
        Number(
          b.wallet_balance ??
            b.walletBalance ??
            b.wallet?.balance ??
            0
        ) || 0;

      const walletCurrency =
        b.wallet_currency ||
        b.walletCurrency ||
        b.wallet?.currency ||
        "USD";

      const totalClicks =
        Number(
          b.totalClicks ??
            b.clicks ??
            0
        ) || 0;

      const suspiciousEvents =
        Number(
          b.suspicious_events ??
            b.suspiciousEvents ??
            0
        ) || 0;

      return {
        ...b,
        walletBalance,
        walletCurrency,
        totalClicks,
        suspiciousEvents,
      };
    });
  }, [businesses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedBusinesses;

    return normalizedBusinesses.filter((b) => {
      const fields = [
        b.name,
        b.name_ar,
        b.customId,
        b.countryName,
        b.locationText,
        b.whatsapp,
      ]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());

      return fields.some((v) => v.includes(q));
    });
  }, [normalizedBusinesses, query]);

  const totals = useMemo(() => {
    const totalBalance = normalizedBusinesses.reduce(
      (sum, b) => sum + b.walletBalance,
      0
    );

    const lowBalanceCount = normalizedBusinesses.filter(
      (b) => b.walletBalance > 0 && b.walletBalance < 5
    ).length;

    const negativeBalanceCount = normalizedBusinesses.filter(
      (b) => b.walletBalance < 0
    ).length;

    const highRiskCount = normalizedBusinesses.filter(
      (b) => b.suspiciousEvents > 10
    ).length;

    return {
      totalBalance,
      lowBalanceCount,
      negativeBalanceCount,
      highRiskCount,
    };
  }, [normalizedBusinesses]);

  function getBalanceTone(balance) {
    if (balance < 0) return "text-red-600 bg-red-50";
    if (balance < 5) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
  }

  function getRiskTone(risk) {
    if (risk > 10) return "text-red-600 bg-red-50";
    if (risk > 0) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`space-y-6 ${isAr ? "text-right" : "text-left"}`}
    >
      <div className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-400 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">
          {t("Accounts & Revenue", "الحسابات والإيرادات")}
        </h1>
        <p className="mt-2 text-sm text-white/90">
          {t(
            "Monitor balances, account health, billing readiness, and business revenue signals.",
            "مراقبة الأرصدة وصحة الحسابات وجاهزية الفوترة وإشارات الإيرادات للأنشطة."
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          icon={CircleDollarSign}
          title={t("Total Wallet Exposure", "إجمالي الأرصدة")}
          value={`${totals.totalBalance.toFixed(2)} USD`}
        />
        <MetricCard
          icon={Wallet}
          title={t("Low Balance", "أرصدة منخفضة")}
          value={totals.lowBalanceCount}
        />
        <MetricCard
          icon={AlertTriangle}
          title={t("Negative Balance", "أرصدة سالبة")}
          value={totals.negativeBalanceCount}
        />
        <MetricCard
          icon={TrendingUp}
          title={t("High Risk Accounts", "حسابات عالية المخاطر")}
          value={totals.highRiskCount}
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 md:w-[420px]">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "Search by business, country, custom ID, or WhatsApp...",
                "ابحث باسم النشاط أو الدولة أو المعرّف أو الواتساب..."
              )}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            {t("Refresh", "تحديث")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">
            {t("Loading accounts and revenue data...", "جارٍ تحميل بيانات الحسابات والإيرادات...")}
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            {t("No accounts found.", "لا توجد حسابات.")}
          </div>
        ) : (
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-start font-medium">
                  {t("Business", "النشاط")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("Status", "الحالة")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("Wallet", "الرصيد")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("Currency", "العملة")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("Clicks", "النقرات")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("Risk", "المخاطر")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("Country", "الدولة")}
                </th>
                <th className="px-4 py-3 text-start font-medium">
                  {t("WhatsApp", "الواتساب")}
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((b) => {
                const status = String(b.status || "Inactive");
                const balanceTone = getBalanceTone(b.walletBalance);
                const riskTone = getRiskTone(b.suspiciousEvents);

                return (
                  <tr
                    key={b.id}
                    className="border-t border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">
                          {b.name || b.name_ar || t("Unnamed", "بدون اسم")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {b.customId || "—"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          status.toLowerCase() === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : status.toLowerCase() === "trial"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${balanceTone}`}>
                        {b.walletBalance.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {b.walletCurrency}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {b.totalClicks}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskTone}`}>
                        {b.suspiciousEvents > 10
                          ? t("High", "مرتفع")
                          : b.suspiciousEvents > 0
                          ? t("Watch", "مراقبة")
                          : t("Safe", "آمن")}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {b.countryName || "—"}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {b.whatsapp || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
