import { createContext, useContext, useEffect, useState } from "react";

const AdminAuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("admintoken") || "");
  const [loading, setLoading] = useState(!!localStorage.getItem("admintoken"));

  // Auto fetch admin profile if token exists
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!token) {
        if (!alive) return;
        setAdmin(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.error) {
          // token invalid
          localStorage.removeItem("admintoken");
          if (!alive) return;
          setToken("");
          setAdmin(null);
        } else {
          if (!alive) return;
          setAdmin(data);
        }
      } catch {
        // network error
        if (!alive) return;
        setAdmin(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Login failed");

    localStorage.setItem("admintoken", data.token);
    setToken(data.token);

    // fetch /me
    const meRes = await fetch(`${API_BASE}/api/admin/me`, {
      headers: { Authorization: `Bearer ${data.token}` },
    });
    const me = await meRes.json().catch(() => ({}));
    if (!meRes.ok || me?.error) throw new Error(me?.error || "Failed to load admin");
    setAdmin(me);
  };

  const logout = () => {
    localStorage.removeItem("admintoken");
    setAdmin(null);
    setToken("");
    setLoading(false);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};
