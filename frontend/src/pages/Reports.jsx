import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  BarChart,
  Bar,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";
const COLORS = ["#22c55e", "#34d399", "#4ade80", "#86efac", "#f59e0b", "#3b82f6"];

export default function Reports({ lang = "en" }) {
  const isAr = lang === "ar";
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");

  const t = useMemo(
    () => ({
      en: {
        title: "Performance Reports",
        subtitle: "Track your business activity, engagement, and trends",
        business: "Business",
        category: "Category",
        loading: "Loading reports...",
        noData: "No data available.",
        noActivity: "No activity data available yet.",
        noSources: "No interaction sources available yet.",
        noKeywords: "No keyword insights available yet.",
        totalClicks: "Total Clicks",
        totalMessages: "Total Messages",
        totalMediaViews: "Total Media Views",
        totalViews: "Total Views",
        conversionRate: "Conversion Rate",
        weeklyGrowth: "Weekly Growth",
        currentPeriod: "Current Period",
        previousPeriod: "Previous Period",
        change: "Change",
        comparedToPrevious: "Compared to previous period",
        activityTrend: "Activity Trend",
        interactionSources: "Interaction Sources",
        latestActivity: "Latest Activity",
        date: "Date",
        total: "Total",
        whatsapp: "WhatsApp",
        media: "Media",
        messages: "Messages",
        views: "Views",
        week: "Last 7 Days",
        month: "Last 30 Days",
        quarter: "Last 90 Days",
        from: "From",
        to: "To",
        periodSummary: "Period Summary",
        currentVsPrevious: "Current vs Previous",
        estimatedValue: "Estimated Value",
        noBusiness: "Business",
        noCategory: "Category",
        vsPrevious: "vs previous",
        keyInsights: "Key Insights",
        recommendations: "Smart Recommendations",
        topKeywords: "Top Search Keywords",
        keyword: "Keyword",
        searches: "Searches",
        clicks: "Clicks",
        conversion: "Conversion",
        lostOpportunities: "Lost Opportunities",
        peakDay: "Peak Activity Day",
        bestSource: "Best Interaction Source",
        totalLeads: "Total Leads",
        lowConversionAlert:
          "Low conversion rate detected. Improve your description, profile image, or category targeting.",
        recommendationKeywords:
          "Add more keywords related to your most searched category to improve discoverability.",
        recommendationProfile:
          "Complete your business profile with stronger description, logo, and clearer branding.",
        recommendationLocation:
          "Improve your location accuracy to increase nearby search visibility.",
        recommendationConversion:
          "Your clicks are high but WhatsApp leads are low. Improve trust elements and offer clarity.",
        recommendationStrong:
          "Your business is performing well. Keep monitoring peak times and top-performing keywords.",
        score: "Performance Score",
        averageDaily: "Avg Daily Activity",
      },
      ar: {
        title: "تقارير الأداء",
        subtitle: "تابع نشاط عملك والتفاعل واتجاهات الأداء",
        business: "النشاط",
        category: "الفئة",
        loading: "جارٍ تحميل التقارير...",
        noData: "لا توجد بيانات متاحة.",
        noActivity: "لا توجد بيانات نشاط كافية بعد.",
        noSources: "لا توجد مصادر تفاعل بعد.",
        noKeywords: "لا توجد بيانات كلمات بحث بعد.",
        totalClicks: "إجمالي النقرات",
        totalMessages: "إجمالي الرسائل",
        totalMediaViews: "إجمالي مشاهدات الوسائط",
        totalViews: "إجمالي المشاهدات",
        conversionRate: "معدل التحويل",
        weeklyGrowth: "النمو الأسبوعي",
        currentPeriod: "الفترة الحالية",
        previousPeriod: "الفترة السابقة",
        change: "التغير",
        comparedToPrevious: "مقارنة بالفترة السابقة",
        activityTrend: "اتجاه النشاط",
        interactionSources: "مصادر التفاعل",
        latestActivity: "آخر النشاط",
        date: "التاريخ",
        total: "الإجمالي",
        whatsapp: "واتساب",
        media: "الوسائط",
        messages: "الرسائل",
        views: "المشاهدات",
        week: "آخر 7 أيام",
        month: "آخر 30 يوم",
        quarter: "آخر 90 يوم",
        from: "من",
        to: "إلى",
        periodSummary: "ملخص الفترة",
        currentVsPrevious: "الحالي مقابل السابق",
        estimatedValue: "القيمة التقديرية",
        noBusiness: "النشاط",
        noCategory: "الفئة",
        vsPrevious: "مقارنة بالسابق",
        keyInsights: "أهم النتائج",
        recommendations: "التوصيات الذكية",
        topKeywords: "أهم كلمات البحث",
        keyword: "الكلمة",
        searches: "مرات البحث",
        clicks: "النقرات",
        conversion: "التحويل",
        lostOpportunities: "فرص مهدورة",
        peakDay: "أعلى يوم نشاطًا",
        bestSource: "أفضل مصدر تفاعل",
        totalLeads: "إجمالي العملاء المتوقعين",
        lowConversionAlert:
          "⚠️ تم رصد معدل تحويل منخفض. حسّن الوصف أو الشعار أو استهداف الفئة.",
        recommendationKeywords:
          "أضف كلمات مفتاحية مرتبطة أكثر بالنشاط الأكثر بحثًا لزيادة الظهور.",
        recommendationProfile:
          "طوّر ملف النشاط بوصف أقوى وشعار أوضح وهوية أكثر احترافية.",
        recommendationLocation:
          "حسّن دقة الموقع لزيادة الظهور في نتائج البحث القريب.",
        recommendationConversion:
          "النقرات مرتفعة لكن التحويل إلى واتساب منخفض. حسّن عناصر الثقة ووضوح العرض.",
        recommendationStrong:
          "أداء النشاط جيد. استمر بمراقبة أوقات الذروة والكلمات الأفضل أداءً.",
        score: "تقييم الأداء",
        averageDaily: "متوسط النشاط اليومي",
      },
    }),
    [isAr]
  )[lang];

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

        const res = await fetch(`${API_BASE}/api/business/reports`, {
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

          if (res.status === 404) {
            throw new Error(isAr ? "لا توجد بيانات تقارير متاحة بعد." : "No report data available yet.");
          }

          throw new Error(d?.error || `HTTP ${res.status}`);
        }

        if (cancelled) return;

        setData({
          ...d,
          sources: Array.isArray(d?.sources) ? d.sources : [],
          activity: Array.isArray(d?.activity) ? normalizeActivity(d.activity) : [],
          keywords: Array.isArray(d?.keywords) ? normalizeKeywords(d.keywords) : [],
        });
      } catch (e) {
        console.error("Reports load error:", e);
        if (!cancelled) {
          setMsg(
            e?.message ||
              (isAr ? "تعذر تحميل التقارير حالياً." : "Unable to load reports right now.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isAr, navigate]);

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

  const previousActivity = useMemo(() => {
    const all = Array.isArray(data?.activity) ? data.activity : [];
    if (!all.length) return [];
    const startIndex = Math.max(0, all.length - rangeDays * 2);
    const endIndex = Math.max(0, all.length - rangeDays);
    return all.slice(startIndex, endIndex);
  }, [data?.activity, rangeDays]);

  const pieData = useMemo(
    () =>
      (data?.sources || []).map((s) => ({
        name: isAr ? s.name_ar || s.name || "" : s.name_en || s.name || "",
        value: Number(s.value || 0),
      })),
    [data?.sources, isAr]
  );

  const keywordData = useMemo(() => {
    return (data?.keywords || []).slice(0, 5);
  }, [data?.keywords]);

  const currentTotals = useMemo(() => sumActivity(filteredActivity), [filteredActivity]);
  const previousTotals = useMemo(() => sumActivity(previousActivity), [previousActivity]);

  const totalClicks = filteredActivity.length
    ? currentTotals.total
    : Number(data?.totalClicks || 0);

  const totalMessages = filteredActivity.length
    ? currentTotals.messages
    : Number(data?.totalMessages || 0);

  const mediaViews = filteredActivity.length
    ? currentTotals.media
    : Number(data?.mediaViews || 0);

  const totalViews = filteredActivity.length
    ? currentTotals.views
    : Number(data?.views || 0);

  const convRateNumber = totalClicks > 0 ? Math.round((totalMessages / totalClicks) * 100) : 0;
  const convRate = totalClicks > 0 ? `${convRateNumber}%` : "-";

  const estimatedValue = `${(totalMessages * 0.15).toFixed(2)} USD`;
  const lostOpportunities = Math.max(0, totalClicks - totalMessages);
  const averageDaily = filteredActivity.length
    ? (totalClicks / filteredActivity.length).toFixed(1)
    : "0";

  const periodStart = filteredActivity[0]?.date || null;
  const periodEnd = filteredActivity[filteredActivity.length - 1]?.date || null;

  const comparisonCards = [
    {
      label: t.totalClicks,
      current: totalClicks,
      previous: previousTotals.total || 0,
    },
    {
      label: t.totalMessages,
      current: totalMessages,
      previous: previousTotals.messages || 0,
    },
    {
      label: t.totalMediaViews,
      current: mediaViews,
      previous: previousTotals.media || 0,
    },
    {
      label: t.totalViews,
      current: totalViews,
      previous: previousTotals.views || 0,
    },
  ];

  const peakDay = getPeakDay(filteredActivity, isAr);
  const bestSource = getBestSource(pieData);
  const performanceScore = getPerformanceScore({
    totalClicks,
    totalMessages,
    totalViews,
    mediaViews,
  });

  const recommendations = getRecommendations({
    isAr,
    totalClicks,
    totalMessages,
    totalViews,
    mediaViews,
    keywordData,
    t,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          {t.loading}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          {msg || t.noData}
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 px-4 py-8 md:px-8"
      style={{ fontFamily: "Tajawal, Inter, sans-serif" }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">{t.subtitle}</p>
            <p className="mt-2 text-sm text-slate-500">
              {t.from}: {periodStart ? formatDate(periodStart, isAr) : "-"} {" — "}
              {t.to}: {periodEnd ? formatDate(periodEnd, isAr) : "-"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <RangeButton
              active={range === "7d"}
              onClick={() => setRange("7d")}
              label={t.week}
            />
            <RangeButton
              active={range === "30d"}
              onClick={() => setRange("30d")}
              label={t.month}
            />
            <RangeButton
              active={range === "90d"}
              onClick={() => setRange("90d")}
              label={t.quarter}
            />
          </div>
        </div>

        {totalClicks > 20 && totalMessages / Math.max(totalClicks, 1) < 0.2 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {t.lowConversionAlert}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem label={t.business} value={data.business || t.noBusiness} />
              <InfoItem label={t.category} value={data.category || t.noCategory} />
              <InfoItem
                label={t.from}
                value={periodStart ? formatDate(periodStart, isAr) : "-"}
              />
              <InfoItem
                label={t.to}
                value={periodEnd ? formatDate(periodEnd, isAr) : "-"}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{t.periodSummary}</p>
            <div className="mt-4 space-y-3">
              <MiniStat label={t.totalClicks} value={totalClicks} />
              <MiniStat label={t.totalMessages} value={totalMessages} />
              <MiniStat label={t.conversionRate} value={convRate} />
              <MiniStat label={t.averageDaily} value={averageDaily} />
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label={t.totalClicks} value={totalClicks} colorClass="text-green-600" />
          <SummaryCard label={t.totalMessages} value={totalMessages} colorClass="text-emerald-500" />
          <SummaryCard label={t.totalMediaViews} value={mediaViews} colorClass="text-lime-500" />
          <SummaryCard label={t.totalViews} value={totalViews} colorClass="text-blue-500" />
          <SummaryCard label={t.conversionRate} value={convRate} colorClass="text-orange-500" />
          <SummaryCard
            label={t.weeklyGrowth}
            value={`${Number(data.weeklyGrowth || 0)}%`}
            colorClass="text-teal-600"
          />
          <SummaryCard
            label={t.estimatedValue}
            value={estimatedValue}
            colorClass="text-green-700"
          />
          <SummaryCard
            label={t.lostOpportunities}
            value={lostOpportunities}
            colorClass="text-red-500"
          />
        </div>

        <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-green-800">{t.keyInsights}</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InsightCard
              label={t.peakDay}
              value={peakDay}
            />
            <InsightCard
              label={t.bestSource}
              value={bestSource}
            />
            <InsightCard
              label={t.totalLeads}
              value={String(totalMessages)}
            />
            <InsightCard
              label={t.score}
              value={`${performanceScore}/100`}
            />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">{t.currentVsPrevious}</h2>
            <p className="text-sm text-slate-500">{t.comparedToPrevious}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {comparisonCards.map((item) => (
              <ComparisonCard
                key={item.label}
                label={item.label}
                current={item.current}
                previous={item.previous}
                isAr={isAr}
                t={t}
              />
            ))}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{t.activityTrend}</h2>

            {filteredActivity.length ? (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => shortDate(value, isAr)}
                      minTickGap={24}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => formatDate(label, isAr)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={false}
                      name={t.totalClicks}
                    />
                    <Line
                      type="monotone"
                      dataKey="whatsapp"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      name={t.whatsapp}
                    />
                    <Line
                      type="monotone"
                      dataKey="media"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      name={t.media}
                    />
                    <Line
                      type="monotone"
                      dataKey="messages"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name={t.messages}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text={t.noActivity} />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{t.interactionSources}</h2>

            {pieData.length ? (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={2}
                      isAnimationActive
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text={t.noSources} />
            )}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{t.topKeywords}</h2>

            {keywordData.length ? (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={keywordData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="keyword" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="searches" fill="#22c55e" name={t.searches} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="clicks" fill="#3b82f6" name={t.clicks} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text={t.noKeywords} />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">{t.recommendations}</h2>

            <div className="space-y-3">
              {recommendations.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t.topKeywords}</h2>
          </div>

          {keywordData.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-3 font-medium">{t.keyword}</th>
                    <th className="px-3 py-3 font-medium">{t.searches}</th>
                    <th className="px-3 py-3 font-medium">{t.clicks}</th>
                    <th className="px-3 py-3 font-medium">{t.conversion}</th>
                  </tr>
                </thead>
                <tbody>
                  {keywordData.map((row, idx) => (
                    <tr key={`${row.keyword}-${idx}`} className="border-b border-slate-100">
                      <td className="px-3 py-3 text-slate-700">{row.keyword}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{row.searches}</td>
                      <td className="px-3 py-3 text-slate-700">{row.clicks}</td>
                      <td className="px-3 py-3 text-slate-700">{row.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text={t.noKeywords} />
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t.latestActivity}</h2>
          </div>

          {filteredActivity.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-3 font-medium">{t.date}</th>
                    <th className="px-3 py-3 font-medium">{t.total}</th>
                    <th className="px-3 py-3 font-medium">{t.whatsapp}</th>
                    <th className="px-3 py-3 font-medium">{t.media}</th>
                    <th className="px-3 py-3 font-medium">{t.messages}</th>
                    <th className="px-3 py-3 font-medium">{t.views}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredActivity].reverse().slice(0, 10).map((row, idx) => (
                    <tr key={`${row.date}-${idx}`} className="border-b border-slate-100">
                      <td className="px-3 py-3 text-slate-700">{formatDate(row.date, isAr)}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{row.total || 0}</td>
                      <td className="px-3 py-3 text-slate-700">{row.whatsapp || 0}</td>
                      <td className="px-3 py-3 text-slate-700">{row.media || 0}</td>
                      <td className="px-3 py-3 text-slate-700">{row.messages || 0}</td>
                      <td className="px-3 py-3 text-slate-700">{row.views || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text={t.noActivity} />
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeActivity(activity = []) {
  return activity.map((item) => ({
    date: normalizeDate(item.date),
    total: Number(item.total || item.clicks || 0),
    whatsapp: Number(item.whatsapp || 0),
    media: Number(item.media || item.mediaViews || 0),
    messages: Number(item.messages || item.totalMessages || 0),
    views: Number(item.views || 0),
  }));
}

function normalizeKeywords(keywords = []) {
  return keywords.map((item) => {
    const searches = Number(item.searches || item.count || 0);
    const clicks = Number(item.clicks || item.leads || 0);
    const conversion = searches > 0 ? Math.round((clicks / searches) * 100) : 0;

    return {
      keyword: item.keyword || item.query || "-",
      searches,
      clicks,
      conversion,
    };
  });
}

function sumActivity(rows = []) {
  return rows.reduce(
    (acc, row) => {
      acc.total += Number(row.total || 0);
      acc.whatsapp += Number(row.whatsapp || 0);
      acc.media += Number(row.media || 0);
      acc.messages += Number(row.messages || 0);
      acc.views += Number(row.views || 0);
      return acc;
    },
    { total: 0, whatsapp: 0, media: 0, messages: 0, views: 0 }
  );
}

function normalizeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function formatDate(value, isAr) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(isAr ? "ar" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function shortDate(value, isAr) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(isAr ? "ar" : "en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function percentageChange(current, previous) {
  const curr = Number(current || 0);
  const prev = Number(previous || 0);

  if (prev === 0 && curr === 0) return 0;
  if (prev === 0) return 100;

  return Math.round(((curr - prev) / prev) * 100);
}

function getPeakDay(activity = [], isAr) {
  if (!activity.length) return "-";
  const max = activity.reduce((a, b) => (Number(b.total || 0) > Number(a.total || 0) ? b : a));
  return formatDate(max.date, isAr);
}

function getBestSource(sources = []) {
  if (!sources.length) return "-";
  const max = sources.reduce((a, b) => (Number(b.value || 0) > Number(a.value || 0) ? b : a));
  return max.name || "-";
}

function getPerformanceScore({ totalClicks, totalMessages, totalViews, mediaViews }) {
  const clicksScore = Math.min(30, Number(totalClicks || 0));
  const leadsScore = Math.min(30, Number(totalMessages || 0) * 2);
  const viewsScore = Math.min(20, Math.round(Number(totalViews || 0) / 5));
  const mediaScore = Math.min(20, Math.round(Number(mediaViews || 0) / 3));

  return Math.min(100, clicksScore + leadsScore + viewsScore + mediaScore);
}

function getRecommendations({ isAr, totalClicks, totalMessages, totalViews, mediaViews, keywordData, t }) {
  const items = [];

  if (keywordData?.length > 0) {
    items.push(t.recommendationKeywords);
  }

  if (totalViews < 20 || mediaViews < 5) {
    items.push(t.recommendationProfile);
  }

  if (totalClicks > 20 && totalMessages / Math.max(totalClicks, 1) < 0.2) {
    items.push(t.recommendationConversion);
  }

  if (totalViews < 10) {
    items.push(t.recommendationLocation);
  }

  if (!items.length) {
    items.push(t.recommendationStrong);
  }

  return items;
}

function RangeButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value, colorClass = "text-slate-900" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <h3 className={`mt-2 text-3xl font-bold ${colorClass}`}>{value || 0}</h3>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ComparisonCard({ label, current, previous, t }) {
  const change = percentageChange(current, previous);
  const isPositive = change >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <div className="mt-3">
        <p className="text-2xl font-bold text-slate-900">{current || 0}</p>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {isPositive ? "+" : ""}
            {change}%
          </span>

          <span className="text-xs text-slate-500">{t.vsPrevious}</span>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ label, value }) {
  return (
    <div className="rounded-xl border border-green-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-green-700">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-slate-50 px-6 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
