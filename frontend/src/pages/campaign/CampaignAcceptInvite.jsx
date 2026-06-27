import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignAcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    acceptInvite();
  }, []);

  async function acceptInvite() {
    const token = params.get("token");

    if (!token) {
      setMessage("Invalid invitation.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/campaign/team/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invitation failed");
      }

      setMessage("Invitation accepted successfully.");

      setTimeout(() => {
        navigate("/campaign/login");
      }, 2500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          width: 420,
          padding: 40,
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,.08)",
          textAlign: "center",
        }}
      >
        <h2>Campaign Invitation</h2>

        {loading ? (
          <p>Accepting invitation...</p>
        ) : (
          <p>{message}</p>
        )}
      </div>
    </div>
  );
}
