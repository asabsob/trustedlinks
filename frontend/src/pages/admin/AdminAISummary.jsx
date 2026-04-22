import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Brain,
  RefreshCcw,
  Sparkles,
  Activity,
  ShieldAlert,
  TrendingUp,
  Clock3,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function AdminAISummary() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";

  const text = useMemo(
    () => ({
      title: isAr ? "الملخص التنفيذي الذكي" : "AI Executive Summary",
      subtitle: isAr
        ? "تحليل ذكي فوري لحالة المنصة والأداء والمخاطر"
        : "Instant AI intelligence for platform health, performance, and risk",
      refreshing: isAr ? "جارٍ التحديث..." : "Refreshing...",
      refresh: isAr ? "تحديث" : "Refresh",
      noToken: isAr ? "لا يوجد توكن أدمن." : "Admin token missing.",
      noSummary: isAr ? "لا يوجد ملخص بعد." : "No summary yet.",
      failed: isAr ? "فشل تحميل الملخص الذكي." : "Failed to load AI summary.",
      generated: isAr ? "تم الإنشاء" : "Generated",
      lastUpdated: isAr ? "آخر تحديث" : "Last updated",
      highPriority: isAr ? "أولوية عالية" : "High Priority",
      riskSignal: isAr ? "إشارة مخاطر" : "Risk Signal",
      performance: isAr ? "الأداء" : "Performance",
      readiness: isAr ? "جاهزية التشغيل" : "Operational Readiness",
      insight: isAr ? "رؤية فورية" : "Instant Insight",
      healthy: isAr ? "مستقر" : "Stable",
      warning: isAr ? "تنبيه" : "Warning",
      active: isAr ? "نشط" : "Active",
      summaryTitle: isAr ? "التحليل الذكي" : "AI Analysis",
    }),
    [isAr]
  );

  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [error, setError] = useState("");

  const formatNow = useCallback(() => {
    return new Date().toLocaleString(isAr ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [isAr]);

  const summaryMeta = useMemo(() => {
    const content = String(summary || "").toLowerCase();

    const hasRisk =
      content.includes("risk") ||
      content.includes("fraud") ||
      content.includes("block") ||
      content.includes("hold") ||
      content.includes("مخاطر") ||
      content.includes("احتيال") ||
      content.includes("حظر") ||
      content.includes("معلقة");

    const hasGrowth =
      content.includes("growth") ||
      content.includes("increase") ||
      content.includes("revenue") ||
      content.includes("performance") ||
      content.includes("نمو") ||
      content.includes("ارتفاع") ||
      content.includes("الإيرادات") ||
      content.includes("الأداء");

    return {
      riskTone: hasRisk ? text.warning : text.healthy,
      performanceTone: hasGrowth ? text.active : text.healthy,
    };
  }, [summary, text]);

  const fetchSummary = useCallback(async () => {
    if (!token) {
      setError(text.noToken);
      setSummary("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/ai-summary`, {
        method: "POST",
        headers: {
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
        throw new Error(data.error || text.failed);
      }

      setSummary(data.summary || text.noSummary);
      setTimestamp(formatNow());
    } catch (err) {
      console.error(err);
      setError(err.message || text.failed);
      setSummary("");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, formatNow, text, token]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="space-y-5 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <Brain className="h-4 w-4" />
            {text.title}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">{text.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{text.subtitle}</p>
          </div>
        </div>

        <button
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? text.refreshing : text.refresh}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Sparkles}
          title={text.insight}
          value={summary ? text.generated : text.noSummary}
          tone="emerald"
        />
        <MetricCard
          icon={ShieldAlert}
          title={text.riskSignal}
          value={summaryMeta.riskTone}
          tone={summaryMeta.riskTone === text.warning ? "amber" : "green"}
        />
        <MetricCard
          icon={TrendingUp}
          title={text.performance}
          value={summaryMeta.performanceTone}
          tone="blue"
        />
        <MetricCard
          icon={Clock3}
          title={text.lastUpdated}
          value={timestamp || "—"}
          tone="slate"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-900">
              {text.summaryTitle}
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonLine />
              <SkeletonLine />
              <SkeletonLine short />
              <SkeletonLine />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap leading-8 text-gray-700">
              {summary || text.noSummary}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SideInfoCard
            icon={CheckCircle2}
            title={text.readiness}
            tone="emerald"
            body={
              isAr
                ? "هذا القسم مصمم لعرض القراءة التنفيذية الذكية بسرعة، مع تحديث مباشر عند الطلب."
                : "This panel is optimized for fast executive AI readouts with on-demand refresh."
            }
          />

          <SideInfoCard
            icon={ShieldAlert}
            title={text.highPriority}
            tone="amber"
            body={
              isAr
                ? "يُستخدم لتتبع الإشارات الحرجة في الأداء والاحتيال وسلوك المنصة من منظور إداري."
                : "Used to surface high-priority platform, fraud, and performance signals for admin review."
            }
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

function SideInfoCard({ icon: Icon, title, body, tone = "emerald" }) {
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

function SkeletonLine({ short = false }) {
  return (
    <div
      className={`h-4 animate-pulse rounded bg-gray-200 ${
        short ? "w-2/3" : "w-full"
      }`}
    />
  );
}
