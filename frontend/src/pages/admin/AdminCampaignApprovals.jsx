import { useEffect, useState } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

export default function AdminCampaignApprovals() {
  const { token } = useAdminAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) loadCampaigns();
  }, [token]);

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const cleanToken = String(token || "").replace(/^Bearer\s+/i, "");

      const res = await fetch(`${API_BASE}/api/admin/campaigns/pending`, {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to load pending campaigns");
      }

      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveCampaign(id) {
    const cleanToken = String(token || "").replace(/^Bearer\s+/i, "");

    const res = await fetch(`${API_BASE}/api/admin/campaigns/${id}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
    });

    if (res.ok) {
      loadCampaigns();
    }
  }

  async function rejectCampaign(id) {
    const reason = window.prompt("Reject reason?") || "";
    const cleanToken = String(token || "").replace(/^Bearer\s+/i, "");

    const res = await fetch(`${API_BASE}/api/admin/campaigns/${id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cleanToken}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (res.ok) {
      loadCampaigns();
    }
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <h1 className="text-2xl font-bold mb-6">
        Campaign Approvals
      </h1>

      {loading && (
        <div className="text-gray-500">
          Loading...
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
          {error}
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="text-gray-500">
          No pending campaigns.
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Campaign</th>
                <th className="text-left p-3">Budget</th>
                <th className="text-left p-3">Credit / Business</th>
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
                    {campaign.credit_per_business} {campaign.currency}
                  </td>

                  <td className="p-3">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Pending Approval
                    </span>
                  </td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => approveCampaign(campaign.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => rejectCampaign(campaign.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
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
