import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function AdminCampaignOwners() {
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    loadOwners();
  }, []);

  async function loadOwners() {
    try {
      setLoading(true);
      setError("");

     const token =
  localStorage.getItem("admintoken") ||
  localStorage.getItem("admin_token") ||
  localStorage.getItem("adminToken");

      const res = await fetch(`${API_BASE}/api/admin/campaign-owners`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load campaign owners");
      }

      setOwners(data.owners || data.campaignOwners || []);
    } catch (err) {
      setError(err.message || "Failed to load campaign owners");
    } finally {
      setLoading(false);
    }
  }

  const filteredOwners = useMemo(() => {
    const query = q.trim().toLowerCase();

    if (!query) return owners;

    return owners.filter((owner) => {
      return [
        owner.name,
        owner.email,
        owner.phone,
        owner.username,
        owner.country,
        owner.city,
        owner.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [owners, q]);

  function statusStyle(status) {
    const s = String(status || "").toLowerCase();

    if (s === "active" || s === "approved") {
      return "bg-green-50 text-green-700 border-green-200";
    }

    if (s === "pending") {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }

    if (s === "suspended" || s === "rejected") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-slate-50 text-slate-700 border-slate-200";
  }

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-br from-slate-900 to-green-600 text-white rounded-3xl p-6 md:p-8 shadow-lg">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-4">
          Admin Management
        </div>

        <h1 className="text-2xl md:text-4xl font-extrabold">
          Campaign Owners
        </h1>

        <p className="mt-3 text-white/85 max-w-2xl leading-7">
          Manage sponsor accounts, review their status, and monitor all campaign
          owner records from one place.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Owners" value={owners.length} />
        <StatCard
          title="Active"
          value={owners.filter((o) => ["active", "approved"].includes(o.status)).length}
          color="text-green-600"
        />
        <StatCard
          title="Pending"
          value={owners.filter((o) => o.status === "pending").length}
          color="text-yellow-600"
        />
        <StatCard
          title="Suspended / Rejected"
          value={owners.filter((o) => ["suspended", "rejected"].includes(o.status)).length}
          color="text-red-600"
        />
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Sponsor Accounts
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Search and review campaign owner accounts.
            </p>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone, city..."
            className="w-full md:w-[360px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-14 text-slate-500">
            Loading campaign owners...
          </div>
        ) : filteredOwners.length === 0 ? (
          <div className="text-center py-14 text-slate-500">
            No campaign owners found.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm">
                    <th className="text-left p-4">Name</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Phone</th>
                    <th className="text-left p-4">Location</th>
                    <th className="text-left p-4">Entity</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOwners.map((owner) => (
                    <tr key={owner.id} className="border-t border-slate-100">
                      <td className="p-4 font-semibold text-slate-900">
                        {owner.name || "-"}
                      </td>
                      <td className="p-4 text-slate-600">{owner.email || "-"}</td>
                      <td className="p-4 text-slate-600">{owner.phone || "-"}</td>
                      <td className="p-4 text-slate-600">
                        {[owner.city, owner.country].filter(Boolean).join(", ") ||
                          "-"}
                      </td>
                      <td className="p-4 text-slate-600">
                        {owner.entity_type || "-"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(
                            owner.status
                          )}`}
                        >
                          {owner.status || "unknown"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {owner.created_at
                          ? new Date(owner.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden grid gap-3">
              {filteredOwners.map((owner) => (
                <div
                  key={owner.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">
                        {owner.name || "-"}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {owner.email || "-"}
                      </div>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusStyle(
                        owner.status
                      )}`}
                    >
                      {owner.status || "unknown"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <MobileRow label="Phone" value={owner.phone || "-"} />
                    <MobileRow
                      label="Location"
                      value={
                        [owner.city, owner.country].filter(Boolean).join(", ") ||
                        "-"
                      }
                    />
                    <MobileRow
                      label="Entity"
                      value={owner.entity_type || "-"}
                    />
                    <MobileRow
                      label="Created"
                      value={
                        owner.created_at
                          ? new Date(owner.created_at).toLocaleDateString()
                          : "-"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, color = "text-slate-900" }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className={`mt-2 text-3xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

function MobileRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-right break-all">
        {value}
      </span>
    </div>
  );
}
