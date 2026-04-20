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

  const t = (en, ar) => (isAr ? ar : en);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [data, setData] = useState({
    overview: {},
    events: [],
    pendingCharges: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
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

        const overview = await overviewRes.json();
        const events = await eventsRes.json();
        const pending = await pendingRes.json();

        if (!cancelled) {
          setData({
            overview: overview || {},
            events: events.events || [],
            pendingCharges: pending.pendingCharges || [],
          });
        }
      } catch (e) {
        if (!cancelled) setErr("Failed to load fraud data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) load();
    return () => (cancelled = true);
  }, [token]);

  async function handleAction(id, action) {
    try {
      await fetch(
        `${API_BASE}/api/admin/fraud/pending-charges/${id}/${action}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setData((prev) => ({
        ...prev,
        pendingCharges: prev.pendingCharges.filter((p) => p.id !== id),
      }));
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (err) return <div className="p-6 text-red-500">{err}</div>;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-green-500 text-white p-6 rounded-xl">
        <h1 className="text-xl font-bold">
          {t("Fraud Center", "مركز الاحتيال")}
        </h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={AlertTriangle} label="Suspicious" value={data.overview.suspiciousToday} />
        <Stat icon={Ban} label="Blocked" value={data.overview.blockedToday} />
        <Stat icon={Clock3} label="Held" value={data.overview.heldToday} />
        <Stat icon={ShieldAlert} label="Pending" value={data.overview.pendingCharges} />
      </div>

      {/* EVENTS */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 font-semibold">Latest Events</div>
        <table className="w-full text-sm">
          <tbody>
            {data.events.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.business_id}</td>
                <td className="p-3">{e.risk_level}</td>
                <td className="p-3">{e.action_taken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PENDING CHARGES */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 font-semibold">Pending Charges</div>

        {data.pendingCharges.length === 0 ? (
          <div className="p-4 text-gray-400">No pending</div>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {data.pendingCharges.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.business_id}</td>
                  <td className="p-3">{p.amount}</td>
                  <td className="p-3">{p.risk_score}</td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleAction(p.id, "approve")}
                      className="bg-green-100 px-2 py-1 rounded"
                    >
                      <CheckCircle2 size={14} />
                    </button>

                    <button
                      onClick={() => handleAction(p.id, "cancel")}
                      className="bg-red-100 px-2 py-1 rounded"
                    >
                      <XCircle size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white p-4 rounded-xl border">
      <div className="flex justify-between">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <div className="text-xl font-bold">{value || 0}</div>
    </div>
  );
}
