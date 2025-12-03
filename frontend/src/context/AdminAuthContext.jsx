import { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("admintoken") || "");

  useEffect(() => {
    // Auto fetch admin profile if token exists
    if (token) {
      fetch("http://localhost:5175/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) setAdmin(data);
        })
        .catch(() => setAdmin(null));
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch("http://localhost:5175/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // ✅ Save token and fetch admin info
    localStorage.setItem("admintoken", data.token);
    setToken(data.token);

    const me = await fetch("http://localhost:5175/api/admin/me", {
      headers: { Authorization: `Bearer ${data.token}` },
    }).then((r) => r.json());

    setAdmin(me);
  };

  const logout = () => {
    localStorage.removeItem("admintoken");
    setAdmin(null);
    setToken("");
  };

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout, token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
