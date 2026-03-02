import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AdminAuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("admintoken") || "");
  const [loading, setLoading] = useState(true);

  // Load admin profile when token changes
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      // No token → not logged in
      if (!token) {
        if (!cancelled) {
          setAdmin(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok || data?.error) {
          // Token invalid/expired
          localStorage.removeItem("admintoken");
          if (!cancelled) {
            setToken("");
            setAdmin(null);
          }
        } else {
          if (!cancelled) setAdmin(data);
        }
      } catch (e) {
        // Network / server error: treat as logged out
        localStorage.removeItem("admintoken");
        if (!cancelled) {
          setToken("");
          setAdmin(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);

    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      throw new Error(data?.error || "Login failed");
    }

    localStorage.setItem("admintoken", data.token);
    setToken(data.token);

    // We can optimistically set admin if backend returns it,
    // otherwise /me will fill it.
    setLoading(false);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("admintoken");
    setAdmin(null);
    setToken("");
    setLoading(false);
  };

  const value = useMemo(
    () => ({ admin, token, loading, login, logout }),
    [admin, token, loading]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return ctx;
}
