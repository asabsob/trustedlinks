import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import supabase from "../db/postgres.js";

import { listAllUsers } from "../services/pg/users.js";

import {
  listAllBusinesses,
} from "../services/pg/businesses.js";

import {
  createNotification,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from "../services/notifications.js";

const router = express.Router();

async function updateBusinessStatus(id, status) {
  const { data, error } = await supabase
    .from("businesses")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("Invalid JWT_SECRET");
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Missing admin credentials");
}

function signAdminToken(email) {
  return jwt.sign(
    { email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function readBearer(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

function requireAdmin(req, res, next) {
  try {
    const token = readBearer(req);

    if (!token) {
      return res.status(401).json({
        error: "Missing admin token",
      });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    if (payload?.role !== "admin") {
      return res.status(403).json({
        error: "Not admin",
      });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid admin token",
    });
  }
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      String(email || "").trim().toLowerCase() !==
      String(ADMIN_EMAIL).trim().toLowerCase()
    ) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const passOk = ADMIN_PASSWORD.startsWith("$2")
      ? await bcrypt.compare(String(password), ADMIN_PASSWORD)
      : String(password) === String(ADMIN_PASSWORD);

    if (!passOk) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = signAdminToken(email);

    return res.json({
      ok: true,
      token,
    });

  } catch (e) {
    console.error("admin login error:", e);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.get("/me", requireAdmin, async (req, res) => {
  return res.json({
    ok: true,
    email: req.admin.email,
    role: "admin",
  });
});

router.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const [
      users,
      businesses,
      { data: transactions },
    ] = await Promise.all([
      listAllUsers(),
      listAllBusinesses(),
      supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const tx = transactions || [];
    const totalClicks = tx.length;

    const activityMap = new Map();

    tx.forEach((t) => {
      const date = String(t.created_at || "").slice(0, 10);
      if (!date) return;

      const current = activityMap.get(date) || {
        date,
        clicks: 0,
        users: 0,
        businesses: 0,
      };

      current.clicks += 1;
      activityMap.set(date, current);
    });

    const activity = [...activityMap.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    const categoryMap = new Map();

    (businesses || []).forEach((b) => {
      const cat = b.category || "Other";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    const categories = [...categoryMap.entries()].map(([name, value]) => ({
      name,
      value,
    }));

    return res.json({
      ok: true,
      totalUsers: users.length,
      totalBusinesses: businesses.length,
      totalClicks,
      activity,
      categories,
    });
  } catch (e) {
    console.error("admin stats error:", e);
    return res.status(500).json({ error: "Failed to load admin stats" });
  }
});

router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await listAllUsers();
    return res.json({ ok: true, users });
  } catch (e) {
    console.error("admin users error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

router.get("/businesses", requireAdmin, async (_req, res) => {
  try {
    const businesses = await listAllBusinesses();

    const { data: events } = await supabase
      .from("anti_fraud_events")
      .select("business_id, risk_score, action_taken")
      .not("business_id", "is", null);

    const fraudMap = new Map();

    for (const e of events || []) {
      const businessId = String(e.business_id || "").trim();
      if (!businessId) continue;

      const current = fraudMap.get(businessId) || {
        suspicious_events: 0,
        blocked_events: 0,
        average_risk_score: 0,
        total_risk_score: 0,
      };

      current.suspicious_events += 1;
      current.total_risk_score += Number(e.risk_score || 0);

      if (String(e.action_taken || "") === "block") {
        current.blocked_events += 1;
      }

      fraudMap.set(businessId, current);
    }

    const results = (businesses || []).map((b) => {
      const fraud = fraudMap.get(String(b.id)) || {
        suspicious_events: 0,
        blocked_events: 0,
        total_risk_score: 0,
      };

      const average_risk_score =
        fraud.suspicious_events > 0
          ? Math.round((fraud.total_risk_score / fraud.suspicious_events) * 10) / 10
          : 0;

      return {
        ...b,
        wallet_balance:
          Number(b?.wallet?.balance ?? b?.wallet_balance ?? b?.walletBalance ?? 0) || 0,
        suspicious_events: fraud.suspicious_events,
        blocked_events: fraud.blocked_events,
        average_risk_score,
      };
    });

    return res.json({
      ok: true,
      results,
    });
  } catch (e) {
    console.error("admin businesses error:", e);
    return res.status(500).json({ error: "Failed to load businesses" });
  }
});

router.post("/businesses/:id/activate", requireAdmin, async (req, res) => {
  try {
    const business = await updateBusinessStatus(req.params.id, "Active");

    if (!business) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ ok: true, business });
  } catch (e) {
    console.error("activate business error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

router.post("/businesses/:id/suspend", requireAdmin, async (req, res) => {
  try {
    const business = await updateBusinessStatus(req.params.id, "Suspended");

    if (!business) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ ok: true, business });
  } catch (e) {
    console.error("suspend business error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

router.get("/notifications", requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status || "").trim();
    const limit = Number(req.query.limit || 50);

    const notifications = await listNotifications({
      audienceType: "admin",
      audienceId: null,
      status,
      limit,
    });

    const unreadCount = await getUnreadNotificationCount({
      audienceType: "admin",
      audienceId: null,
    });

    return res.json({
      ok: true,
      notifications,
      unreadCount,
    });
  } catch (e) {
    console.error("admin notifications list error:", e);
    return res.status(500).json({
      error: "Failed to load notifications",
    });
  }
});

router.post("/notifications", requireAdmin, async (req, res) => {
  try {
    const {
      title = "Admin",
      message,
      type = "system",
      priority = "normal",
      actionLabel = null,
      actionUrl = null,
      channel = "dashboard",
    } = req.body || {};

    const notification = await createNotification({
      audienceType: "admin",
      audienceId: null,
      title,
      message,
      type,
      priority,
      actionLabel,
      actionUrl,
      channel,
      meta: {
        createdBy: req.admin?.email || "admin",
      },
    });

    return res.json({
      ok: true,
      notification,
    });
  } catch (e) {
    console.error("admin notification create error:", e);
    return res.status(500).json({
      error: e.message || "Failed to send notification",
    });
  }
});

router.post("/notifications/:id/read", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    if (!id) {
      return res.status(400).json({
        error: "Notification id required",
      });
    }

    const notification = await markNotificationRead(id);

    return res.json({
      ok: true,
      notification,
    });
  } catch (e) {
    console.error("admin notification read error:", e);
    return res.status(500).json({
      error: "Failed to mark notification as read",
    });
  }
});

router.post("/notifications/read-all", requireAdmin, async (_req, res) => {
  try {
    await markAllNotificationsRead({
      audienceType: "admin",
      audienceId: null,
    });

    return res.json({
      ok: true,
    });
  } catch (e) {
    console.error("admin notifications read-all error:", e);
    return res.status(500).json({
      error: "Failed to mark all as read",
    });
  }
});

router.get("/notifications/unread-count", requireAdmin, async (_req, res) => {
  try {
    const unreadCount = await getUnreadNotificationCount({
      audienceType: "admin",
      audienceId: null,
    });

    return res.json({
      ok: true,
      unreadCount,
    });
  } catch (e) {
    console.error("admin notifications unread count error:", e);
    return res.status(500).json({
      error: "Failed to load unread count",
    });
  }
});

router.get("/campaign-owners", requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaign_owners")
      .select(`
        id,
        name,
        entity_type,
        email,
        phone,
        username,
        country,
        city,
        status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      ok: true,
      owners: data || [],
    });

  } catch (e) {
    console.error("admin campaign owners error:", e);

    return res.status(500).json({
      error: "Failed to load campaign owners",
    });
  }
});

export { requireAdmin };
export default router;
