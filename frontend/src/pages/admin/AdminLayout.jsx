import React, { useEffect, useMemo, useState } from "react";
import { ShieldAlert, Ban, Clock3, AlertTriangle, Repeat, Building2 } from "lucide-react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function AdminFraud() {
  const { lang } = useLang();
  const { token } = useAdminAuth();
  const isAr = lang === "ar";

  const t = useMemo(
    () => ({
      title: isAr ? "مركز الاحتيال" : "Fraud Center",
      subtitle: isAr
        ? "مراقبة الأنشطة المشبوهة والطلبات المعلقة والحظر"
        : "Monitor suspicious activity, held requests, and blocked traffic",
      loading: isAr ? "جاري تحميل بيانات الاحتيال..." : "Loading fraud data...",
      failed: isAr ? "فشل تحميل بيانات الاحتيال" : "Failed to load fraud data",
      noData: isAr ? "لا توجد بيانات بعد" : "No data yet",
      suspicious: isAr ? "أحداث مشبوهة اليوم" : "Suspicious Events Today",
      blocked: isAr ? "محظور اليوم" : "Blocked Today",
      held: isAr ? "معلّق اليوم" : "Held Today",
      pending: isAr ? "طلبات معلقة" : "Pending Charges",
      duplicate: isAr ? "مكرر بدون خصم" : "Duplicate No Charge",
      targeted: isAr ? "الأكثر استهدافًا" : "Top Targeted Businesses",
      events: isAr ? "أحدث أحداث الاحتيال" : "Latest Fraud Events",
      risk: isAr ? "الخطورة" : "Risk",
      action: isAr ? "الإجراء" : "Action",
      reason: isAr ? "السبب" : "Reason",
      time: isAr ? "الوقت" : "Time",
      business: isAr ? "النشاط" : "Business",
    }),
    [isAr]
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState({
    overview: {
      suspiciousToday: 0,
      blockedToday: 0,
      heldToday: 0,
      pendingCharges: 0,
      duplicateNoChargeToday: 0,
      topTargetedBusinesses: 0,
    },
    events: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadFraud() {
      setLoading(true);
      setErr("");

      try {
        const [overviewRes, eventsRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/fraud/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/admin/fraud/events?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const overviewJson = await overviewRes.json().catch(() => ({}));
        const eventsJson = await eventsRes.json().catch(() => ({}));

        if (!overviewRes.ok) {
          throw new Error(overviewJson?.error || `HTTP ${overviewRes.status}`);
        }

        if (!eventsRes.ok) {
          throw new Error(eventsJson?.error || `HTTP ${eventsRes.status}`);
        }

        if (!cancelled) {
          setData({
            overview: {
              suspiciousToday: overviewJson.suspiciousToday || 0,
              blockedToday: overviewJson.blockedToday || 0,
              heldToday: overviewJson.heldToday || 0,
              pendingCharges: overviewJson.pendingCharges || 0,
              duplicateNoChargeToday: overviewJson.duplicateNoChargeToday || 0,
              topTargetedBusinesses: overviewJson.topTargetedBusinesses || 0,
            },
            events: Array.isArray(eventsJson.events) ? eventsJson.events : [],
          });
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || t.failed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) loadFraud();
    else {
      setLoading(false);
      setErr(t.failed);
    }

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  if (loading) {
    return <div className="p-6 text-gray-500">{t.loading}</div>;
  }

  if (err) {
    return <div className="p-6 text-red-600 font-medium">⚠️ {err}</div>;
  }

  const cards = [
    {
      label: t.suspicious,
      value: data.overview.suspiciousToday,
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: t.blocked,
      value: data.overview.blockedToday,
      icon: Ban,
      color: "text-red-600 bg-red-50",
    },
    {
      label: t.held,
      value: data.overview.heldToday,
      icon: Clock3,
      color: "text-orange-600 bg-orange-50",
    },
    {
      label: t.pending,
      value: data.overview.pendingCharges,
      icon: ShieldAlert,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: t.duplicate,
      value: data.overview.duplicateNoChargeToday,
      icon: Repeat,
      color: "text-green-600 bg-green-50",
    },
    {
      label: t.targeted,
      value: data.overview.topTargetedBusinesses,
      icon: Building2,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-400 text-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-2 text-sm text-white/90">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{t.events}</h2>
        </div>

        {data.events.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-start">{t.time}</th>
                  <th className="px-4 py-3 text-start">{t.business}</th>
                  <th className="px-4 py-3 text-start">{t.risk}</th>
                  <th className="px-4 py-3 text-start">{t.action}</th>
                  <th className="px-4 py-3 text-start">{t.reason}</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((event) => (
                  <tr key={event.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-600">
                      {event.created_at || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {event.business_name || event.business_id || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                        {event.risk_level || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {event.action_taken || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {Array.isArray(event.reason_codes)
                        ? event.reason_codes.join(", ")
                        : "-"}
                    </td>
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
