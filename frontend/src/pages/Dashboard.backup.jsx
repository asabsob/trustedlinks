import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [business, setBusiness] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    if (!token) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    // ✅ Fetch Business Info
    fetch("http://localhost:5175/api/me", {
     headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},

    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setBusiness(data))
      .catch((err) => {
        console.error("❌ Failed to fetch business info:", err);
        setError("Failed to load business information.");
      });

    // ✅ Fetch Reports
    fetch("http://localhost:5175/api/reports", {
     headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},

    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setReports(data))
      .catch((err) => {
        console.error("❌ Failed to fetch reports:", err);
        setError("Failed to load reports.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;

  if (error)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3>⚠️ {error}</h3>
        <p>Please try again later or check your login session.</p>
      </div>
    );

  return (
    <div className="section container">
      <div
        style={{
          background: "linear-gradient(135deg,#22c55e,#34d399)",
          color: "#fff",
          padding: "32px",
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <h2>Business Dashboard</h2>
        <p>Monitor your activity and insights</p>
      </div>

      {/* ✅ Business Info */}
      <div className="card">
        <h3>Business Details</h3>
        {business ? (
          <div
            className="grid"
            style={{ gridTemplateColumns: "1fr 1fr", gap: "10px" }}
          >
            <div>
              <div className="label">Name</div>
              <div>{business.name || "N/A"}</div>
            </div>
            <div>
              <div className="label">Category</div>
              <div>{business.category || "N/A"}</div>
            </div>
            <div>
              <div className="label">Description</div>
              <div>{business.description || "N/A"}</div>
            </div>
            <div>
              <div className="label">WhatsApp</div>
              <div>{business.whatsapp || "N/A"}</div>
            </div>
            <div>
              <div className="label">Address</div>
              <div>{business.address || "N/A"}</div>
            </div>
          </div>
        ) : (
          <p>No business linked yet.</p>
        )}
      </div>

      {/* ✅ Reports Summary */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Performance Summary</h3>
        {reports ? (
          <div
            className="grid"
            style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}
          >
            <div>
              <h4>Total Clicks</h4>
              <p>{reports.totalClicks ?? 0}</p>
            </div>
            <div>
              <h4>Total Messages</h4>
              <p>{reports.totalMessages ?? 0}</p>
            </div>
            <div>
              <h4>Weekly Growth</h4>
              <p>{reports.weeklyGrowth ?? 0}%</p>
            </div>
          </div>
        ) : (
          <p>No report data available.</p>
        )}
      </div>
    </div>
  );
}
