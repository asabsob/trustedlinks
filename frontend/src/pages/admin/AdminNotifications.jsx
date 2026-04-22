import React, { useMemo, useState } from "react";
import {
  Bell,
  Send,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Wallet,
  CheckCircle2,
  RefreshCcw,
  Megaphone,
} from "lucide-react";
import { api } from "../../utils/api";
import { useLang } from "../../context/LangContext.jsx";

export default function AdminNotifications() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [msg, setMsg] = useState("");
  const [type, setType] = useState("system");
  const [priority, setPriority] = useState("normal");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState("");

  const presets = useMemo(
    () => [
      {
        key: "low_balance",
        icon: Wallet,
        title: t("Low Balance Alert", "تنبيه رصيد منخفض"),
        type: "billing",
        priority: "high",
        message: t(
          "Alert: Several business wallets are running low and may stop receiving billable conversations soon.",
          "تنبيه: عدة محافظ لأنشطة تجارية أصبحت منخفضة وقد تتوقف قريبًا عن استقبال المحادثات القابلة للفوترة."
        ),
      },
      {
        key: "fraud_review",
        icon: ShieldAlert,
        title: t("Fraud Review Alert", "تنبيه مراجعة الاحتيال"),
        type: "fraud",
        priority: "critical",
        message: t(
          "Critical alert: Suspicious activity and pending fraud charges require immediate admin review.",
          "تنبيه حرج: توجد أنشطة مشبوهة وعمليات معلقة تتطلب مراجعة إدارية فورية."
        ),
      },
      {
        key: "system_health",
        icon: AlertTriangle,
        title: t("System Health Alert", "تنبيه صحة النظام"),
        type: "system",
        priority: "high",
        message: t(
          "System notice: Platform operations should be reviewed due to unusual activity or service instability.",
          "إشعار نظام: يُنصح بمراجعة تشغيل المنصة بسبب نشاط غير اعتيادي أو عدم استقرار في الخدمة."
        ),
      },
      {
        key: "campaign",
        icon: Megaphone,
        title: t("Admin Announcement", "إعلان إداري"),
        type: "announcement",
        priority: "normal",
        message: t(
          "Admin update: A new platform-level announcement is ready to be sent.",
          "تحديث إداري: يوجد إعلان جديد على مستوى المنصة جاهز للإرسال."
        ),
      },
    ],
    [isAr]
  );

  const aiSuggestions = useMemo(
    () => [
      t(
        "AI Insight: Fraud activity is stable, but duplicate no-charge events are rising and should be monitored.",
        "رؤية ذكية: نشاط الاحتيال مستقر، لكن حالات التكرار بدون خصم في ارتفاع ويجب مراقبتها."
      ),
      t(
        "AI Insight: A group of businesses may soon require balance top-ups to avoid billing interruptions.",
        "رؤية ذكية: مجموعة من الأنشطة قد تحتاج قريبًا إلى تعبئة رصيد لتجنب توقف الفوترة."
      ),
      t(
        "AI Insight: Platform performance is healthy overall, with selected operational risks needing proactive follow-up.",
        "رؤية ذكية: أداء المنصة جيد عمومًا، مع وجود بعض المخاطر التشغيلية التي تحتاج متابعة استباقية."
      ),
    ],
    [isAr]
  );

  const priorityClasses = {
    normal: "bg-gray-100 text-gray-700",
    high: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
  };

  const typeClasses = {
    system: "bg-blue-100 text-blue-700",
    fraud: "bg-red-100 text-red-700",
    billing: "bg-emerald-100 text-emerald-700",
    announcement: "bg-purple-100 text-purple-700",
  };

  function applyPreset(preset) {
    setMsg(preset.message);
    setType(preset.type);
    setPriority(preset.priority);
    setGenerated("");
    setError("");
    setSent(false);
  }

  function generateSmartMessage() {
    const index = Math.floor(Math.random() * aiSuggestions.length);
    const text = aiSuggestions[index];
    setGenerated(text);
    setMsg(text);
    setError("");
    setSent(false);
  }

  async function send() {
    if (loading) return;

    const text = msg.trim();
    if (!text) {
      setError(t("Message cannot be empty", "لا يمكن أن تكون الرسالة فارغة"));
      return;
    }

    setLoading(true);
    setError("");
    setSent(false);

    try {
      await api.sendNotification({
        message: text,
        type,
        priority,
      });

      setSent(true);
      setMsg("");
      setGenerated("");
    } catch (e) {
      console.error(e);
      setError(t("Failed to send notification", "فشل في إرسال الإشعار"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`space-y-6 ${isAr ? "text-right" : "text-left"}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-400 p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-bold">
              {t("Notification Center", "مركز التنبيهات")}
            </h1>
            <p className="mt-1 text-sm text-white/90">
              {t(
                "Create and send operational, billing, fraud, and AI-generated alerts from one place.",
                "أنشئ وأرسل التنبيهات التشغيلية والمالية وتنبيهات الاحتيال والتنبيهات الذكية من مكان واحد."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("Quick Alerts", "تنبيهات جاهزة")}
              </h2>
            </div>

            <div className="grid gap-3">
              {presets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-start transition hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="rounded-xl bg-white p-2 text-emerald-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {preset.title}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {preset.message}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("AI Generated Alert", "تنبيه ذكي مولّد")}
              </h2>
            </div>

            <button
              type="button"
              onClick={generateSmartMessage}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <RefreshCcw className="h-4 w-4" />
              {t("Generate Smart Alert", "توليد تنبيه ذكي")}
            </button>

            {generated && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">
                {generated}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Send className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("Compose Notification", "صياغة التنبيه")}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("Type", "النوع")}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="system">{t("System", "نظام")}</option>
                <option value="fraud">{t("Fraud", "احتيال")}</option>
                <option value="billing">{t("Billing", "فوترة")}</option>
                <option value="announcement">{t("Announcement", "إعلان")}</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("Priority", "الأولوية")}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="normal">{t("Normal", "عادية")}</option>
                <option value="high">{t("High", "مرتفعة")}</option>
                <option value="critical">{t("Critical", "حرجة")}</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeClasses[type]}`}>
              {t("Type", "النوع")}: {type}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                priorityClasses[priority]
              }`}
            >
              {t("Priority", "الأولوية")}: {priority}
            </span>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t("Message Content", "محتوى الرسالة")}
            </label>

            <textarea
              className={`min-h-[180px] w-full rounded-2xl border border-gray-300 p-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
                isAr ? "text-right" : "text-left"
              }`}
              value={msg}
              onChange={(e) => {
                setMsg(e.target.value);
                if (error) setError("");
                if (sent) setSent(false);
              }}
              placeholder={t("Write your notification message...", "اكتب رسالة التنبيه هنا...")}
            />
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {sent && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("Notification sent successfully.", "تم إرسال التنبيه بنجاح.")}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={send}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
                loading
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Send className="h-4 w-4" />
              {loading ? t("Sending...", "جارٍ الإرسال...") : t("Send Notification", "إرسال التنبيه")}
            </button>

            <button
              type="button"
              onClick={() => {
                setMsg("");
                setGenerated("");
                setError("");
                setSent(false);
                setType("system");
                setPriority("normal");
              }}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {t("Reset", "إعادة ضبط")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
