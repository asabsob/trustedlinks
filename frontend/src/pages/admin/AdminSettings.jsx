import React, { useEffect, useMemo, useState } from "react";
import {
  Settings as SettingsIcon,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Palette,
  BellRing,
  AlertTriangle,
  Save,
} from "lucide-react";
import { api } from "../../utils/api";
import { useLang } from "../../context/LangContext.jsx";

export default function AdminSettings() {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const t = (en, ar) => (isRTL ? ar : en);

  const [settings, setSettings] = useState({
    theme: "light",
    email: "",
    notificationsEnabled: true,
    fraudAlertsEnabled: true,
    billingAlertsEnabled: true,
    dailySummaryEnabled: true,
    criticalOnlyMode: false,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (api.getSettings) {
          const s = await api.getSettings();

          if (mounted && s) {
            setSettings((prev) => ({
              ...prev,
              theme: s.theme || "light",
              email: s.email || "",
              notificationsEnabled:
                typeof s.notificationsEnabled === "boolean"
                  ? s.notificationsEnabled
                  : true,
              fraudAlertsEnabled:
                typeof s.fraudAlertsEnabled === "boolean"
                  ? s.fraudAlertsEnabled
                  : true,
              billingAlertsEnabled:
                typeof s.billingAlertsEnabled === "boolean"
                  ? s.billingAlertsEnabled
                  : true,
              dailySummaryEnabled:
                typeof s.dailySummaryEnabled === "boolean"
                  ? s.dailySummaryEnabled
                  : true,
              criticalOnlyMode:
                typeof s.criticalOnlyMode === "boolean"
                  ? s.criticalOnlyMode
                  : false,
            }));
          }
        }
      } catch {
        // keep defaults
      } finally {
        if (mounted) setInitialLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (saved) setSaved(false);
    if (error) setError("");
  };

  const settingCards = useMemo(
    () => [
      {
        key: "notificationsEnabled",
        icon: BellRing,
        title: t("Notifications", "التنبيهات"),
        desc: t(
          "Enable general admin notifications and operational updates.",
          "تفعيل تنبيهات الأدمن العامة وتحديثات التشغيل."
        ),
      },
      {
        key: "fraudAlertsEnabled",
        icon: ShieldCheck,
        title: t("Fraud Alerts", "تنبيهات الاحتيال"),
        desc: t(
          "Receive fraud-related alerts, suspicious activity notices, and review triggers.",
          "استقبال تنبيهات الاحتيال والأنشطة المشبوهة وطلبات المراجعة."
        ),
      },
      {
        key: "billingAlertsEnabled",
        icon: AlertTriangle,
        title: t("Billing Alerts", "تنبيهات الفوترة"),
        desc: t(
          "Track low balances, negative wallets, failed charges, and billing issues.",
          "متابعة الأرصدة المنخفضة والسالبة وفشل الخصم ومشاكل الفوترة."
        ),
      },
      {
        key: "dailySummaryEnabled",
        icon: Mail,
        title: t("Daily Summary", "الملخص اليومي"),
        desc: t(
          "Enable daily executive-style summaries for platform activity.",
          "تفعيل الملخصات اليومية التنفيذية لنشاط المنصة."
        ),
      },
      {
        key: "criticalOnlyMode",
        icon: ShieldCheck,
        title: t("Critical Only Mode", "وضع التنبيهات الحرجة فقط"),
        desc: t(
          "Show only the highest-priority alerts for focused admin monitoring.",
          "إظهار التنبيهات الأعلى أولوية فقط للمتابعة الإدارية المركزة."
        ),
      },
    ],
    [isRTL]
  );

  const save = async () => {
    if (loading) return;

    const email = (settings.email || "").trim();
    if (!email) {
      setError(t("Admin email is required", "البريد الإلكتروني مطلوب"));
      return;
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setError(t("Please enter a valid email", "يرجى إدخال بريد إلكتروني صحيح"));
      return;
    }

    setSaved(false);
    setError("");
    setLoading(true);

    try {
      await api.saveSettings({
        ...settings,
        email,
      });
      setSaved(true);
    } catch {
      setError(t("Failed to save settings", "فشل في حفظ الإعدادات"));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div
        className="flex min-h-[220px] items-center justify-center text-sm text-gray-500"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {t("Loading settings...", "جارٍ تحميل الإعدادات...")}
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${isRTL ? "text-right" : "text-left"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-400 p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-7 w-7" />
          <div>
            <h1 className="text-2xl font-bold">
              {t("Admin Settings", "إعدادات الإدارة")}
            </h1>
            <p className="mt-1 text-sm text-white/90">
              {t(
                "Manage admin email, appearance, and smart operational alert preferences.",
                "إدارة البريد الإلكتروني والمظهر وتفضيلات التنبيهات التشغيلية الذكية."
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("Admin Identity", "هوية المسؤول")}
              </h2>
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t("Admin Email", "البريد الإلكتروني للمسؤول")}
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder={t("Enter admin email", "أدخل البريد الإلكتروني للمسؤول")}
              className={`w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${
                isRTL ? "text-right" : "text-left"
              }`}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <Palette className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t("Interface Preferences", "تفضيلات الواجهة")}
              </h2>
            </div>

            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t("Theme", "السمة")}
            </label>
            <select
              value={settings.theme}
              onChange={(e) => updateField("theme", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="light">{t("Light", "فاتح")}</option>
              <option value="dark">{t("Dark", "غامق")}</option>
            </select>

            <p className="mt-3 text-xs text-gray-500">
              {t(
                "Theme setting is stored and ready for full UI application.",
                "يتم حفظ إعداد السمة وهو جاهز للتطبيق على كامل الواجهة."
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <BellRing className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("Notification & Monitoring Preferences", "تفضيلات التنبيهات والمراقبة")}
            </h2>
          </div>

          <div className="space-y-4">
            {settingCards.map((item) => {
              const Icon = item.icon;
              const enabled = settings[item.key];

              return (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white p-2.5 text-emerald-600 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateField(item.key, !enabled)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                      enabled ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                    aria-pressed={enabled}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        enabled
                          ? isRTL
                            ? "translate-x-[-4px]"
                            : "translate-x-6"
                          : isRTL
                          ? "translate-x-[-24px]"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
                loading
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <Save className="h-4 w-4" />
              {loading ? t("Saving...", "جارٍ الحفظ...") : t("Save Settings", "حفظ الإعدادات")}
            </button>
          </div>

          {saved && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("Settings saved successfully.", "تم حفظ الإعدادات بنجاح.")}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
