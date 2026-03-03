// ============================================================================
// Trusted Links Backend API (MongoDB ONLY) + Resend Email + JAVNA WhatsApp OTP
// FULL server.js (Fixed routes for frontend + admin pages)
// ============================================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import geolib from "geolib";
import { nanoid } from "nanoid";

import { connectDB } from "./db.js";
import User from "./models/User.js";
import Business from "./models/Business.js";
import Otp from "./models/Otp.js";

dotenv.config();

// ---------------------------------------------------------------------------
// Mongo (required)
// ---------------------------------------------------------------------------
await connectDB();

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5175;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@trustedlinks.app";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
const JWT_SECRET = process.env.JWT_SECRET || "trustedlinks_secret";

function createToken(userId) {
  return jwt.sign({ id: userId, role: "user" }, JWT_SECRET, { expiresIn: "7d" });
}

// ---------------------------------------------------------------------------
// Email (Resend) - helper
// ---------------------------------------------------------------------------
async function sendEmail({ to, subject, html, text }) {
  const key = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.MAIL_FROM || "").trim();

  if (!key) throw new Error("Missing RESEND_API_KEY");
  if (!from) throw new Error("Missing MAIL_FROM");

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Resend failed (${r.status}): ${JSON.stringify(data)}`);
  return data;
}

// ---------------------------------------------------------------------------
// Public/Base URLs
// ---------------------------------------------------------------------------
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || "http://localhost:5173").trim();
const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL || FRONTEND_ORIGIN).trim();

const API_BASE_URL = (
  process.env.API_BASE_URL || "https://trustedlinks-backend-production.up.railway.app"
).trim();

// ---------------------------------------------------------------------------
// CORS + JSON
// ---------------------------------------------------------------------------
const allowedOrigins = new Set([
  FRONTEND_ORIGIN,
  "https://trustedlinks.net",
  "https://www.trustedlinks.net",
  "http://localhost:5173",
]);

function corsOrigin(origin, cb) {
  if (!origin) return cb(null, true);
  const ok =
    allowedOrigins.has(origin) ||
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

  return cb(ok ? null : new Error("CORS blocked"), ok);
}

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: false,
  })
);

app.use(express.json({ limit: "2mb" }));
app.options("*", cors({ origin: corsOrigin }));

// ---------------------------------------------------------------------------
// Auth middlewares
// ---------------------------------------------------------------------------
function requireUser(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.role !== "user") return res.status(403).json({ error: "Forbidden" });

    req.user = payload; // {id, role}
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.role !== "admin") return res.status(403).json({ error: "Forbidden" });

    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ============================================================================
// Debug
// ============================================================================
app.get("/api/debug/resend", (_req, res) => {
  res.json({
    hasKey: Boolean(process.env.RESEND_API_KEY),
    hasFrom: Boolean(process.env.MAIL_FROM),
    from: process.env.MAIL_FROM || null,
  });
});

app.get("/api/debug/send-test-email", async (req, res) => {
  try {
    const to = req.query.to;
    if (!to) return res.status(400).json({ ok: false, error: "Missing ?to=" });

    const result = await sendEmail({
      to,
      subject: "TrustedLinks test email ✅",
      text: "If you received this, Resend is working.",
      html: "<p>If you received this, <b>Resend</b> is working ✅</p>",
    });

    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/debug/mongo", async (_req, res) => {
  try {
    const users = await User.countDocuments();
    const businesses = await Business.countDocuments();
    res.json({ ok: true, users, businesses, hasMongoUri: Boolean(process.env.MONGODB_URI) });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// ============================================================================
// AUTH (Signup/Login) + Email Verification (Resend)  - MongoDB
// ============================================================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const emailNorm = String(email).toLowerCase().trim();

    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const verifyToken = nanoid(32);

    await User.create({
      email: emailNorm,
      passwordHash,
      emailVerified: false,
      verifyToken,
      subscriptionPlan: null,
      planActivatedAt: null,

      // Forgot password (optional fields)
      resetToken: null,
      resetExpiresAt: null,
    });

    const verifyUrl =
      `${API_BASE_URL}/api/auth/verify-email` +
      `?email=${encodeURIComponent(emailNorm)}` +
      `&token=${encodeURIComponent(verifyToken)}`;

    try {
      await sendEmail({
        to: emailNorm,
        subject: "Verify your email",
        text: `Verify your email using this link: ${verifyUrl}`,
        html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (err) {
      console.error("send verification email error:", err);
    }

    return res.json({ ok: true, message: "Signup ok. Check your email." });
  } catch (e) {
    console.error("signup error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailNorm = String(email || "").toLowerCase().trim();

    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED" });
    }

    const token = createToken(String(user._id));
    return res.json({
      ok: true,
      token,
      subscriptionPlan: user.subscriptionPlan,
      planActivatedAt: user.planActivatedAt,
    });
  } catch (e) {
    console.error("login error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/auth/verify-email", async (req, res) => {
  try {
    const { email, token } = req.query || {};
    if (!email || !token) return res.status(400).send("Missing email/token");

    const emailNorm = String(email).toLowerCase().trim();

    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(404).send("User not found");

    if (user.emailVerified) return res.send("Already verified ✅");
    if (String(user.verifyToken) !== String(token)) return res.status(401).send("Invalid token");

    user.emailVerified = true;
    user.verifyToken = null;
    await user.save();

    return res.redirect(`${FRONTEND_BASE_URL}/login?verified=1`);
  } catch (e) {
    console.error("verify-email error", e);
    return res.status(500).send("Verification failed");
  }
});

app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email required" });

    const emailNorm = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(404).json({ error: "Email not found" });

    if (user.emailVerified) return res.json({ ok: true, message: "Email already verified" });

    if (!user.verifyToken) user.verifyToken = nanoid(32);
    await user.save();

    const verifyUrl =
      `${API_BASE_URL}/api/auth/verify-email` +
      `?email=${encodeURIComponent(emailNorm)}` +
      `&token=${encodeURIComponent(user.verifyToken)}`;

    await sendEmail({
      to: emailNorm,
      subject: "Verify your email",
      text: `Verify your email using this link: ${verifyUrl}`,
      html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    return res.json({ ok: true, message: "Verification email sent" });
  } catch (e) {
    console.error("resend-verification error:", e);
    return res.status(500).json({ error: "Failed to send verification email" });
  }
});

// ✅ Forgot Password (needed by your ForgotPassword.jsx)
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    const emailNorm = String(email || "").toLowerCase().trim();

    // Always return ok to avoid leaking which emails exist
    const user = await User.findOne({ email: emailNorm });

    if (user) {
      user.resetToken = nanoid(48);
      user.resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const resetUrl =
        `${FRONTEND_BASE_URL}/reset-password` +
        `?email=${encodeURIComponent(emailNorm)}` +
        `&token=${encodeURIComponent(user.resetToken)}`;

      try {
        await sendEmail({
          to: emailNorm,
          subject: "Reset your password",
          text: `Reset your password using this link: ${resetUrl}`,
          html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });
      } catch (e) {
        console.error("send reset email error:", e);
      }
    }

    return res.json({ ok: true, message: "If this email exists, a reset link has been sent." });
  } catch (e) {
    console.error("forgot-password error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// (Optional) Reset password endpoint if you build ResetPassword page later
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const emailNorm = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(400).json({ error: "Invalid request" });

    if (!user.resetToken || String(user.resetToken) !== String(token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!user.resetExpiresAt || new Date(user.resetExpiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: "Token expired" });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.resetToken = null;
    user.resetExpiresAt = null;
    await user.save();

    return res.json({ ok: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ /api/me (needed — your frontend calls it)
app.get("/api/me", requireUser, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    ok: true,
    user: {
      id: String(user._id),
      email: user.email,
      emailVerified: !!user.emailVerified,
      subscriptionPlan: user.subscriptionPlan || null,
      planActivatedAt: user.planActivatedAt || null,
    },
  });
});

// ============================================================================
// JAVNA Config
// ============================================================================
const JAVNA_API_KEY = process.env.JAVNA_API_KEY || "";
const JAVNA_FROM = process.env.JAVNA_FROM || "";
const JAVNA_BASE_URL = "https://whatsapp.api.javna.com/whatsapp/v1.0";
const JAVNA_SEND_TEXT_URL = `${JAVNA_BASE_URL}/message/text`;
const JAVNA_SEND_AUTH_TEMPLATE_URL = `${JAVNA_BASE_URL}/message/template/authentication`;

async function javnaSendText({ to, body }) {
  if (!JAVNA_API_KEY) throw new Error("Missing JAVNA_API_KEY");
  if (!JAVNA_FROM) throw new Error("Missing JAVNA_FROM");

  const headers = { "Content-Type": "application/json", "X-API-Key": JAVNA_API_KEY };
  const from = JAVNA_FROM.startsWith("+") ? JAVNA_FROM : `+${JAVNA_FROM}`;
  const toNumber = to.startsWith("+") ? to : `+${to}`;

  const payload = { from, to: toNumber, content: { text: String(body || "") } };

  const r = await fetch(JAVNA_SEND_TEXT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`Javna send failed (${r.status}): ${txt}`);

  try {
    return JSON.parse(txt);
  } catch {
    return { ok: true, raw: txt };
  }
}

async function javnaSendOtpTemplate({ to, code, lang = "en" }) {
  if (!JAVNA_API_KEY) throw new Error("Missing JAVNA_API_KEY");
  if (!JAVNA_FROM) throw new Error("Missing JAVNA_FROM");

  const headers = { "Content-Type": "application/json", "X-API-Key": JAVNA_API_KEY };
  const from = JAVNA_FROM.startsWith("+") ? JAVNA_FROM : `+${JAVNA_FROM}`;
  const toNumber = to.startsWith("+") ? to : `+${to}`;

  const templateName = lang === "ar" ? "turstedlinks_otp_ar" : "trustedlinks_otp_en";
  const templateLanguage = lang === "ar" ? "ar" : "en";

  const payload = {
    from,
    to: toNumber,
    content: { templateName, templateLanguage, otp: String(code) },
  };

  const r = await fetch(JAVNA_SEND_AUTH_TEMPLATE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  if (!r.ok) throw new Error(`Javna auth template failed (${r.status}): ${txt}`);
  return JSON.parse(txt);
}

// ============================================================================
// WhatsApp OTP (Javna) - MongoDB
// ============================================================================

app.post("/api/whatsapp/request-otp", async (req, res) => {
  try {
    const { whatsapp } = req.body || {};
    if (!whatsapp) return res.status(400).json({ error: "WhatsApp number missing" });

    const clean = cleanDigits(whatsapp);
    if (!/^\d{10,15}$/.test(clean)) return res.status(400).json({ error: "Invalid WhatsApp number" });

    const already = await Business.findOne({ whatsapp: clean });
    if (already) return res.status(409).json({ error: "This WhatsApp number is already registered." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ whatsapp: clean, purpose: "business_signup" });
    await Otp.create({
      whatsapp: clean,
      code: otp,
      purpose: "business_signup",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (!JAVNA_API_KEY) {
      console.log("🧪 JAVNA disabled (missing key). OTP:", otp, "to:", clean);
      return res.json({ success: true, message: "OTP generated (mock).", devOtp: otp });
    }

    const javnaResp = await javnaSendOtpTemplate({ to: `+${clean}`, code: otp, lang: "en" });

    if (javnaResp?.stats?.rejected === "1") {
      return res.status(400).json({ success: false, error: "Javna rejected template", javna: javnaResp });
    }

    return res.json({ success: true, message: "OTP sent.", javna: javnaResp });
  } catch (e) {
    console.error("request-otp error", e);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/whatsapp/verify-otp", async (req, res) => {
  try {
    const { whatsapp, code } = req.body || {};
    if (!whatsapp || !code) {
      return res.status(400).json({ ok: false, error: "WhatsApp number and code are required" });
    }

    const clean = cleanDigits(whatsapp);
    if (!/^\d{10,15}$/.test(clean)) return res.status(400).json({ ok: false, error: "Invalid WhatsApp number" });

    const rec = await Otp.findOne({ whatsapp: clean, purpose: "business_signup" });
    if (!rec) {
      return res.status(404).json({ ok: false, error: "No OTP found. Request a new code.", reason: "NO_OTP" });
    }

    if (String(rec.code) !== String(code)) {
      return res.status(401).json({ ok: false, error: "Invalid OTP code.", reason: "BAD_CODE" });
    }

    if (rec.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ ok: false, error: "OTP expired. Request a new code.", reason: "EXPIRED" });
    }

    await Otp.deleteOne({ _id: rec._id });

    const token = jwt.sign(
      { whatsapp: clean, purpose: "business_signup", verified: true },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      ok: true,
      message: "OTP verified ✅",
      token,
      whatsapp: clean,
      whatsappLink: `https://wa.me/${clean}`,
    });
  } catch (e) {
    console.error("verify-otp error", e);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

// ============================================================================
// Business APIs (Public)
// ============================================================================

app.get("/api/businesses", async (_req, res) => {
  const list = await Business.find({ status: "Active" }).lean();
  res.json(list || []);
});

app.get("/api/business/:id", async (req, res) => {
  const b = await Business.findById(req.params.id).lean();
  if (!b) return res.status(404).json({ error: "Business not found" });
  res.json(b);
});

// Instagram profile helper endpoint (to avoid frontend crash)
// Return {profilePic:null} if not implemented.
app.get("/api/instagram-profile/:username", async (_req, res) => {
  return res.json({ profilePic: null });
});

// ============================================================================
// Business APIs (User / Owner)
// ============================================================================

async function getMyBusiness(userId) {
  return Business.findOne({ userId }).lean();
}

app.get("/api/business/me", requireUser, async (req, res) => {
  const b = await getMyBusiness(req.user.id);
  if (!b) return res.status(404).json({ error: "Business not found for this user" });
  res.json(b);
});

// If you need a create route later:
app.post("/api/business/create", requireUser, async (req, res) => {
  const body = req.body || {};
  const existing = await Business.findOne({ userId: req.user.id });
  if (existing) return res.status(409).json({ error: "Business already exists for this user" });

  const b = await Business.create({
    ...body,
    userId: req.user.id,
    status: body.status || "Active",
  });

  res.json(b);
});

app.put("/api/business/update", requireUser, async (req, res) => {
  const updates = req.body || {};

  delete updates._id;
  delete updates.userId;
  delete updates.clicks;
  delete updates.views;
  delete updates.messages;
  delete updates.mediaViews;

  const b = await Business.findOneAndUpdate(
    { userId: req.user.id },
    { $set: updates },
    { new: true }
  ).lean();

  if (!b) return res.status(404).json({ error: "Business not found" });
  res.json(b);
});

app.delete("/api/business/delete", requireUser, async (req, res) => {
  await Business.deleteOne({ userId: req.user.id });
  res.json({ ok: true });
});

app.put("/api/business/toggle-status", requireUser, async (req, res) => {
  const b = await Business.findOne({ userId: req.user.id });
  if (!b) return res.status(404).json({ error: "Business not found" });

  b.status = b.status === "Suspended" ? "Active" : "Suspended";
  await b.save();

  res.json({ ok: true, status: b.status });
});

// ============================================================================
// Tracking APIs (needed by BusinessDetails + Reports)
// ============================================================================

app.post("/api/track-view", async (req, res) => {
  const { businessId } = req.body || {};
  if (!businessId) return res.status(400).json({ error: "businessId required" });

  await Business.updateOne({ _id: businessId }, { $push: { views: { at: new Date() } } });
  res.json({ ok: true });
});

app.post("/api/track-click", async (req, res) => {
  const { businessId, kind = "whatsapp" } = req.body || {};
  if (!businessId) return res.status(400).json({ error: "businessId required" });

  await Business.updateOne(
    { _id: businessId },
    { $push: { clicks: { kind: String(kind), at: new Date() } } }
  );

  res.json({ ok: true });
});

app.post("/api/track-message", async (req, res) => {
  const { businessId } = req.body || {};
  if (!businessId) return res.status(400).json({ error: "businessId required" });

  await Business.updateOne({ _id: businessId }, { $push: { messages: { at: new Date() } } });
  res.json({ ok: true });
});

app.post("/api/track-media", async (req, res) => {
  const { businessId } = req.body || {};
  if (!businessId) return res.status(400).json({ error: "businessId required" });

  await Business.updateOne({ _id: businessId }, { $push: { mediaViews: { at: new Date() } } });
  res.json({ ok: true });
});

// ============================================================================
// Reports API (User)
// ============================================================================

app.get("/api/business/reports", requireUser, async (req, res) => {
  const b = await Business.findOne({ userId: req.user.id }).lean();
  if (!b) return res.status(404).json({ error: "Business not found" });

  const clicksArr = Array.isArray(b.clicks) ? b.clicks : [];
  const messagesArr = Array.isArray(b.messages) ? b.messages : [];
  const mediaArr = Array.isArray(b.mediaViews) ? b.mediaViews : [];
  const viewsArr = Array.isArray(b.views) ? b.views : [];

  const totalClicks = clicksArr.length;
  const totalMessages = messagesArr.length;

  // Sources pie
  const sourcesMap = {};
  for (const c of clicksArr) {
    const k = (c?.kind || "other").toLowerCase();
    sourcesMap[k] = (sourcesMap[k] || 0) + 1;
  }

  const sources = Object.entries(sourcesMap).map(([name, value]) => ({
    name,
    name_en: name,
    name_ar:
      name === "whatsapp" ? "واتساب" :
      name === "map" ? "الخريطة" :
      name === "media" ? "وسائط" :
      name === "details" ? "التفاصيل" : "أخرى",
    value,
  }));

  // Activity line (last 7 days)
  const days = 7;
  const mkKey = (d) => d.toISOString().slice(0, 10);
  const now = new Date();
  const buckets = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    buckets[mkKey(d)] = { date: mkKey(d), total: 0, whatsapp: 0, media: 0, messages: 0 };
  }

  for (const c of clicksArr) {
    const k = mkKey(new Date(c.at || Date.now()));
    if (!buckets[k]) continue;
    buckets[k].total += 1;

    const kind = (c.kind || "").toLowerCase();
    if (kind === "whatsapp") buckets[k].whatsapp += 1;
    if (kind === "media") buckets[k].media += 1;
  }

  for (const m of messagesArr) {
    const k = mkKey(new Date(m.at || Date.now()));
    if (!buckets[k]) continue;
    buckets[k].messages += 1;
  }

  const activity = Object.values(buckets);

  res.json({
    business: b.name || "Business",
    category: b.category?.name || b.category || "Category",
    totalClicks,
    totalMessages,
    mediaViews: mediaArr.length,
    views: viewsArr.length,
    weeklyGrowth: 0,
    sources,
    activity,
  });
});

// ============================================================================
// Public Search API (MongoDB) - existing style kept
// ============================================================================
app.get("/api/search", async (req, res) => {
  try {
    const { query = "", category = "all", lat, lng } = req.query;

    let results = await Business.find({ status: "Active" }).lean();

    if (query) {
      const q = String(query).toLowerCase();
      results = results.filter((b) => {
        const name = (b.name || "").toLowerCase();
        const nameAr = (b.name_ar || b.nameAr || "").toLowerCase();
        const desc = (b.description || "").toLowerCase();
        const cat = Array.isArray(b.category)
          ? b.category.some((c) => String(c).toLowerCase().includes(q))
          : String(b.category || "").toLowerCase().includes(q);

        return name.includes(q) || nameAr.includes(q) || desc.includes(q) || cat;
      });
    }

    if (category && category !== "all") {
      const c = String(category).toLowerCase();
      results = results.filter((b) =>
        Array.isArray(b.category)
          ? b.category.some((x) => String(x).toLowerCase().includes(c))
          : String(b.category || "").toLowerCase().includes(c)
      );
    }

    if (lat && lng) {
      const userLocation = { latitude: parseFloat(lat), longitude: parseFloat(lng) };

      results = results
        .map((b) => {
          if (b.latitude && b.longitude) {
            const distance = geolib.getDistance(userLocation, {
              latitude: parseFloat(b.latitude),
              longitude: parseFloat(b.longitude),
            });
            return { ...b, distance };
          }
          return { ...b, distance: null };
        })
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return res.json(results);
  } catch (e) {
    console.error("/api/search error", e);
    return res.status(500).json({ error: "Failed to search" });
  }
});

// ============================================================================
// Admin login + Admin APIs (needed by Admin pages)
// ============================================================================
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (email !== ADMIN_EMAIL) return res.status(401).json({ error: "Invalid credentials" });

    const ok = ADMIN_PASSWORD.startsWith("$2")
      ? await bcrypt.compare(String(password), ADMIN_PASSWORD)
      : String(password) === String(ADMIN_PASSWORD);

    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Admin "stats" for AdminDashboard.jsx
app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  const users = await User.countDocuments();
  const businesses = await Business.countDocuments();

  // total clicks across businesses
  const all = await Business.find({}, { clicks: 1, category: 1 }).lean();
  let clicks = 0;

  const catMap = {};
  for (const b of all) {
    const c = b.category?.name || b.category?.key || b.category || "Other";
    catMap[c] = (catMap[c] || 0) + 1;

    clicks += Array.isArray(b.clicks) ? b.clicks.length : 0;
  }

  const categories = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // activity placeholder
  const activity = [];

  res.json({ users, businesses, clicks, categories, activity });
});

// Admin AI summary (used by AdminAISummary.jsx)
app.post("/api/admin/ai-summary", requireAdmin, async (_req, res) => {
  // Placeholder summary (later we connect to OpenAI)
  const users = await User.countDocuments();
  const businesses = await Business.countDocuments();
  res.json({
    summary:
      `Platform Summary:\n` +
      `- Total users: ${users}\n` +
      `- Total businesses: ${businesses}\n` +
      `- Next: connect real insights + trends.\n`,
  });
});

// Admin insights endpoint (for AdminInsights.jsx via api.insights())
app.get("/api/admin/insights", requireAdmin, async (_req, res) => {
  res.json({
    insight:
      "No AI insights yet. Once tracking grows, we will generate weekly recommendations automatically.",
  });
});

// Admin list businesses (for AdminBusinesses.jsx via api.listBusinesses())
app.get("/api/admin/businesses", requireAdmin, async (_req, res) => {
  const list = await Business.find({}, { name: 1, status: 1, clicks: 1 }).lean();
  res.json(
    (list || []).map((b) => ({
      id: String(b._id),
      name: b.name || "",
      status: (b.status || "inactive").toLowerCase(), // active/trial/inactive (frontend expects)
      clicks: Array.isArray(b.clicks) ? b.clicks : [],
    }))
  );
});

// Admin subscriptions (simple mock to avoid 404 until you build real billing)
app.get("/api/admin/plans", requireAdmin, async (_req, res) => {
  res.json([
    { id: "plan_trial", name: "Trial", price: 0, period: "mo" },
    { id: "plan_basic", name: "Basic", price: 15, period: "mo" },
  ]);
});

app.get("/api/admin/subscriptions", requireAdmin, async (_req, res) => {
  // Later: compute from User.subscriptionPlan / Business fields
  res.json([]);
});

// Admin notifications (for AdminNotifications.jsx)
app.post("/api/admin/notifications", requireAdmin, async (req, res) => {
  const { message } = req.body || {};
  if (!message || !String(message).trim()) return res.status(400).json({ error: "Message required" });

  // placeholder: store later in DB or push notifications
  res.json({ ok: true });
});

// Admin settings (for AdminSettings.jsx)
app.post("/api/admin/settings", requireAdmin, async (_req, res) => {
  // placeholder
  res.json({ ok: true });
});

// ============================================================================
// Health
// ============================================================================
app.get("/", (_req, res) => res.status(200).send("OK"));
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/api/test", (_req, res) => res.json({ ok: true, message: "✅ Backend is reachable" }));
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    javnaKeyLoaded: Boolean(process.env.JAVNA_API_KEY),
    resendKeyLoaded: Boolean(process.env.RESEND_API_KEY),
    mailFrom: process.env.MAIL_FROM || null,
  });
});

process.on("uncaughtException", (err) => console.error("UNCAUGHT_EXCEPTION:", err));
process.on("unhandledRejection", (reason) => console.error("UNHANDLED_REJECTION:", reason));

// ============================================================================
// Start
// ============================================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Trusted Links API running on port ${PORT}`);
  console.log("FRONTEND_BASE_URL:", FRONTEND_BASE_URL);
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log(`JAVNA_API_KEY: ${JAVNA_API_KEY ? "Loaded ✅" : "Missing ❌"}`);
});
