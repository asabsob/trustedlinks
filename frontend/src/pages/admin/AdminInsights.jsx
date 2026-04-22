import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Brain,
  Loader2,
  Lightbulb,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  RefreshCcw,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function AdminInsights() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";

  const text = useMemo(
    () => ({
      title: isAr ? "الرؤى والتحليلات الذكية" : "AI Insights",
      subtitle: isAr
        ? "رؤى تنفيذية متقدمة حول الأداء والمخاطر والنمو والفرص"
        : "Advanced executive intelligence for performance, risk, growth, and opportunities",
      loading: isAr ? "جارٍ تحميل التحليلات..." : "Loading insights...",
      refreshing: isAr ? "جارٍ التحديث..." : "Refreshing...",
      refresh: isAr ? "تحديث" : "Refresh",
      needLogin: isAr ? "أنت غير مسجل دخول كأدمن." : "You are not logged in as admin.",
      failed: isAr ? "فشل تحميل تحليلات الذكاء الاصطناعي." : "Failed to load AI insights.",
      empty: isAr ? "لا توجد تحليلات متاحة حاليًا." : "No insights available yet.",
      hint: isAr
        ? "ستظهر هنا التحليلات الذكية الخاصة بالأداء والتشغيل والاحتيال فور توفرها."
        : "AI-driven performance, operations, and fraud insights will appear here once available.",
      generated: isAr ? "تم التوليد" : "Generated",
      lastUpdated: isAr ? "آخر تحديث" : "Last updated",
      executiveReadiness: isAr ? "الجاهزية التنفيذية" : "Executive Readiness",
      growthSignal: isAr ? "إشارة النمو" : "Growth Signal",
      riskSignal: isAr ? "إشارة المخاطر" : "Risk Signal",
      opsSignal: isAr ? "إشارة التشغيل" : "Operations Signal",
      healthy: isAr ? "مستقر" : "Stable",
      active: isAr ? "نشط" : "Active",
      warning: isAr ? "تنبيه" : "Warning",
      analysis: isAr ? "التحليل التنفيذي" : "Executive Analysis",
      highlights: isAr ? "أبرز النقاط" : "Key Highlights",
      recommendation: isAr ? "قراءة تشغيلية" : "Operational Reading",
      card1: isAr
        ? "مصمم لإظهار مؤشرات المنصة والإيرادات والمخاطر بصورة قابلة للتنفيذ."
        : "Designed to surface platform, revenue, and risk signals in an actionable format.",
      card2: isAr
        ? "يدعم المتابعة الإدارية اليومية ويجمع النظرة التشغيلية مع الذكاء التحليلي."
        : "Supports daily admin oversight by combining operational visibility with analytical intelligence.",
    }),
    [isAr]
  );

  const [loading, setLoading] = useState(true);
  const [insightText, setInsightText] = useState("");
  const [error, setError] = useState("");
  const [timestamp, setTimestamp] = useState("");

  const formatNow = useCallback(() => {
    return new Date().toLocaleString(isAr ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [isAr]);

  const insightMeta = useMemo(() => {
    const content = String(insightText || "").toLowerCase();

    const risk =
      content.includes("risk") ||
      content.includes("fraud") ||
      content.includes("block") ||
      content.includes("hold") ||
      content.includes("warning") ||
      content.includes("مخاطر") ||
      content.includes("احتيال") ||
      content.includes("حظر") ||
      content.includes("معلق") ||
      content.includes("تنبيه");

    const growth =
      content.includes("growth") ||
      content.includes("revenue") ||
      content.includes("performance") ||
      content.includes("increase") ||
      content.includes("opportunity") ||
      content.includes("نمو") ||
      content.includes("الإيراد") ||
      content.includes("الأداء") ||
      content.includes("فرصة") ||
      content.includes("ارتفاع");

    const ops =
      content.includes("operations") ||
      content.includes("process") ||
      content.includes("workflow") ||
      content.includes("efficiency") ||
      content.includes("تشغيل") ||
      content.includes("عملية") ||
      content.includes("كفاءة");

    return {
      riskLabel: risk ? text.warning : text.healthy,
      growthLabel: growth ? text.active : text.healthy,
      opsLabel: ops ? text.active : text.healthy,
    };
  }, [insightText, text]);

  const fetchInsights = useCallback(async () => {
    if (!token) {
      setError(text.needLogin);
      setInsightText("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/insights`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const raw = await res.text();
      let data = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data?.error || text.failed);
      }

      const normalized =
        data?.insight ??
        data?.summary ??
        data?.data?.insight ??
        data?.data?.summary ??
        "";

      setInsightText(String(normalized || ""));
      setTimestamp(formatNow());
    } catch (e) {
      console.error(e);
      setError(e.message || text.failed);
      setInsightText("");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, formatNow, text, token]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`space-y-6 ${isAr ? "text-right" : "text-left"}`}
    >
      <div className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-400 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              {text.title}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{text.title}</h1>
              <p className="mt-1 text-sm text-white/90">{text.subtitle}</p>
            </div>
          </div>

          <button
            onClick={fetchInsights}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? text.refreshing : text.refresh}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Brain}
          title={text.executiveReadiness}
          value={insightText ? text.generated : text.empty}
          tone="emerald"
        />
        <MetricCard
          icon={TrendingUp}
          title={text.growthSignal}
          value={insightMeta.growthLabel}
          tone="blue"
        />
        <MetricCard
          icon={ShieldAlert}
          title={text.riskSignal}
          value={insightMeta.riskLabel}
          tone={insightMeta.riskLabel === text.warning ? "amber" : "green"}
        />
        <MetricCard
          icon={Activity}
          title={text.opsSignal}
          value={insightMeta.opsLabel}
          tone="slate"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">{text.analysis}</h2>
            </div>

            <div className="text-xs text-gray-500">
              {timestamp ? `${text.lastUpdated}: ${timestamp}` : ""}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <p>{text.loading}</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : insightText ? (
            <div className="whitespace-pre-wrap text-sm leading-8 text-gray-700 md:text-base">
              {insightText}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-center text-gray-500">
              <Lightbulb className="mb-3 h-10 w-10 text-emerald-500" />
              <p className="max-w-md text-sm">{text.empty}</p>
              <p className="mt-2 max-w-md text-xs">{text.hint}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <InfoCard
            icon={CheckCircle2}
            title={text.highlights}
            tone="emerald"
            body={text.card1}
          />
          <InfoCard
            icon={AlertTriangle}
            title={text.recommendation}
            tone="amber"
            body={text.card2}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, tone = "slate" }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-50 text-slate-700",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-lg font-bold text-gray-900">{value || "—"}</p>
        </div>
        <div className={`rounded-xl p-3 ${toneMap[tone] || toneMap.slate}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, body, tone = "emerald" }) {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className={`rounded-xl p-2.5 ${toneMap[tone] || toneMap.emerald}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm leading-7 text-gray-600">{body}</p>
    </div>
  );
}
