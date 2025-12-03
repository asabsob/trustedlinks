// ============================================================================
// Trusted Links - Forgot Password Page
// Sends reset link to user email via backend API
// ============================================================================

import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5175/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ If this email exists, a reset link has been sent.");
      } else {
        setMessage(`❌ ${data.error || "Request failed."}`);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage("❌ Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold text-green-600 mb-4">
          Forgot Password
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email address and we’ll send you a password reset link.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 mb-4"
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-green-600 text-white rounded-lg py-2 font-medium transition ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
          }`}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && (
          <p className="text-sm mt-4 text-center text-gray-700">{message}</p>
        )}
      </form>
    </div>
  );
}
