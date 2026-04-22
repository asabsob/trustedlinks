import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useLang } from "../../context/LangContext.jsx";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function AdminBusinesses() {
  const { lang } = useLang();
  const { token } = useAdminAuth();
  const isAr = lang === "ar";

  const t = (en, ar) => (isAr ? ar : en);

  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    filterData();
  }, [search, data]);

  async function load() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      const list = json.results || [];

      setData(list);
      setFiltered(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function filterData() {
    const q = search.toLowerCase();

    setFiltered(
      data.filter((b) =>
        (b.name || "").toLowerCase().includes(q)
      )
    );
  }

  async function action(id, type) {
    await fetch(`${API_BASE}/api/admin/businesses/${id}/${type}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  }

  if (loading) return <div className="p-6">Loading...</div>;

  const total = data.length;
  const active = data.filter((b) => b.status === "Active").length;
  const highRisk = data.filter((b) => (b.suspicious_events || 0) > 10).length;

  return (
    <div className="space-y-6 p-6" dir={isAr ? "rtl" : "ltr"}>
      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-400 p-6 text-white rounded-2xl">
        <h1 className="text-2xl font-bold">
          {t("Businesses Management", "إدارة الأنشطة")}
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card icon={Building2} val={total} label="Total" />
        <Card icon={TrendingUp} val={active} label="Active" />
        <Card icon={ShieldAlert} val={highRisk} label="High Risk" />
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow flex items-center gap-3">
        <Search />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search business...", "ابحث عن نشاط...")}
          className="w-full outline-none"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Clicks</th>
              <th>Wallet</th>
              <th>Risk</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((b) => {
              const id = b.id;
              const risk = b.suspicious_events || 0;

              return (
                <tr key={id} className="border-t">
                  <td className="p-3">{b.name}</td>

                  <td className="p-3">
                    <span
                      className={`${
                        b.status === "Active"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td>{b.totalClicks || 0}</td>

                  <td className="p-3 flex items-center gap-1">
                    <Wallet size={14} />
                    {(b.wallet_balance || 0).toFixed(2)}
                  </td>

                  <td>
                    <span
                      className={`${
                        risk > 10
                          ? "text-red-600"
                          : risk > 0
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {risk > 10
                        ? "High"
                        : risk > 0
                        ? "Watch"
                        : "Safe"}
                    </span>
                  </td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => action(id, "activate")}
                      className="bg-green-100 text-green-700 px-2 py-1 rounded"
                    >
                      Activate
                    </button>

                    <button
                      onClick={() => action(id, "suspend")}
                      className="bg-red-100 text-red-700 px-2 py-1 rounded"
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ icon: Icon, val, label }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
      <div>
        <div className="text-gray-500 text-sm">{label}</div>
        <div className="text-xl font-bold">{val}</div>
      </div>
      <Icon />
    </div>
  );
}
