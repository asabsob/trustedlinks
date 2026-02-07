// frontend/src/utils/api.js
// 🌍 Centralized API helper (real backend + optional mock)
const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:5175";
export const MOCK_MODE = false; // ✅ Set to true for offline mock data

function authHeaders() {
  const token = localStorage.getItem("admintoken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  if (MOCK_MODE) {
    console.log("✅ MOCK MODE ACTIVE — returning mock data for", path);
    return mockRequest(path, options);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) throw new Error((await res.text()) || "Request failed");

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

/* -------------------------------------------------------------------------- */
/*                              API ENDPOINTS                                 */
/* -------------------------------------------------------------------------- */
export const api = {
  /* -------------------- ADMIN AUTH -------------------- */
  login: async (email, password) => {
    const res = await request("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.token) {
      localStorage.setItem("admintoken", res.token);
      console.log("✅ Admin token saved:", res.token);
    }

    return res;
  },

  me: () => request("/api/admin/me"),

  logout: async () => {
    localStorage.removeItem("admintoken");
    return { ok: true };
  },

  /* -------------------- ADMIN DASHBOARD -------------------- */
  stats: () => request("/api/admin/stats"),

  /* -------------------- ADMIN BUSINESSES -------------------- */
  listBusinesses: () => request("/api/admin/businesses"),

  /* -------------------- ADMIN SUBSCRIPTIONS -------------------- */
  listPlans: () => request("/api/admin/plans"),
  listSubs: () => request("/api/admin/subscriptions"),

  /* -------------------- ADMIN NOTIFICATIONS -------------------- */
  listNotifications: () => request("/api/admin/notifications"),
  sendNotification: (payload) =>
    request("/api/admin/notifications", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /* -------------------- ADMIN INSIGHTS -------------------- */
  insights: () => request("/api/admin/insights"),

  /* -------------------- ADMIN SETTINGS -------------------- */
  getSettings: () => request("/api/admin/settings"),
  saveSettings: (payload) =>
    request("/api/admin/settings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/* -------------------------------------------------------------------------- */
/*                              MOCK DATA MODE                                */
/* -------------------------------------------------------------------------- */
async function mockRequest(path) {
  await new Promise((r) => setTimeout(r, 300)); // simulate network delay
  const lang = localStorage.getItem("lang") || "en";
  const t = (en, ar) => (lang === "ar" ? ar : en);

  if (path === "/api/admin/login")
    return { token: "mock-token", user: { name: "Admin", email: "admin@trustedlinks.app" } };

  if (path === "/api/admin/me")
    return { id: 1, name: t("Admin", "المسؤول"), email: "admin@trustedlinks.app" };

  if (path === "/api/admin/stats")
    return {
      users: 1200,
      businesses: 597,
      clicks: 404223,
    };

  if (path === "/api/admin/businesses")
    return [
      { id: 1, name: "CoCo Bubble Tea", status: "active", clicks: 520 },
      { id: 2, name: "Wifaq EMD", status: "trial", clicks: 190 },
    ];

  if (path === "/api/admin/plans")
    return [
      { id: "p1", name: "Free", price: 0, period: "mo" },
      { id: "p2", name: "Pro", price: 15, period: "mo" },
      { id: "p3", name: "Enterprise", price: 49, period: "mo" },
    ];

  if (path === "/api/admin/subscriptions")
    return [
      { id: "1", business: "CoCo Bubble Tea", plan: "Pro", renews: "Monthly" },
      { id: "2", business: "Wifaq EMD", plan: "Free", renews: "—" },
    ];

  if (path === "/api/admin/notifications")
    return [
      { id: "n1", title: t("Welcome", "مرحباً"), message: t("Platform launched!", "تم إطلاق المنصة!"), date: "2025-10-28" },
    ];

  if (path === "/api/admin/insights")
    return { insight: t("AI Summary unavailable (mock)", "ملخص الذكاء الاصطناعي غير متاح (تجريبي)") };

  if (path === "/api/admin/settings")
    return { systemName: "Trusted Links", version: "1.0.0", openai: false, mailer: true };

  return { ok: true, message: t("Mock endpoint", "نقطة تجريبية") };
}