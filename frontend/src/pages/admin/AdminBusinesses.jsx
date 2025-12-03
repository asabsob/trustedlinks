import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { useLang } from "../../context/LangContext.jsx";

export default function AdminBusinesses() {
  const { lang } = useLang();
  const t = (en, ar) => (lang === "ar" ? ar : en);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listBusinesses()
      .then((res) => setData(res))
      .catch(() =>
        setError(t("Failed to load businesses", "فشل في تحميل الأنشطة التجارية"))
      )
      .finally(() => setLoading(false));
  }, [lang]);

  return (
    <div
      className={`space-y-6 transition-all duration-300 ${
        lang === "ar" ? "text-right" : "text-left"
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
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
                <tr
                  className={`border-b bg-gray-50 text-gray-700 ${
                    lang === "ar" ? "text-right" : "text-left"
                  }`}
                >
                  <th className="p-3 font-medium">{t("Name", "الاسم")}</th>
                  <th className="p-3 font-medium">{t("Status", "الحالة")}</th>
                  <th className="p-3 font-medium">{t("Clicks", "عدد النقرات")}</th>
                </tr>
              </thead>

              <tbody>
                {data.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="p-3">{b.name || t("Unnamed", "بدون اسم")}</td>
                    <td
                      className={`p-3 capitalize font-medium ${
                        b.status === "active"
                          ? "text-green-600"
                          : b.status === "trial"
                          ? "text-yellow-600"
                          : "text-gray-500"
                      }`}
                    >
                      {t(
                        b.status === "active"
                          ? "Active"
                          : b.status === "trial"
                          ? "Trial"
                          : "Inactive",
                        b.status === "active"
                          ? "نشط"
                          : b.status === "trial"
                          ? "تجريبي"
                          : "غير نشط"
                      )}
                    </td>
                   <td className="p-3">{Array.isArray(b.clicks) ? b.clicks.length : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
