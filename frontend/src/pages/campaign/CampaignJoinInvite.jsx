import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignJoinInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  const [invitation, setInvitation] = useState(null);
  const [form, setForm] = useState({
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  async function acceptInvite(e) {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const res = await fetch(`${API_BASE}/api/campaign/team/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email: invitation.email,
          username: form.username,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to accept invitation");
      }

      setSuccess("Account created successfully. Redirecting to login...");

      setTimeout(() => {
        navigate("/campaign/login");
      }, 1800);
    } catch (err) {
      setError(err.message || "Failed to accept invitation");
    } finally {
      setSubmitting(false);
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
      <form onSubmit={acceptInvite} style={cardStyle}>
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

        {error && <Alert color="#b91c1c" bg="#fef2f2" text={error} />}
        {success && <Alert color="#166534" bg="#ecfdf5" text={success} />}

        <input
          required
          placeholder="Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          style={inputStyle}
        />

        <input
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
          style={inputStyle}
        />

        <input
          required
          minLength={8}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          style={inputStyle}
        />

        <input
          required
          minLength={8}
          type="password"
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
          style={inputStyle}
        />

        <button disabled={submitting} style={buttonStyle(submitting)}>
          {submitting ? "Creating account..." : "Accept Invitation & Create Account"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18, color: "#64748b" }}>
          Already have an account?{" "}
          <Link
            to={`/campaign/login?invite=${token}`}
            style={{ color: "#16a34a", fontWeight: 800 }}
          >
            Sign in instead
          </Link>
        </div>
      </form>
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

function Alert({ text, color, bg }) {
  return (
    <div
      style={{
        color,
        background: bg,
        padding: 12,
        borderRadius: 14,
        marginBottom: 14,
        fontWeight: 700,
      }}
    >
      {text}
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

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #dbe2ea",
  fontSize: 15,
  marginBottom: 14,
};

const buttonStyle = (loading) => ({
  width: "100%",
  background: loading ? "#94d3a2" : "linear-gradient(135deg,#16a34a,#22c55e)",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: 16,
  fontWeight: 900,
  fontSize: 15,
  cursor: loading ? "not-allowed" : "pointer",
});
