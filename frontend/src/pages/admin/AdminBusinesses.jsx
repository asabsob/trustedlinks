import { useEffect, useMemo, useState } from "react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function AdminBusinesses() {
  const { lang } = useLang();
  const { token } = useAdminAuth();

  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizeStatus = useMemo(() => {
    return (raw) => {
      const s = (raw || "").toString().trim().toLowerCase();
      if (["active", "activated", "enabled"].includes(s)) return "active";
      if (["trial", "trialing"].includes(s)) return "trial";
      if (["suspended", "blocked", "disabled", "inactive"].includes(s)) return "inactive";
      if (!s) return "inactive";
      return s;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      if (!token) {
        setError(t("Admin token missing.", "لا يوجد توكن أدمن."));
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/admin/businesses`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const txt = await res.text();
        let payload = {};
        try {
          payload = JSON.parse(txt);
        } catch {
          payload = {};
        }

        if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`);

        const list = Array.isArray(payload)
          ? payload
          : payload.results || payload.businesses || payload.data || [];

        if (!cancelled) {
          setData(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError(t("Failed to load businesses", "فشل في تحميل الأنشطة التجارية"));
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, isAr]);

  async function handleBusinessAction(id, action) {
    if (!id || !token) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/businesses/${id}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }

      setData((prev) =>
        prev.map((b) => {
          const currentId = b.id || b._id || b.businessId;
          if (String(currentId) !== String(id)) return b;

          return {
            ...b,
            status: action === "activate" ? "Active" : "Suspended",
          };
        })
      );
    } catch (e) {
      console.error(`Business ${action} error:`, e);
      alert(
        t(
          `Failed to ${action} business`,
          action === "activate"
            ? "فشل في تفعيل النشاط"
            : "فشل في تعليق النشاط"
        )
      );
    }
  }

  return (
    <div
      className={`space-y-6 transition-all duration-300 ${isAr ? "text-right" : "text-left"}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <h2 className="text-xl md:text-2xl font-semibold text-green-600">
        {t("Businesses", "الأنشطة التجارية")}
      </h2>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        {loading ? (
          <p className="text-gray-500 text-sm">
            {t("Loading businesses...", "جارٍ تحميل الأنشطة التجارية...")}
          </p>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : data.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {t("No businesses found", "لا توجد أنشطة تجارية")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px]">
              <thead>
                <tr className={`border-b bg-gray-50 text-gray-700 ${isAr ? "text-right" : "text-left"}`}>
                  <th className="p-3 font-medium">{t("Name", "الاسم")}</th>
                  <th className="p-3 font-medium">{t("Status", "الحالة")}</th>
                  <th className="p-3 font-medium">{t("Clicks", "عدد النقرات")}</th>
                  <th className="p-3 font-medium">{t("Wallet", "الرصيد")}</th>
                  <th className="p-3 font-medium">{t("Fraud", "الاحتيال")}</th>
                  <th className="p-3 font-medium">{t("Actions", "الإجراءات")}</th>
                </tr>
              </thead>

              <tbody>
                {data.map((b) => {
                  const rowId = b.id || b._id || b.businessId;
                  const s = normalizeStatus(b.status);

                  const clicksCount =
                    typeof b.clicks === "number"
                      ? b.clicks
                      : Array.isArray(b.clicks)
                      ? b.clicks.length
                      : typeof b.totalClicks === "number"
                      ? b.totalClicks
                      : 0;

                  const walletBalance =
                    Number(
                      b.wallet_balance ??
                        b.walletBalance ??
                        b.wallet?.balance ??
                        0
                    ) || 0;

                  const suspiciousEvents =
                    Number(
                      b.suspicious_events ??
                        b.suspiciousEvents ??
                        b.fraud?.suspiciousEvents ??
                        0
                    ) || 0;

                  const fraudLabel =
                    suspiciousEvents > 10
                      ? t("High Risk", "مخاطر مرتفعة")
                      : suspiciousEvents > 0
                      ? t("Watch", "مراقبة")
                      : t("Safe", "آمن");

                  const fraudClass =
                    suspiciousEvents > 10
                      ? "text-red-600"
                      : suspiciousEvents > 0
                      ? "text-amber-600"
                      : "text-green-600";

                  return (
                    <tr
                      key={rowId}
                      className="border-b hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="p-3 font-medium">
                        {b.name || b.name_ar || b.nameAr || b.nameEn || t("Unnamed", "بدون اسم")}
                      </td>

                      <td
                        className={`p-3 capitalize font-medium ${
                          s === "active"
                            ? "text-green-600"
                            : s === "trial"
                            ? "text-yellow-600"
                            : "text-gray-500"
                        }`}
                      >
                        {t(
                          s === "active" ? "Active" : s === "trial" ? "Trial" : "Inactive",
                          s === "active" ? "نشط" : s === "trial" ? "تجريبي" : "غير نشط"
                        )}
                      </td>

                      <td className="p-3">{clicksCount}</td>

                      <td className="p-3 font-semibold text-gray-800">
                        {walletBalance.toFixed(2)} USD
                      </td>

                      <td className={`p-3 font-medium ${fraudClass}`}>
                        {fraudLabel}
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleBusinessAction(rowId, "activate")}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition"
                          >
                            {t("Activate", "تفعيل")}
                          </button>

                          <button
                            onClick={() => handleBusinessAction(rowId, "suspend")}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition"
                          >
                            {t("Suspend", "تعليق")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
