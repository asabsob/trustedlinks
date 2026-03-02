import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { useLang } from "../../context/LangContext.jsx";
import { Settings as SettingsIcon, CheckCircle2 } from "lucide-react";

export default function AdminSettings() {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const t = (en, ar) => (isRTL ? ar : en);

  const [settings, setSettings] = useState({ theme: "light", email: "" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // ✅ (اختياري) تحميل الإعدادات الحالية من الباكند
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        if (api.getSettings) {
          const s = await api.getSettings();
          if (mounted && s) {
            setSettings({
              theme: s.theme || "light",
              email: s.email || "",
            });
          }
        }
      } catch {
        // ignore - keep defaults
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

  const save = async () => {
    if (loading) return;

    const email = (settings.email || "").trim();
    if (!email) {
      setError(t("Admin email is required", "البريد الإلكتروني مطلوب"));
      return;
    }

    setSaved(false);
    setError("");
    setLoading(true);

    try {
      await api.saveSettings({ ...settings, email });
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
        className="min-h-[200px] flex items-center justify-center text-gray-500 text-sm"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {t("Loading…", "جارٍ التحميل...")}
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${isRTL ? "text-right" : "text-left"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <SettingsIcon className="text-green-600 w-6 h-6" />
        <h2 className="text-xl md:text-2xl font-semibold">
          {t("Settings", "الإعدادات")}
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg shadow-sm">
        {/* Email */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Admin Email", "البريد الإلكتروني للمسؤول")}
          </label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder={t("Enter admin email", "أدخل البريد الإلكتروني للمسؤول")}
            className={`border rounded-lg p-2 w-full mt-1 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isRTL ? "text-right" : "text-left"
            }`}
          />
        </div>

        {/* Theme Selection */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("Theme", "السمة")}
          </label>
          <select
            value={settings.theme}
            onChange={(e) => updateField("theme", e.target.value)}
            className="border rounded-lg p-2 w-full mt-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="light">{t("Light", "فاتح")}</option>
            <option value="dark">{t("Dark", "غامق")}</option>
          </select>

          <p className="text-xs text-gray-500 mt-2">
            {t(
              "Theme is UI-only for now (we'll wire it later).",
              "حاليًا السمة للواجهة فقط (بنربطها لاحقًا)."
            )}
          </p>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-white font-medium transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? t("Saving...", "جارٍ الحفظ...") : t("Save", "حفظ")}
        </button>

        {/* Status Messages */}
        {saved && (
          <div className="flex items-center gap-2 text-green-600 mt-3 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {t("Saved successfully!", "تم الحفظ بنجاح!")}
          </div>
        )}
        {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
      </div>
    </div>
  );
}
