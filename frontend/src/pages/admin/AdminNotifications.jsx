import { useState } from "react";
import { api } from "../../utils/api";
import { useLang } from "../../context/LangContext.jsx";

export default function AdminNotifications() {
  const { lang } = useLang();
  const t = (en, ar) => (lang === "ar" ? ar : en);

  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!msg.trim()) {
      setError(t("Message cannot be empty", "لا يمكن أن تكون الرسالة فارغة"));
      return;
    }
    setLoading(true);
    setError("");
    setSent(false);

    try {
      await api.sendNotification({ message: msg });
      setSent(true);
      setMsg("");
    } catch {
      setError(t("Failed to send notification", "فشل في إرسال الإشعار"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <h2 className="text-xl md:text-2xl font-semibold">
        {t("Send Notification", "إرسال إشعار")}
      </h2>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 max-w-md shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("Message Content", "محتوى الرسالة")}
        </label>
        <textarea
          className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            lang === "ar" ? "text-right" : "text-left"
          }`}
          rows="4"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder={t("Write your message...", "اكتب رسالتك هنا...")}
        />

        {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}

        <button
          onClick={send}
          disabled={loading}
          className={`mt-4 w-full sm:w-auto px-6 py-2.5 rounded-lg text-white font-medium transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? t("Sending...", "جارٍ الإرسال...") : t("Send", "إرسال")}
        </button>

        {sent && (
          <div className="text-green-600 mt-3 text-sm flex items-center gap-1">
            ✅ {t("Sent successfully!", "تم الإرسال بنجاح!")}
          </div>
        )}
      </div>
    </div>
  );
}