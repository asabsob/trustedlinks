import { useEffect, useState } from "react";

export default function AdminCampaignApprovals() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    const token = localStorage.getItem("admin_token");

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/admin/campaigns/pending`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    setCampaigns(data.campaigns || []);
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <h1 className="text-2xl font-bold mb-6">
        Campaign Approvals
      </h1>

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
                <td className="p-3">{campaign.name}</td>
                <td className="p-3">
                  {campaign.total_budget} {campaign.currency}
                </td>
                <td className="p-3">
                  {campaign.status}
                </td>
                <td className="p-3 flex gap-2">
                  <button className="bg-green-600 text-white px-3 py-1 rounded">
                    Approve
                  </button>

                  <button className="bg-red-600 text-white px-3 py-1 rounded">
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
