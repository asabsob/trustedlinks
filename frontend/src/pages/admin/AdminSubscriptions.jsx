import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { useLang } from "../../context/LangContext.jsx";

export default function AdminSubscriptions() {
  const { lang } = useLang();
  const t = (en, ar) => (lang === "ar" ? ar : en);

  const [plans, setPlans] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.listPlans(), api.listSubs()])
      .then(([plansRes, subsRes]) => {
        setPlans(plansRes);
        setSubs(subsRes);
      })
      .catch(() =>
        setError(t("Failed to load subscriptions", "فشل في تحميل الاشتراكات"))
      )
      .finally(() => setLoading(false));
  }, [lang]);

  return (
    <div className={`space-y-6 ${lang === "ar" ? "text-right" : "text-left"}`}>
      <h2 className="text-xl md:text-2xl font-semibold">
        {t("Subscriptions", "الاشتراكات")}
      </h2>

      {/* PLANS */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {plans.length === 0 && !loading ? (
          <p className="text-gray-500 text-sm col-span-3">
            {t("No plans found", "لا توجد خطط اشتراك")}
          </p>
        ) : (
          plans.map((p) => (
            <div
              key={p.id}
              className="border border-gray-200 rounded-2xl bg-white p-4 text-center shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold text-green-600">{p.name}</h3>
              <div className="text-2xl font-bold mt-2">${p.price}</div>
              <div className="text-sm text-gray-500">
                {t("per", "كل")} {t(p.period, p.period === "mo" ? "شهر" : p.period)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SUBSCRIPTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        {loading ? (
          <p className="text-gray-500 text-sm">
            {t("Loading subscriptions...", "جارٍ تحميل الاشتراكات...")}
          </p>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : subs.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {t("No active subscriptions found", "لا توجد اشتراكات حالية")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr
                  className={`border-b text-gray-600 ${
                    lang === "ar" ? "text-right" : "text-left"
                  }`}
                >
                  <th className="p-3 font-medium">
                    {t("Business", "النشاط التجاري")}
                  </th>
                  <th className="p-3 font-medium">{t("Plan", "الخطة")}</th>
                  <th className="p-3 font-medium">{t("Renews", "تجديد الاشتراك")}</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="p-3">{s.business}</td>
                    <td className="p-3">{s.plan}</td>
                    <td className="p-3 text-gray-700">{s.renews}</td>
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