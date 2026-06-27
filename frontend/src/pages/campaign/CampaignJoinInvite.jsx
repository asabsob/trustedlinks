import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignJoinInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInvitation();
  }, []);

  async function loadInvitation() {
    try {
      if (!token) throw new Error("Invalid invitation link");

      const res = await fetch(
        `${API_BASE}/api/campaign/team/invitation/${token}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid invitation");
      }

      setInvitation(data.invitation);
    } catch (err) {
      setError(err.message || "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <CenterCard title="Loading invitation..." />;
  }

  if (error && !invitation) {
    return <CenterCard title="Invitation Error" message={error} />;
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={badgeStyle}>TrustedLinks Invitation</div>

        <h1 style={titleStyle}>You're invited!</h1>

        <p style={descStyle}>
          {invitation.organizationName} invited you to join their campaign team.
        </p>

        <div style={infoBox}>
          <Info label="Organization" value={invitation.organizationName} />
          <Info label="Role" value={invitation.role} />
          <Info label="Email" value={invitation.email} />
        </div>

        <button
          onClick={() => navigate(`/campaign/register?invite=${token}`)}
          style={primaryButton}
        >
          Create Account
        </button>

        <Link
          to={`/campaign/login?invite=${token}`}
          style={secondaryButton}
        >
          I already have an account
        </Link>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, color: "#111827", fontWeight: 800 }}>
        {value}
      </div>
    </div>
  );
}

function CenterCard({ title, message }) {
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2>{title}</h2>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#f8fafc,#eef7f1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  fontFamily: "Inter, Arial, sans-serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: 480,
  background: "#fff",
  borderRadius: 28,
  padding: 34,
  boxShadow: "0 18px 45px rgba(15,23,42,.08)",
  border: "1px solid rgba(15,23,42,.06)",
};

const badgeStyle = {
  display: "inline-flex",
  background: "#ecfdf5",
  color: "#16a34a",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 800,
  fontSize: 13,
  marginBottom: 16,
};

const titleStyle = {
  margin: 0,
  fontSize: 32,
  fontWeight: 900,
  color: "#111827",
};

const descStyle = {
  color: "#64748b",
  lineHeight: 1.7,
};

const infoBox = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  margin: "22px 0",
};

const primaryButton = {
  width: "100%",
  background: "linear-gradient(135deg,#16a34a,#22c55e)",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: 16,
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
  marginBottom: 12,
};

const secondaryButton = {
  display: "block",
  textAlign: "center",
  width: "100%",
  boxSizing: "border-box",
  background: "#f8fafc",
  color: "#111827",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 15,
  fontWeight: 800,
  fontSize: 15,
  textDecoration: "none",
};
