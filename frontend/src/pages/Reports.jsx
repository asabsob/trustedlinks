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

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function Reports({ lang = "en" }) {
  const isAr = lang === "ar";
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const t = useMemo(
    () =>
      ({
        en: {
          title: "Performance Reports",
          subtitle: "Track billed conversations, revenue, and smart insights",
          business: "Business",
          category: "Category",
          loading: "Loading reports...",
          noData: "No data available.",
          noActivity: "No activity data available yet.",
          noRevenue: "No revenue data available yet.",
          noSources: "No source data available yet.",
          noKeywords: "No keyword data available yet.",
          direct: "Direct",
          categoryIntent: "Category",
          nearby: "Nearby",
          totalConversations: "Total Conversations",
          revenue: "Revenue",
          averageDaily: "Avg Daily Conversations",
          avgRevenueDaily: "Avg Daily Revenue",
          periodSummary: "Period Summary",
          currentPeriod: "Current Period",
          pricing: "Pricing",
          activityTrend: "Conversation Activity Trend",
          revenueTrend: "Revenue Trend",
          sourceSplit: "Intent Split",
          keyInsights: "AI Insights",
          recommendations: "Recommendations",
          from: "From",
          to: "To",
          week: "Last 7 Days",
          month: "Last 30 Days",
          quarter: "Last 90 Days",
          peakDay: "Peak Day",
          strongestIntent: "Strongest Intent",
          performanceScore: "Performance Score",
          noBusiness: "Business",
          noCategory: "Category",
          stableMessage:
            "Your activity is stable. Keep monitoring which intent generates the strongest lead flow.",
          growthMessage:
            "Your category and nearby intent are creating momentum. Consider allocating more budget there.",
          directMessage:
            "Direct intent is strong. Focus on brand trust and clearer conversion messaging.",
          nearbyMessage:
            "Nearby intent is working. Improve map accuracy and local relevance to grow faster.",
          categoryMessage:
            "Category intent is leading. Expand keywords and category-specific positioning.",
          lowActivityMessage:
            "Activity is still limited. Increase discoverability through stronger descriptions, keywords, and location accuracy.",
          balanceTip:
            "Use your wallet balance together with recent conversation volume to plan your next budget step.",
          forecastTitle: "Forecast",
          estimatedNext7Days: "Estimated next 7 days",
          estimatedNext30Days: "Estimated next 30 days",
          conversations: "conversations",
          currency: "USD",
        },
        ar: {
          title: "تقارير الأداء",
          subtitle: "تابع المحادثات المدفوعة والإيرادات والتحليلات الذكية",
          business: "النشاط",
          category: "الفئة",
          loading: "جارٍ تحميل التقارير...",
          noData: "لا توجد بيانات متاحة.",
          noActivity: "لا توجد بيانات نشاط بعد.",
          noRevenue: "لا توجد بيانات إيرادات بعد.",
          noSources: "لا توجد بيانات مصادر بعد.",
          noKeywords: "لا توجد بيانات كلمات بحث بعد.",
          direct: "مباشر",
          categoryIntent: "فئة",
          nearby: "قريب",
          totalConversations: "إجمالي المحادثات",
          revenue: "الإيراد",
          averageDaily: "متوسط المحادثات اليومي",
          avgRevenueDaily: "متوسط الإيراد اليومي",
          periodSummary: "ملخص الفترة",
          currentPeriod: "الفترة الحالية",
          pricing: "التسعير",
          activityTrend: "اتجاه المحادثات",
          revenueTrend: "اتجاه الإيراد",
          sourceSplit: "توزيع النوايا",
          keyInsights: "تحليلات ذكية",
          recommendations: "التوصيات",
          from: "من",
          to: "إلى",
          week: "آخر 7 أيام",
          month: "آخر 30 يوم",
          quarter: "آخر 90 يوم",
          peakDay: "أفضل يوم",
          strongestIntent: "أقوى نية",
          performanceScore: "تقييم الأداء",
          noBusiness: "النشاط",
          noCategory: "الفئة",
          stableMessage:
            "الأداء مستقر. استمر في مراقبة النية التي تولد أعلى تدفق من العملاء.",
          growthMessage:
            "نية الفئة والقريب تصنعان زخمًا جيدًا. فكر في تخصيص ميزانية أكبر لهما.",
          directMessage:
            "النية المباشرة قوية. ركّز على الثقة بالعلامة التجارية ورسالة تحويل أوضح.",
          nearbyMessage:
            "نية البحث القريب فعالة. حسّن دقة الموقع والظهور المحلي لزيادة النتائج.",
          categoryMessage:
            "نية الفئة تتصدر. وسّع الكلمات المفتاحية وتموضعك داخل الفئة.",
          lowActivityMessage:
            "النشاط ما زال محدودًا. حسّن الوصف والكلمات المفتاحية ودقة الموقع لزيادة الظهور.",
          balanceTip:
            "استخدم رصيد المحفظة مع حجم المحادثات الأخير لتخطيط خطوتك القادمة في الميزانية.",
          forecastTitle: "التوقعات",
          estimatedNext7Days: "المتوقع خلال 7 أيام",
          estimatedNext30Days: "المتوقع خلال 30 يوم",
          conversations: "محادثة",
          currency: "USD",
        },
      })[lang],
    [lang]
  );

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

        if (cancelled) return;
        setData(normalizeReportsData(d));
      } catch (e) {
        console.error("Reports load error:", e);
        if (!cancelled) {
          setMsg(e?.message || t.noData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [navigate, t.noData]);

  const rangeDays = useMemo(() => {
    if (range === "7d") return 7;
    if (range === "90d") return 90;
    return 30;
  }, [range]);

  const filteredActivity = useMemo(() => {
    const all = Array.isArray(data?.activity) ? data.activity : [];
    if (!all.length) return [];
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
      revenue:
        Number(d.direct || 0) * Number(data?.pricing?.direct || 0.25) +
        Number(d.category || 0) * Number(data?.pricing?.category || 0.3) +
        Number(d.nearby || 0) * Number(data?.pricing?.nearby || 0.4),
    }));
  }, [filteredActivity, data?.pricing, isAr]);

  const totalConversations = Number(data?.total_billed_conversations || 0);
  const directStarts = Number(data?.direct_starts || 0);
  const categoryStarts = Number(data?.category_starts || 0);
  const nearbyStarts = Number(data?.nearby_starts || 0);
  const revenue = Number(data?.estimated_revenue || 0);
  const currency = data?.currency || t.currency;

  const averageDaily = chartData.length
    ? (chartData.reduce((sum, item) => sum + item.total, 0) / chartData.length).toFixed(1)
    : "0";

  const avgRevenueDaily = chartData.length
    ? (chartData.reduce((sum, item) => sum + item.revenue, 0) / chartData.length).toFixed(2)
    : "0.00";

  const peakDay = useMemo(() => {
    if (!chartData.length) return "-";
    const best = [...chartData].sort((a, b) => b.total - a.total)[0];
    return best?.date || "-";
  }, [chartData]);

  const strongestIntent = useMemo(() => {
    const entries = [
      { key: "direct", label: t.direct, value: directStarts },
      { key: "category", label: t.categoryIntent, value: categoryStarts },
      { key: "nearby", label: t.nearby, value: nearbyStarts },
    ].sort((a, b) => b.value - a.value);

    return entries[0]?.label || "-";
  }, [directStarts, categoryStarts, nearbyStarts, t]);

  const performanceScore = useMemo(() => {
    const volumeScore = Math.min(40, totalConversations * 2);
    const revenueScore = Math.min(35, revenue * 2);
    const diversityCount = [directStarts, categoryStarts, nearbyStarts].filter((v) => v > 0).length;
    const diversityScore = diversityCount * 8;
    const consistencyScore = chartData.length >= 7 ? 9 : chartData.length >= 3 ? 5 : 2;
    return Math.min(100, Math.round(volumeScore + revenueScore + diversityScore + consistencyScore));
  }, [totalConversations, revenue, directStarts, categoryStarts, nearbyStarts, chartData.length]);

  const sourceData = useMemo(
    () => [
      { name: t.direct, value: directStarts },
      { name: t.categoryIntent, value: categoryStarts },
      { name: t.nearby, value: nearbyStarts },
    ].filter((item) => item.value > 0),
    [t, directStarts, categoryStarts, nearbyStarts]
  );

  const insights = useMemo(() => {
    const items = [];

    if (totalConversations <= 5) {
      items.push(t.lowActivityMessage);
    } else {
      items.push(t.stableMessage);
    }

    if (categoryStarts >= directStarts && categoryStarts >= nearbyStarts && categoryStarts > 0) {
      items.push(t.categoryMessage);
    }

    if (nearbyStarts >= directStarts && nearbyStarts >= categoryStarts && nearbyStarts > 0) {
      items.push(t.nearbyMessage);
    }

    if (directStarts >= categoryStarts && directStarts >= nearbyStarts && directStarts > 0) {
      items.push(t.directMessage);
    }

    if (categoryStarts + nearbyStarts > directStarts) {
      items.push(t.growthMessage);
    }

    items.push(t.balanceTip);

    return items.slice(0, 4);
  }, [
    totalConversations,
    directStarts,
    categoryStarts,
    nearbyStarts,
    t.lowActivityMessage,
    t.stableMessage,
    t.categoryMessage,
    t.nearbyMessage,
    t.directMessage,
    t.growthMessage,
    t.balanceTip,
  ]);

  const forecast = useMemo(() => {
    const dailyAvg = Number(averageDaily || 0);
    return {
      next7: Math.round(dailyAvg * 7),
      next30: Math.round(dailyAvg * 30),
    };
  }, [averageDaily]);

  if (loading) {
    return (
      <PageWrap isAr={isAr}>
        <Panel>{t.loading}</Panel>
      </PageWrap>
    );
  }

  if (!data) {
    return (
      <PageWrap isAr={isAr}>
        <Panel>{msg || t.noData}</Panel>
      </PageWrap>
    );
  }

  return (
    <PageWrap isAr={isAr}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">{t.subtitle}</p>
            <p className="mt-2 text-sm text-slate-500">
              {t.from}: {chartData[0]?.date || "-"} {" — "} {t.to}:{" "}
              {chartData[chartData.length - 1]?.date || "-"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <RangeButton active={range === "7d"} onClick={() => setRange("7d")} label={t.week} />
            <RangeButton active={range === "30d"} onClick={() => setRange("30d")} label={t.month} />
            <RangeButton active={range === "90d"} onClick={() => setRange("90d")} label={t.quarter} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard label={t.direct} value={directStarts} />
          <SummaryCard label={t.categoryIntent} value={categoryStarts} />
          <SummaryCard label={t.nearby} value={nearbyStarts} />
          <SummaryCard label={t.totalConversations} value={totalConversations} />
          <SummaryCard label={t.revenue} value={`${revenue.toFixed(2)} ${currency}`} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel>
            <h3 className="text-base font-semibold text-slate-900">{t.periodSummary}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <MiniRow label={t.business} value={data.business || t.noBusiness} />
              <MiniRow label={t.category} value={data.category || t.noCategory} />
              <MiniRow label={t.averageDaily} value={averageDaily} />
              <MiniRow label={t.avgRevenueDaily} value={`${avgRevenueDaily} ${currency}`} />
              <MiniRow label={t.peakDay} value={peakDay} />
              <MiniRow label={t.strongestIntent} value={strongestIntent} />
              <MiniRow label={t.performanceScore} value={`${performanceScore}/100`} />
            </div>
          </Panel>

          <Panel>
            <h3 className="text-base font-semibold text-slate-900">{t.pricing}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <MiniRow label={t.direct} value={`${Number(data?.pricing?.direct || 0).toFixed(2)} ${currency}`} />
              <MiniRow label={t.categoryIntent} value={`${Number(data?.pricing?.category || 0).toFixed(2)} ${currency}`} />
              <MiniRow label={t.nearby} value={`${Number(data?.pricing?.nearby || 0).toFixed(2)} ${currency}`} />
            </div>
          </Panel>

          <Panel>
            <h3 className="text-base font-semibold text-slate-900">{t.forecastTitle}</h3>
            <div className="mt-4 space-y-3 text-sm">
              <MiniRow label={t.estimatedNext7Days} value={`${forecast.next7} ${t.conversations}`} />
              <MiniRow label={t.estimatedNext30Days} value={`${forecast.next30} ${t.conversations}`} />
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel>
            <SectionTitle>{t.activityTrend}</SectionTitle>
            {chartData.length ? (
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="direct" stackId="1" stroke="#22c55e" fill="#22c55e" name={t.direct} />
                    <Area type="monotone" dataKey="category" stackId="1" stroke="#3b82f6" fill="#3b82f6" name={t.categoryIntent} />
                    <Area type="monotone" dataKey="nearby" stackId="1" stroke="#f59e0b" fill="#f59e0b" name={t.nearby} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyText>{t.noActivity}</EmptyText>
            )}
          </Panel>

          <Panel>
            <SectionTitle>{t.revenueTrend}</SectionTitle>
            {chartData.length ? (
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#16a34a" name={t.revenue} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyText>{t.noRevenue}</EmptyText>
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel>
            <SectionTitle>{t.sourceSplit}</SectionTitle>
            {sourceData.length ? (
              <div className="space-y-4">
                {sourceData.map((item) => {
                  const percentage = totalConversations > 0 ? Math.round((item.value / totalConversations) * 100) : 0;
                  return (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between text-sm">
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
              <EmptyText>{t.noSources}</EmptyText>
            )}
          </Panel>

          <Panel>
            <SectionTitle>{t.keyInsights}</SectionTitle>
            <div className="space-y-3">
              {insights.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
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
      style={{ fontFamily: "Tajawal, Inter, sans-serif" }}
    >
      {children}
    </div>
  );
}

function Panel({ children }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">{children}</div>;
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
      <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
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
