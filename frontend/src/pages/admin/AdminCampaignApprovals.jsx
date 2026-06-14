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
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      loadCampaigns();
    } else {
      setLoading(false);
      setError("Admin token not found. Please login again.");
    }
  }, [token]);

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const cleanToken = String(token || "").replace(/^Bearer\s+/i, "");

      const res = await fetch(`${API_BASE}/api/admin/campaigns/pending`, {
        cache: "no-store",
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
              </tr>
            </thead>

            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b">
                  <td className="p-3">{campaign.name}</td>
                  <td className="p-3">
                    {campaign.total_budget} {campaign.currency}
                  </td>
                  <td className="p-3">{campaign.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
