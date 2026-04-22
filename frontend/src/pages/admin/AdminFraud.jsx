import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  Ban,
  Clock3,
  AlertTriangle,
  Repeat,
  Building2,
} from "lucide-react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE;

const COLORS = ["#16a34a", "#f59e0b", "#ef4444", "#3b82f6"];

export default function AdminFraud() {
  const { lang } = useLang();
  const { token } = useAdminAuth();
  const isAr = lang === "ar";

  const t = useMemo(
    () => ({
      title: isAr ? "مركز الاحتيال المتقدم" : "Advanced Fraud Center",
      loading: isAr ? "تحميل..." : "Loading...",
      failed: isAr ? "فشل التحميل" : "Failed",
      approve: isAr ? "اعتماد" : "Approve",
      cancel: isAr ? "إلغاء" : "Cancel",
    }),
    [isAr]
  );

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({});
  const [events, setEvents] = useState([]);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    loadAll();
  }, [token]);

  async function loadAll() {
    try {
      const [o, e, p] = await Promise.all([
        fetch(`${API_BASE}/api/admin/fraud/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/fraud/events?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/api/admin/fraud/pending-charges`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const overviewJson = await o.json();
      const eventsJson = await e.json();
      const pendingJson = await p.json();

      setOverview(overviewJson.data || {});
      setEvents(eventsJson.data || []);
      setPending(pendingJson.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    await fetch(`${API_BASE}/api/admin/fraud/pending-charges/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadAll();
  }

  async function handleCancel(id) {
    await fetch(`${API_BASE}/api/admin/fraud/pending-charges/${id}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadAll();
  }

  if (loading) return <div className="p-6">{t.loading}</div>;

  const riskChart = [
    { name: "Suspicious", value: overview.suspiciousToday || 0 },
    { name: "Blocked", value: overview.blockedToday || 0 },
    { name: "Held", value: overview.heldToday || 0 },
  ];

  const actionChart = [
    { name: "Duplicate", value: overview.duplicateNoChargeToday || 0 },
    { name: "Pending", value: overview.pendingCharges || 0 },
  ];

  return (
    <div className="space-y-6 p-6" dir={isAr ? "rtl" : "ltr"}>
      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-6 rounded-2xl text-white">
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card icon={AlertTriangle} val={overview.suspiciousToday} />
        <Card icon={Ban} val={overview.blockedToday} />
        <Card icon={Clock3} val={overview.heldToday} />
        <Card icon={ShieldAlert} val={overview.pendingCharges} />
        <Card icon={Repeat} val={overview.duplicateNoChargeToday} />
        <Card icon={Building2} val={overview.topTargetedBusinesses} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Risk Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskChart} dataKey="value" outerRadius={90}>
                {riskChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Actions Breakdown">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={actionChart}>
              <XAxis dataKey="name" />
              <Tooltip />
              <Bar dataKey="value" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* PENDING CHARGES */}
      <Section title="Pending Charges">
        {pending.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center border p-3 rounded-lg"
          >
            <div>
              <p className="font-semibold">
                {p.business_name || p.business_id}
              </p>
              <p className="text-sm text-gray-500">
                ${p.amount} | {p.intent_type}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(p.id)}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                {t.approve}
              </button>
              <button
                onClick={() => handleCancel(p.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ))}
      </Section>

      {/* EVENTS TABLE */}
      <Section title="Fraud Events">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th>Time</th>
              <th>Business</th>
              <th>Risk</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t">
                <td>{e.created_at}</td>
                <td>{e.business_name || e.business_id}</td>
                <td>{e.risk_level}</td>
                <td>{e.action_taken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

/* COMPONENTS */

function Card({ icon: Icon, val }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
      <div className="text-2xl font-bold">{val || 0}</div>
      <Icon />
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}
