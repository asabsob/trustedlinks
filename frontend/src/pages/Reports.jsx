// ============================================================================
// Trusted Links - Reports (Production Bilingual + Charts)
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getText, getCategoryLabel } from "../i18n";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function Reports({ lang = "en" }) {
  const isAr = lang === "ar";
  const navigate = useNavigate();
  const tr = (key) => getText(lang, key);

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const labels = {
    title: isAr ? "تقارير الأداء" : "Performance Reports",
    subtitle: isAr
      ? "تابع طلبات التواصل المدفوعة، الإنفاق، والتحليلات الذكية"
      : "Track paid leads, spending, and smart insights",
    loading: isAr ? "جارٍ تحميل التقارير..." : "Loading reports...",
    noData: isAr ? "لا توجد بيانات متاحة." : "No data available.",
    noActivity: isAr ? "لا توجد بيانات نشاط بعد." : "No activity data available yet.",
    noSpending: isAr ? "لا توجد بيانات إنفاق بعد." : "No spending data available yet.",
    periodSummary: isAr ? "ملخص الفترة" : "Period Summary",
    pricing: isAr ? "التسعير" : "Pricing",
    activityTrend: isAr ? "اتجاه طلبات التواصل" : "Lead Activity Trend",
    spendingTrend: isAr ? "اتجاه الإنفاق" : "Spending Trend",
    intentSplit: isAr ? "توزيع مصادر الطلبات" : "Lead Source Split",
    insights: isAr ? "تحليلات ذكية" : "Smart Insights",
    forecast: isAr ? "التوقعات" : "Forecast",
    from: isAr ? "من" : "From",
    to: isAr ? "إلى" : "To",
    week: isAr ? "آخر 7 أيام" : "Last 7 Days",
    month: isAr ? "آخر 30 يوم" : "Last 30 Days",
    quarter: isAr ? "آخر 90 يوم" : "Last 90 Days",
    business: isAr ? "النشاط" : "Business",
    category: tr("category"),
    avgDaily: isAr ? "متوسط الطلبات اليومي" : "Avg Daily Leads",
    avgSpendingDaily: isAr ? "متوسط الإنفاق اليومي" : "Avg Daily Spending",
    peakDay: isAr ? "أفضل يوم" : "Peak Day",
    strongestSource: isAr ? "أقوى مصدر" : "Strongest Source",
    performanceScore: isAr ? "تقييم الأداء" : "Performance Score",
    costPerLead: isAr ? "تكلفة الطلب" : "Cost per Lead",
    next7: isAr ? "المتوقع خلال 7 أيام" : "Estimated next 7 days",
    next30: isAr ? "المتوقع خلال 30 يوم" : "Estimated next 30 days",
    leads: isAr ? "طلب" : "leads",
    currency: "USD",
  };

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

        const res = await fetch(`${API_BASE}/api/business/reports?t=${Date.now()}`, {
          cache: "no-store",
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

          throw new Error(d?.error || `HTTP ${res.status}`);
        }

        if (!cancelled) setData(normalizeReportsData(d));
      } catch (e) {
        console.error("Reports load error:", e);
        if (!cancelled) setMsg(e?.message || labels.noData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [navigate, lang]);

  const rangeDays = useMemo(() => {
    if (range === "7d") return 7;
    if (range === "90d") return 90;
    return 30;
  }, [range]);

  const filteredActivity = useMemo(() => {
    const all = Array.isArray(data?.activity) ? data.activity : [];
    return all.slice(-rangeDays);
  }, [data?.activity, rangeDays]);

  const chartData = useMemo(() => {
    return filteredActivity.map((d) => ({
      date: formatShortDate(d.date, isAr),
      rawDate: d.date,
      total: Number(d.total || 0),
      direct: Number(d.direct || 0),
      category: Number(d.category || 0),
      nearby: Number(d.nearby || 0),
      spending:
        Number(d.direct || 0) * Number(data?.pricing?.direct || 0.25) +
        Number(d.category || 0) * Number(data?.pricing?.category || 0.3) +
        Number(d.nearby || 0) * Number(data?.pricing?.nearby || 0.4),
    }));
  }, [filteredActivity, data?.pricing, isAr]);

  const directStarts = Number(data?.direct_starts || 0);
  const categoryStarts = Number(data?.category_starts || 0);
  const nearbyStarts = Number(data?.nearby_starts || 0);
  const totalLeads = Number(data?.total_billed_conversations || 0);
  const spending = Number(data?.estimated_revenue || 0);
  const currency = data?.currency || labels.currency;

  const averageDaily = chartData.length
    ? (chartData.reduce((sum, item) => sum + item.total, 0) / chartData.length).toFixed(1)
    : "0";

  const avgSpendingDaily = chartData.length
    ? (chartData.reduce((sum, item) => sum + item.spending, 0) / chartData.length).toFixed(2)
    : "0.00";

  const costPerLead = totalLeads > 0 ? (spending / totalLeads).toFixed(2) : "0.00";

  const peakDay = useMemo(() => {
    if (!chartData.length) return "-";
    return [...chartData].sort((a, b) => b.total - a.total)[0]?.date || "-";
  }, [chartData]);

  const strongestIntent = useMemo(() => {
    const entries = [
      { label: tr("directLeads"), value: directStarts },
      { label: tr("categoryLeads"), value: categoryStarts },
      { label: tr("nearbyLeads"), value: nearbyStarts },
    ].sort((a, b) => b.value - a.value);

    return entries[0]?.value > 0 ? entries[0].label : "-";
  }, [directStarts, categoryStarts, nearbyStarts, lang]);

  const performanceScore = useMemo(() => {
    const volumeScore = Math.min(40, totalLeads * 2);
    const spendingScore = Math.min(25, spending * 3);
    const diversityCount = [directStarts, categoryStarts, nearbyStarts].filter((v) => v > 0).length;
    const diversityScore = diversityCount * 10;
    const consistencyScore = chartData.length >= 7 ? 10 : chartData.length >= 3 ? 6 : 2;
    return Math.min(100, Math.round(volumeScore + spendingScore + diversityScore + consistencyScore));
  }, [totalLeads, spending, directStarts, categoryStarts, nearbyStarts, chartData.length]);

  const sourceData = useMemo(
    () =>
      [
        { name: tr("directLeads"), value: directStarts },
        { name: tr("categoryLeads"), value: categoryStarts },
        { name: tr("nearbyLeads"), value: nearbyStarts },
      ].filter((item) => item.value > 0),
    [directStarts, categoryStarts, nearbyStarts, lang]
  );

  const insights = useMemo(() => {
    const items = [];

    if (totalLeads <= 5 && spending < 2) {
      items.push(
        isAr
          ? "النشاط ما زال محدودًا. حسّن الوصف، الكلمات المفتاحية، ودقة الموقع لزيادة طلبات التواصل."
          : "Activity is still limited. Improve descriptions, keywords, and location accuracy to increase lead flow."
      );
    } else {
      items.push(
        isAr
          ? "الأداء مستقر. راقب مصدر الطلبات الأقوى لتحديد أين تستثمر أكثر."
          : "Performance is stable. Monitor the strongest lead source to decide where to invest more."
      );
    }

    if (directStarts >= categoryStarts && directStarts >= nearbyStarts && directStarts > 0) {
      items.push(
        isAr
          ? "الطلبات المباشرة قوية. هذا يدل على وجود معرفة أو ثقة باسم النشاط."
          : "Direct leads are strong, indicating brand recognition or trust."
      );
    }

    if (categoryStarts >= directStarts && categoryStarts >= nearbyStarts && categoryStarts > 0) {
      items.push(
        isAr
          ? "طلبات الفئة تتصدر. وسّع الكلمات المفتاحية وتموضعك داخل الفئة."
          : "Category leads are leading. Expand keywords and category positioning."
      );
    }

    if (nearbyStarts >= directStarts && nearbyStarts >= categoryStarts && nearbyStarts > 0) {
      items.push(
        isAr
          ? "الطلبات القريبة فعالة. حسّن الموقع وبيانات المنطقة لزيادة النتائج المحلية."
          : "Nearby leads are working. Improve map accuracy and local relevance."
      );
    }

    items.push(
      isAr
        ? "استخدم الرصيد والإنفاق الحالي لتقدير ميزانية الأسبوع القادم."
        : "Use current wallet balance and spending to plan next week’s budget."
    );

    return items.slice(0, 4);
  }, [totalLeads, spending, directStarts, categoryStarts, nearbyStarts, isAr]);

  const forecast = useMemo(() => {
    const dailyAvg = Number(averageDaily || 0);
    return {
      next7: Math.round(dailyAvg * 7),
      next30: Math.round(dailyAvg * 30),
    };
  }, [averageDaily]);

  const businessLabel = data?.business || (isAr ? "النشاط" : "Business");
  const categoryLabel = getCategoryLabel(data?.category, lang);

  if (loading) {
    return (
      <PageWrap isAr={isAr}>
        <Panel>{labels.loading}</Panel>
      </PageWrap>
    );
  }

  if (!data) {
    return (
      <PageWrap isAr={isAr}>
        <Panel>{msg || labels.noData}</Panel>
      </PageWrap>
    );
  }

  return (
    <PageWrap isAr={isAr}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              {labels.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              {labels.subtitle}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {labels.from}: {chartData[0]?.date || "-"} {" — "} {labels.to}:{" "}
              {chartData[chartData.length - 1]?.date || "-"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <RangeButton active={range === "7d"} onClick={() => setRange("7d")} label={labels.week} />
            <RangeButton active={range === "30d"} onClick={() => setRange("30d")} label={labels.month} />
            <RangeButton active={range === "90d"} onClick={() => setRange("90d")} label={labels.quarter} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label={tr("directLeads")} value={directStarts} />
          <SummaryCard label={tr("categoryLeads")} value={categoryStarts} />
          <SummaryCard label={tr("nearbyLeads")} value={nearbyStarts} />
          <SummaryCard label={tr("totalLeads")} value={totalLeads} />
          <SummaryCard label={tr("spending")} value={`${spending.toFixed(2)} ${currency}`} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel>
            <h3 className="text-base font-semibold text-slate-900">{labels.periodSummary}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <MiniRow label={labels.business} value={businessLabel} />
              <MiniRow label={labels.category} value={categoryLabel} />
              <MiniRow label={labels.avgDaily} value={averageDaily} />
              <MiniRow label={labels.avgSpendingDaily} value={`${avgSpendingDaily} ${currency}`} />
              <MiniRow label={labels.costPerLead} value={`${costPerLead} ${currency}`} />
              <MiniRow label={labels.peakDay} value={peakDay} />
              <MiniRow label={labels.strongestSource} value={strongestIntent} />
              <MiniRow label={labels.performanceScore} value={`${performanceScore}/100`} />
            </div>
          </Panel>

          <Panel>
            <h3 className="text-base font-semibold text-slate-900">{labels.pricing}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <MiniRow label={tr("directLeads")} value={`${Number(data?.pricing?.direct || 0).toFixed(2)} ${currency}`} />
              <MiniRow label={tr("categoryLeads")} value={`${Number(data?.pricing?.category || 0).toFixed(2)} ${currency}`} />
              <MiniRow label={tr("nearbyLeads")} value={`${Number(data?.pricing?.nearby || 0).toFixed(2)} ${currency}`} />
            </div>
          </Panel>

          <Panel>
            <h3 className="text-base font-semibold text-slate-900">{labels.forecast}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <MiniRow label={labels.next7} value={`${forecast.next7} ${labels.leads}`} />
              <MiniRow label={labels.next30} value={`${forecast.next30} ${labels.leads}`} />
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel>
            <SectionTitle>{labels.activityTrend}</SectionTitle>
            {chartData.length ? (
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => Number(value).toFixed(0)} />
                    <Legend />
                    <Area type="monotone" dataKey="direct" stackId="1" stroke="#22c55e" fill="#22c55e" name={tr("directLeads")} />
                    <Area type="monotone" dataKey="category" stackId="1" stroke="#3b82f6" fill="#3b82f6" name={tr("categoryLeads")} />
                    <Area type="monotone" dataKey="nearby" stackId="1" stroke="#f59e0b" fill="#f59e0b" name={tr("nearbyLeads")} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyText>{labels.noActivity}</EmptyText>
            )}
          </Panel>

          <Panel>
            <SectionTitle>{labels.spendingTrend}</SectionTitle>
            {chartData.length ? (
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)} ${currency}`} />
                    <Legend />
                    <Bar dataKey="spending" fill="#16a34a" name={tr("spending")} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyText>{labels.noSpending}</EmptyText>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel>
            <SectionTitle>{labels.intentSplit}</SectionTitle>
            {sourceData.length ? (
              <div className="space-y-4">
                {sourceData.map((item) => {
                  const percentage = totalLeads > 0 ? Math.round((item.value / totalLeads) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span>{item.name}</span>
                        <span>{item.value} · {percentage}%</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100">
                        <div
                          className="h-3 rounded-full bg-slate-900"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyText>{isAr ? "لا توجد بيانات مصادر بعد." : "No source data available yet."}</EmptyText>
            )}
          </Panel>

          <Panel>
            <SectionTitle>{labels.insights}</SectionTitle>
            <div className="space-y-3">
              {insights.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-7 text-green-800"
                >
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </PageWrap>
  );
}

function normalizeReportsData(d) {
  return {
    ...d,
    activity: Array.isArray(d?.activity)
      ? d.activity.map((item) => ({
          date: item.date,
          total: Number(item.total || 0),
          direct: Number(item.direct || 0),
          category: Number(item.category || 0),
          nearby: Number(item.nearby || 0),
        }))
      : [],
    pricing: {
      direct: Number(d?.pricing?.direct || 0.25),
      category: Number(d?.pricing?.category || 0.3),
      nearby: Number(d?.pricing?.nearby || 0.4),
    },
  };
}

function formatShortDate(dateStr, isAr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString(isAr ? "ar-JO" : "en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function PageWrap({ children, isAr }) {
  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-4 py-8 md:px-8"
      style={{
        fontFamily: "Tajawal, Inter, system-ui, sans-serif",
        direction: isAr ? "rtl" : "ltr",
        textAlign: isAr ? "right" : "left",
      }}
    >
      {children}
    </div>
  );
}

function Panel({ children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="mb-5 text-lg font-semibold text-slate-900">{children}</h2>;
}

function EmptyText({ children }) {
  return <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">{children}</div>;
}

function RangeButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium ${
        active ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className="mt-2 break-words text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}

function MiniRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
