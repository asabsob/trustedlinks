import { useEffect, useState } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function AdminCampaignApprovals() {
  const { token: contextToken } = useAdminAuth();
  const token = contextToken || localStorage.getItem("admintoken");

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) loadCampaigns();
  }, [token]);

  const authHeaders = () => {
    const cleanToken = String(token || "").replace(/^Bearer\s+/i, "");
    return { Authorization: `Bearer ${cleanToken}` };
  };

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/admin/campaigns/pending`, {
        cache: "no-store",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load campaigns");

      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveCampaign(id) {
    if (!window.confirm("Approve this campaign?")) return;

    try {
      setActionLoading(id);

      const res = await fetch(`${API_BASE}/api/admin/campaigns/${id}/approve`, {
        method: "PATCH",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to approve campaign");

      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  async function rejectCampaign(id) {
    const reason = window.prompt("Reason for rejection?") || "";
    if (!window.confirm("Reject this campaign?")) return;

    try {
      setActionLoading(id);

      const res = await fetch(`${API_BASE}/api/admin/campaigns/${id}/reject`, {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to reject campaign");

      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Campaign Approvals</h1>

      {loading && <div className="text-gray-500">Loading...</div>}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
          {error}
        </div>
      )}

      {!loading && campaigns.length === 0 && !error && (
        <div className="text-gray-500">No pending campaigns.</div>
      )}

      {campaigns.length > 0 && (
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Campaign</th>
                <th className="text-left p-3">Budget</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b">
                  <td className="p-3 font-semibold">{campaign.name}</td>

                  <td className="p-3">
                    {campaign.total_budget} {campaign.currency}
                  </td>

                  <td className="p-3">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Pending Approval
                    </span>
                  </td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => approveCampaign(campaign.id)}
                      disabled={actionLoading === campaign.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => rejectCampaign(campaign.id)}
                      disabled={actionLoading === campaign.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
