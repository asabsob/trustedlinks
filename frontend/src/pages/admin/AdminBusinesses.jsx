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
      // support different backends
      if (["active", "activated", "enabled"].includes(s)) return "active";
      if (["trial", "trialing"].includes(s)) return "trial";
      if (["suspended", "blocked", "disabled"].includes(s)) return "inactive";
      if (!s) return "inactive";
      return s; // fallback
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
        // ✅ CHANGE THIS ENDPOINT if your backend uses a different path
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

        const list = Array.isArray(payload) ? payload : payload.businesses || payload.data || [];
        if (!cancelled) setData(Array.isArray(list) ? list : []);
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

  return (
    <div
      className={`space-y-6 transition-all duration-300 ${isAr ? "text-right" : "text-left"}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* 🟢 Page Title */}
      <h2 className="text-xl md:text-2xl font-semibold text-green-600">
        {t("Businesses", "الأنشطة التجارية")}
      </h2>

      {/* 🗂️ Businesses Table */}
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
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className={`border-b bg-gray-50 text-gray-700 ${isAr ? "text-right" : "text-left"}`}>
                  <th className="p-3 font-medium">{t("Name", "الاسم")}</th>
                  <th className="p-3 font-medium">{t("Status", "الحالة")}</th>
                  <th className="p-3 font-medium">{t("Clicks", "عدد النقرات")}</th>
                </tr>
              </thead>

              <tbody>
                {data.map((b) => {
                  const s = normalizeStatus(b.status);
                  const clicksCount =
                    typeof b.clicks === "number"
                      ? b.clicks
                      : Array.isArray(b.clicks)
                      ? b.clicks.length
                      : typeof b.totalClicks === "number"
                      ? b.totalClicks
                      : 0;

                  return (
                    <tr
                      key={b.id || b._id || b.businessId}
                      className="border-b hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="p-3">
                        {b.name || b.nameAr || b.nameEn || t("Unnamed", "بدون اسم")}
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
