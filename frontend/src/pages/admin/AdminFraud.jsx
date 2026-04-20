import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  Ban,
  Clock3,
  AlertTriangle,
  Repeat,
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
      pendingTable: isAr ? "الطلبات المعلقة" : "Pending Charges Queue",
      risk: isAr ? "الخطورة" : "Risk",
      action: isAr ? "الإجراء" : "Action",
      reason: isAr ? "السبب" : "Reason",
      time: isAr ? "الوقت" : "Time",
      business: isAr ? "النشاط" : "Business",
      amount: isAr ? "المبلغ" : "Amount",
      approve: isAr ? "اعتماد" : "Approve",
      reject: isAr ? "رفض" : "Reject",
      approved: isAr ? "تم الاعتماد" : "Approved",
      rejected: isAr ? "تم الرفض" : "Rejected",
      approveFailed: isAr ? "فشل الاعتماد" : "Approve failed",
      rejectFailed: isAr ? "فشل الرفض" : "Reject failed",
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
      topTargetedBusinesses: [],
    },
    events: [],
    pendingCharges: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadFraud() {
      setLoading(true);
      setErr("");

      try {
        const [overviewRes, eventsRes, pendingRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/fraud/overview`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/admin/fraud/events?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/admin/fraud/pending-charges?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const overviewJson = await overviewRes.json().catch(() => ({}));
        const eventsJson = await eventsRes.json().catch(() => ({}));
        const pendingJson = await pendingRes.json().catch(() => ({}));

        if (!overviewRes.ok) {
          throw new Error(overviewJson?.error || `HTTP ${overviewRes.status}`);
        }

        if (!eventsRes.ok) {
          throw new Error(eventsJson?.error || `HTTP ${eventsRes.status}`);
        }

        if (!pendingRes.ok) {
          throw new Error(pendingJson?.error || `HTTP ${pendingRes.status}`);
        }

        if (!cancelled) {
          setData({
            overview: {
              suspiciousToday: overviewJson.suspiciousToday || 0,
              blockedToday: overviewJson.blockedToday || 0,
              heldToday: overviewJson.heldToday || 0,
              pendingCharges: overviewJson.pendingCharges || 0,
              duplicateNoChargeToday: overviewJson.duplicateNoChargeToday || 0,
              topTargetedBusinesses: Array.isArray(overviewJson.topTargetedBusinesses)
                ? overviewJson.topTargetedBusinesses
                : [],
            },
            events: Array.isArray(eventsJson.events) ? eventsJson.events : [],
            pendingCharges: Array.isArray(pendingJson.pendingCharges)
              ? pendingJson.pendingCharges
              : [],
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

  async function handlePendingAction(id, action) {
    if (!id || !token) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/fraud/pending-charges/${id}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(payload?.error || `HTTP ${res.status}`);
      }

      setData((prev) => ({
        ...prev,
        pendingCharges: prev.pendingCharges.filter((item) => item.id !== id),
        overview: {
          ...prev.overview,
          pendingCharges: Math.max(0, (prev.overview.pendingCharges || 0) - 1),
        },
      }));

      alert(action === "approve" ? t.approved : t.rejected);
    } catch (e) {
      console.error(`Pending charge ${action} error:`, e);
      alert(action === "approve" ? t.approveFailed : t.rejectFailed);
    }
  }

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
      value: Array.isArray(data.overview.topTargetedBusinesses)
        ? data.overview.topTargetedBusinesses.length
        : 0,
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{t.pendingTable}</h2>
        </div>

        {data.pendingCharges.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{t.noData}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-start">{t.business}</th>
                  <th className="px-4 py-3 text-start">{t.amount}</th>
                  <th className="px-4 py-3 text-start">{t.risk}</th>
                  <th className="px-4 py-3 text-start">{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingCharges.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-800">
                      {p.business_name || p.business_id || "-"}
                    </td>

                    <td className="px-4 py-3 font-semibold text-gray-700">
                      {p.amount} {p.currency || "USD"}
                    </td>

                    <td className="px-4 py-3 text-orange-600 font-medium">
                      {p.risk_score ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handlePendingAction(p.id, "approve")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition"
                        >
                          <CheckCircle2 size={14} />
                          {t.approve}
                        </button>

                        <button
                          onClick={() => handlePendingAction(p.id, "cancel")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition"
                        >
                          <XCircle size={14} />
                          {t.reject}
                        </button>
                      </div>
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
