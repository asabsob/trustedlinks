// backend/server.js
// ============================================================================
// Trusted Links Backend API (MongoDB) + Resend Email + JAVNA WhatsApp OTP
// FLOW:
// 1) Signup user
// 2) Verify WhatsApp OTP
// 3) Verify Email
// 4) Subscribe / choose plan
// 5) Publish business
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
import { parseSearchIntent } from "./server/utils/aiSearchParser.js";
import { searchBusinesses } from "./search/searchService.js";
import { normalizeSearchText } from "./search/textNormalizer.js";
import { formatSearchResults, formatNearestResults } from "./search/searchFormatter.js";
import { findNearestBusinesses } from "./search/nearbyService.js";
import SearchLog from "./models/SearchLog.js";
import SearchSession from "./models/SearchSession.js";
import SearchCache from "./models/SearchCache.js";
import crypto from "crypto";
import ClickLog from "./models/ClickLog.js";
import LeadToken from "./models/LeadToken.js";

dotenv.config();
await connectDB();

const app = express();
const PORT = process.env.PORT || 5175;
const PENDING_NEARBY_REQUESTS = new Map();


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

const JWT_SECRET = (process.env.JWT_SECRET || "trustedlinks_secret").trim();

function signUserToken(userId) {
  return jwt.sign({ id: userId, role: "user" }, JWT_SECRET, { expiresIn: "7d" });
}

function signAdminToken(email) {
  return jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
}

function readBearer(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

function requireUser(req, res, next) {
  try {
    const token = readBearer(req);
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.role !== "user" || !payload?.id) {
      return res.status(403).json({ error: "Not allowed" });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  try {
    const token = readBearer(req);
    if (!token) return res.status(401).json({ error: "Missing admin token" });

    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.role !== "admin") {
      return res.status(403).json({ error: "Not admin" });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid admin token" });
  }
}

function requireOtpToken(req, res, next) {
  try {
    const otpToken = String(req.headers["x-otp-token"] || "").trim();
    if (!otpToken) return res.status(401).json({ error: "Missing OTP token" });

    const payload = jwt.verify(otpToken, JWT_SECRET);

    if (!payload?.verified || payload?.purpose !== "business_signup" || !payload?.whatsapp) {
      return res.status(403).json({ error: "Invalid OTP token" });
    }

    req.otp = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid OTP token" });
  }
}

function toSafeCategoryValue(cat) {
  if (!cat) return "";
  if (Array.isArray(cat)) return cat.join(", ");
  if (typeof cat === "string") return cat;
  if (typeof cat === "object") return cat?.name || cat?.key || "";
  return String(cat);
}

async function getUserOr404(userId, res) {
  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return null;
  }
  return user;
}

function setPendingNearby(from, category = "") {
  PENDING_NEARBY_REQUESTS.set(from, {
    category: category || "",
    createdAt: Date.now(),
  });
}

function getPendingNearby(from) {
  const item = PENDING_NEARBY_REQUESTS.get(from);
  if (!item) return null;

  // expire after 10 minutes
  if (Date.now() - item.createdAt > 10 * 60 * 1000) {
    PENDING_NEARBY_REQUESTS.delete(from);
    return null;
  }

  return item;
}

function clearPendingNearby(from) {
  PENDING_NEARBY_REQUESTS.delete(from);
}
async function logSearchEvent(payload) {
  try {
    await SearchLog.create(payload);
  } catch (err) {
    console.error("SEARCH LOG FAILED:", err);
  }
}

async function getSearchSession(userPhone) {
  try {
    return await SearchSession.findOne({ userPhone }).lean();
  } catch (err) {
    console.error("GET SEARCH SESSION FAILED:", err);
    return null;
  }
}

async function getPendingNearbySession(userPhone) {
  try {
    return await SearchSession.findOne({ userPhone }).lean();
  } catch (err) {
    console.error("GET PENDING NEARBY SESSION FAILED:", err);
    return null;
  }
}

async function setSearchSession(userPhone, data) {
  try {
    await SearchSession.findOneAndUpdate(
      { userPhone },
      {
        $set: {
          ...data,
          userPhone,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("SET SEARCH SESSION FAILED:", err);
  }
}

async function getCachedSearch(cacheKey) {
  try {
    const cached = await SearchCache.findOne({
      cacheKey,
      expiresAt: { $gt: new Date() },
    }).lean();

    return cached?.results || null;
  } catch (err) {
    console.error("GET CACHED SEARCH FAILED:", err);
    return null;
  }
}

async function setCachedSearch(cacheKey, results, ttlMinutes = 10) {
  try {
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await SearchCache.findOneAndUpdate(
      { cacheKey },
      {
        $set: {
          cacheKey,
          results: Array.isArray(results) ? results : [],
          expiresAt,
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("SET CACHED SEARCH FAILED:", err);
  }
}

function buildSearchCacheKey(query) {
  return `search:${normalizeSearchText(query || "")}`;
}

function buildNearbyCacheKey(lat, lng, categoryQuery = "") {
  const roundedLat = Number(lat).toFixed(3);
  const roundedLng = Number(lng).toFixed(3);
  const normalizedCategory = normalizeSearchText(categoryQuery || "");
  return `nearby:${roundedLat}:${roundedLng}:${normalizedCategory}`;
}

function shouldUseAIFallback(incomingText, query) {
  const text = (incomingText || "").trim();
  const normalized = (query || "").trim();

  if (!text || text.length <= 3) return false;
  if (!normalized) return false;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0].length <= 4) return false;

  return true;
}

function isMoreCommand(text) {
  const t = (text || "").trim().toLowerCase();

  return [
    "more",
    "show more",
    "more results",
    "المزيد",
    "اعرض المزيد",
    "نتائج أكثر",
    "اكثر",
  ].includes(t);
}

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || "http://localhost:5173").trim();
const FRONTEND_BASE_URL = (process.env.FRONTEND_BASE_URL || FRONTEND_ORIGIN).trim();
const API_BASE_URL = (
  process.env.API_BASE_URL || "https://trustedlinks-backend-production.up.railway.app"
).trim();

// ---------------------------------------------------------------------------
// CORS + JSON
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: ["https://trustedlinks.net", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-OTP-Token",
      "x-otp-token",
    ],
  })
);

// ---------------------------------------------------------------------------
// Email (Resend)
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
// JAVNA Config
// ---------------------------------------------------------------------------
const JAVNA_API_KEY = process.env.JAVNA_API_KEY || "";
const JAVNA_FROM = process.env.JAVNA_FROM || "";
const JAVNA_BASE_URL = "https://whatsapp.api.javna.com/whatsapp/v1.0";
const JAVNA_SEND_TEXT_URL = `${JAVNA_BASE_URL}/message/text`;
const JAVNA_SEND_AUTH_TEMPLATE_URL = `${JAVNA_BASE_URL}/message/template/authentication`;

async function javnaSendText({ to, body }) {
  if (!JAVNA_API_KEY) throw new Error("Missing JAVNA_API_KEY");
  if (!JAVNA_FROM) throw new Error("Missing JAVNA_FROM");

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": JAVNA_API_KEY,
  };

  const from = JAVNA_FROM.startsWith("+") ? JAVNA_FROM : `+${JAVNA_FROM}`;
  const toNumber = to.startsWith("+") ? to : `+${to}`;

  const payload = {
    from,
    to: toNumber,
    content: { text: String(body || "") },
  };

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

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": JAVNA_API_KEY,
  };

  const from = JAVNA_FROM.startsWith("+") ? JAVNA_FROM : `+${JAVNA_FROM}`;
  const toNumber = to.startsWith("+") ? to : `+${to}`;

  const templateName = lang === "ar" ? "turstedlinks_otp_ar" : "trustedlinks_otp_en";
  const templateLanguage = lang === "ar" ? "ar" : "en";

  const payload = {
    from,
    to: toNumber,
    content: {
      templateName,
      templateLanguage,
      otp: String(code),
    },
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

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

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

// ============================================================================
// AUTH (Signup/Login) + Email Verification + Forgot Password
// ============================================================================

// 1) Signup user only
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

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
      resetToken: null,
      resetTokenExpiresAt: null,
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

    return res.json({
      ok: true,
      message: "Signup ok. Check your email.",
    });
  } catch (e) {
    console.error("signup error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Login only after email verification
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailNorm = String(email || "").toLowerCase().trim();

    const user = await User.findOne({ email: emailNorm });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const token = signUserToken(String(user._id));
    return res.json({
      ok: true,
      token,
      subscriptionPlan: user.subscriptionPlan,
      planActivatedAt: user.planActivatedAt,
      email: user.email,
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
    if (String(user.verifyToken) !== String(token)) {
      return res.status(401).send("Invalid token");
    }

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
    if (user.emailVerified) {
      return res.json({ ok: true, message: "Email already verified" });
    }

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

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    console.log("FORGOT BODY:", req.body);

    const emailNorm = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    if (!emailNorm) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email: emailNorm });

    if (!user) {
      return res.json({
        ok: true,
        message: "If this email exists, a reset link has been sent.",
      });
    }

    const resetToken = nanoid(40);

    user.resetToken = resetToken;
    user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    const resetUrl =
      `${FRONTEND_BASE_URL}/reset-password` +
      `?email=${encodeURIComponent(emailNorm)}` +
      `&token=${encodeURIComponent(resetToken)}`;

    await sendEmail({
      to: emailNorm,
      subject: "Reset your password",
      html: `
      <p>Reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      `,
    });

    res.json({
      ok: true,
      message: "Reset email sent.",
    });
  } catch (e) {
    console.error("forgot-password error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};

    const emailNorm = String(email || "").toLowerCase().trim();
    const resetToken = String(token || "").trim();
    const password = String(newPassword || "");

    if (!emailNorm || !resetToken || !password) {
      return res.status(400).json({ error: "Email, token, and new password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ email: emailNorm });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.resetToken || !user.resetTokenExpiresAt) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    if (String(user.resetToken) !== resetToken) {
      return res.status(401).json({ error: "Invalid reset token" });
    }

    if (new Date(user.resetTokenExpiresAt).getTime() < Date.now()) {
      return res.status(410).json({ error: "Reset token expired" });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiresAt = null;

    await user.save();

    return res.json({
      ok: true,
      message: "Password reset successfully",
    });
  } catch (e) {
    console.error("reset-password error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================================
// USER
// ============================================================================
app.get("/api/me", requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      ok: true,
      id: String(user._id),
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      subscriptionPlan: user.subscriptionPlan || null,
      planActivatedAt: user.planActivatedAt || null,
    });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

// ============================================================================
// WhatsApp OTP
// ============================================================================
app.post("/api/whatsapp/request-otp", async (req, res) => {
  try {
    const { whatsapp } = req.body || {};

    if (!whatsapp) {
      return res.status(400).json({ error: "WhatsApp number missing" });
    }

    const clean = cleanDigits(whatsapp);

    if (!/^\d{10,15}$/.test(clean)) {
      return res.status(400).json({ error: "Invalid WhatsApp number" });
    }

    const already = await Business.findOne({ whatsapp: clean });
    if (already) {
      return res.status(409).json({
        error: "This WhatsApp number is already registered.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ whatsapp: clean, purpose: "business_signup" });

    await Otp.create({
      whatsapp: clean,
      code: otp,
      purpose: "business_signup",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (!JAVNA_API_KEY) {
      return res.json({
        success: true,
        message: "OTP generated (mock).",
        devOtp: otp,
      });
    }

    const javnaResp = await javnaSendOtpTemplate({
      to: `+${clean}`,
      code: otp,
      lang: "en",
    });

    if (javnaResp?.stats?.rejected === "1") {
      return res.status(400).json({
        success: false,
        error: "Javna rejected template",
        javna: javnaResp,
      });
    }

    return res.json({
      success: true,
      message: "OTP sent.",
      javna: javnaResp,
    });
  } catch (e) {
    console.error("request-otp error", e);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/whatsapp/verify-otp", async (req, res) => {
  try {
    const { whatsapp, code } = req.body || {};

    if (!whatsapp || !code) {
      return res.status(400).json({
        ok: false,
        error: "WhatsApp number and code are required",
      });
    }

    const clean = cleanDigits(whatsapp);

    if (!/^\d{10,15}$/.test(clean)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid WhatsApp number",
      });
    }

    const existingBusiness = await Business.findOne({ whatsapp: clean });
    if (existingBusiness) {
      return res.status(409).json({
        ok: false,
        error: "This WhatsApp number is already registered.",
        reason: "WHATSAPP_ALREADY_REGISTERED",
      });
    }

    const rec = await Otp.findOne({
      whatsapp: clean,
      purpose: "business_signup",
    });

    if (!rec) {
      return res.status(404).json({
        ok: false,
        error: "No OTP found.",
        reason: "NO_OTP",
      });
    }

    if (String(rec.code) !== String(code)) {
      return res.status(401).json({
        ok: false,
        error: "Invalid OTP code.",
        reason: "BAD_CODE",
      });
    }

    if (rec.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({
        ok: false,
        error: "OTP expired.",
        reason: "EXPIRED",
      });
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
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
});

// ============================================================================
// SUBSCRIBE (Choose plan) - requires verified email first
// ============================================================================
app.post("/api/subscribe", requireUser, async (req, res) => {
  try {
    const { plan } = req.body || {};
    const p = String(plan || "monthly").trim();

    const user = await getUserOr404(req.user.id, res);
    if (!user) return;

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    user.subscriptionPlan = p;
    user.planActivatedAt = new Date();
    await user.save();

    return res.json({
      ok: true,
      subscriptionPlan: user.subscriptionPlan,
      planActivatedAt: user.planActivatedAt,
    });
  } catch (e) {
    console.error("subscribe error:", e);
    return res.status(500).json({ error: "Subscription failed" });
  }
});

// ============================================================================
// BUSINESS PUBLISH
// Requires:
// - user logged in
// - email verified
// - subscription selected
// - whatsapp verified (x-otp-token)
// ============================================================================

// النشر النهائي
app.post("/api/business/publish", requireUser, requireOtpToken, publishBusinessHandler);

// Alias للتوافق مع الفرونت الحالي إن كان يستعمل signup
app.post("/api/business/signup", requireUser, requireOtpToken, publishBusinessHandler);

async function publishBusinessHandler(req, res) {
  try {
    const ownerUserId = String(req.user.id);
    const whatsapp = String(req.otp.whatsapp);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    if (!user.subscriptionPlan) {
      return res.status(403).json({ error: "Subscription required before publish" });
    }

    const {
      name,
      name_ar = "",
      description = "",
      category = [],
      latitude = null,
      longitude = null,
      mapLink = "",
      mediaLink = "",
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: "Business name required" });
    }

    const existing = await Business.findOne({ whatsapp });
    if (existing && String(existing.ownerUserId) !== ownerUserId) {
      return res.status(409).json({
        error: "WhatsApp already registered to another account",
      });
    }

    let business = await Business.findOne({ ownerUserId });

    if (!business) {
      business = await Business.create({
        ownerUserId,
        name,
        name_ar,
        description,
        category: Array.isArray(category) ? category : [],
        whatsapp,
        status: "Active",
        latitude,
        longitude,
        mapLink,
        mediaLink,
      });
    } else {
      business.name = name;
      business.name_ar = name_ar;
      business.description = description;
      business.category = Array.isArray(category) ? category : [];
      business.whatsapp = whatsapp;
      business.status = "Active";
      business.latitude = latitude;
      business.longitude = longitude;
      business.mapLink = mapLink;
      business.mediaLink = mediaLink;

      await business.save();
    }

    return res.json({
      ok: true,
      message: "Business published successfully",
      business,
    });
  } catch (e) {
    console.error("publishBusinessHandler error:", e);

    if (e?.code === 11000) {
      return res.status(409).json({
        error: "This WhatsApp number is already registered.",
      });
    }

    return res.status(500).json({ error: "Failed to publish business" });
  }
}
// ============================================================================
// USER BUSINESS
// ============================================================================
app.get("/api/business/me", requireUser, async (req, res) => {
  try {
    const b = await Business.findOne({ ownerUserId: String(req.user.id) }).lean();
    if (!b) return res.status(404).json({ error: "Business not found" });
    return res.json(b);
  } catch (e) {
    console.error("business/me error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

app.put("/api/business/update", requireUser, async (req, res) => {
  try {
    const b = await Business.findOne({ ownerUserId: String(req.user.id) });
    if (!b) return res.status(404).json({ error: "Business not found" });

    const { name, category, mediaLink, mapLink, description, name_ar } = req.body || {};

    if (name !== undefined) b.name = name;
    if (name_ar !== undefined) b.name_ar = name_ar;
    if (description !== undefined) b.description = description;
    if (category !== undefined) b.category = Array.isArray(category) ? category : b.category;
    if (mediaLink !== undefined) b.mediaLink = mediaLink;
    if (mapLink !== undefined) b.mapLink = mapLink;

    await b.save();
    return res.json({ ok: true, business: b });
  } catch (e) {
    console.error("update business error:", e);
    return res.status(500).json({ error: "Update failed" });
  }
});

app.get("/api/business/reports", requireUser, async (req, res) => {
  try {
    const b = await Business.findOne({ ownerUserId: String(req.user.id) }).lean();
    if (!b) return res.status(404).json({ error: "Business not found" });

    const clicksArr = Array.isArray(b.clicks) ? b.clicks : [];
    const messagesArr = Array.isArray(b.messages) ? b.messages : [];
    const mediaArr = Array.isArray(b.mediaViews) ? b.mediaViews : [];
    const viewsArr = Array.isArray(b.views) ? b.views : [];

    return res.json({
      business: b.name || "Business",
      category: Array.isArray(b.category)
        ? b.category.join(", ")
        : toSafeCategoryValue(b.category) || "Category",
      totalClicks: clicksArr.length,
      totalMessages: messagesArr.length,
      mediaViews: mediaArr.length,
      views: viewsArr.length,
      weeklyGrowth: 0,
      activity: [],
      sources: [
        { name_en: "WhatsApp", name_ar: "واتساب", value: messagesArr.length },
        { name_en: "Clicks", name_ar: "نقرات", value: clicksArr.length },
        { name_en: "Media", name_ar: "وسائط", value: mediaArr.length },
        { name_en: "Views", name_ar: "مشاهدات", value: viewsArr.length },
      ],
    });
  } catch (e) {
    console.error("reports error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// ============================================================================
// PUBLIC SEARCH + PUBLIC business endpoints
// ============================================================================
app.get("/api/search", async (req, res) => {
  try {
    const { query = "", category = "all", lat, lng } = req.query;

    let results = await Business.find({ status: "Active" }).lean();

    if (query) {
      const q = String(query).toLowerCase();
      results = results.filter((b) => {
        const name = (b.name || "").toLowerCase();
        const nameAr = (b.name_ar || "").toLowerCase();
        const desc = (b.description || "").toLowerCase();
        const catStr = Array.isArray(b.category)
          ? b.category.join(" ").toLowerCase()
          : toSafeCategoryValue(b.category).toLowerCase();

        return name.includes(q) || nameAr.includes(q) || desc.includes(q) || catStr.includes(q);
      });
    }

    if (category && category !== "all") {
      const c = String(category).toLowerCase();
      results = results.filter((b) => {
        const catStr = Array.isArray(b.category)
          ? b.category.join(" ").toLowerCase()
          : toSafeCategoryValue(b.category).toLowerCase();

        return catStr.includes(c);
      });
    }

    if (lat && lng) {
      const userLocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      };

      results = results
        .map((b) => {
          if (b.latitude && b.longitude) {
            const distance = geolib.getDistance(userLocation, {
              latitude: b.latitude,
              longitude: b.longitude,
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

app.get("/api/businesses", async (_req, res) => {
  try {
    const list = await Business.find({ status: "Active" }).lean();
    return res.json(list);
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/business/:id", async (req, res) => {
  try {
    const b = await Business.findById(req.params.id).lean();
    if (!b) return res.status(404).json({ error: "Not found" });
    return res.json(b);
  } catch {
    return res.status(404).json({ error: "Not found" });
  }
});

// ============================================================================
// Tracking endpoints used by BusinessDetails.jsx
// ============================================================================
async function pushEvent(businessId, field, payload = {}) {
  const b = await Business.findById(businessId);
  if (!b) return null;

  if (!Array.isArray(b[field])) b[field] = [];
  b[field].push({ at: new Date(), ...payload });

  await b.save();
  return b;
}

app.post("/api/track-view", async (req, res) => {
  try {
    const { businessId } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });
    await pushEvent(businessId, "views");
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.post("/api/track-click", async (req, res) => {
  try {
    const { businessId } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });
    await pushEvent(businessId, "clicks");
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.post("/api/track-media", async (req, res) => {
  try {
    const { businessId } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });
    await pushEvent(businessId, "mediaViews");
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.post("/api/track-map", async (req, res) => {
  try {
    const { businessId } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });
    await pushEvent(businessId, "mapClicks");
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.post("/api/track-whatsapp", async (req, res) => {
  try {
    const { businessId } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });
    await pushEvent(businessId, "whatsappClicks");
    await pushEvent(businessId, "messages");
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/instagram-profile/:username", async (_req, res) => {
  return res.json({ profilePic: null });
});

// ============================================================================
// Admin Auth + Admin endpoints
// ============================================================================
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@trustedlinks.app";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (String(email || "").trim().toLowerCase() !== String(ADMIN_EMAIL).trim().toLowerCase()) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passOk = ADMIN_PASSWORD.startsWith("$2")
      ? await bcrypt.compare(String(password), ADMIN_PASSWORD)
      : String(password) === String(ADMIN_PASSWORD);

    if (!passOk) return res.status(401).json({ error: "Invalid credentials" });

    const token = signAdminToken(email);
    return res.json({ token });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/me", requireAdmin, async (req, res) => {
  return res.json({ ok: true, email: req.admin.email, role: "admin" });
});

app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const users = await User.countDocuments();
    const businesses = await Business.countDocuments();

    const all = await Business.find({}, { clicks: 1 }).lean();
    const clicks = all.reduce(
      (acc, b) => acc + (Array.isArray(b.clicks) ? b.clicks.length : 0),
      0
    );

    return res.json({ users, businesses, clicks, activity: [], categories: [] });
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/admin/businesses", requireAdmin, async (_req, res) => {
  try {
    const list = await Business.find({}).lean();
    return res.json(list);
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/admin/users", requireAdmin, async (_req, res) => {
  try {
    const users = await User.find(
      {},
      { passwordHash: 0, verifyToken: 0, resetToken: 0, resetTokenExpiresAt: 0 }
    )
      .sort({ createdAt: -1 })
      .lean();

    return res.json(users);
  } catch {
    return res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/admin/plans", requireAdmin, async (_req, res) => {
  return res.json([
    { id: "p1", name: "Free", price: 0, period: "mo" },
    { id: "p2", name: "Pro", price: 15, period: "mo" },
    { id: "p3", name: "Enterprise", price: 49, period: "mo" },
  ]);
});

app.get("/api/admin/subscriptions", requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({ subscriptionPlan: { $ne: null } }).lean();

    const rows = await Promise.all(
      users.map(async (u) => {
        const b = await Business.findOne({ ownerUserId: String(u._id) }).lean();
        return {
          id: String(u._id),
          business: b?.name || u.email,
          plan: u.subscriptionPlan || "—",
          renews: "Monthly",
        };
      })
    );

    return res.json(rows);
  } catch {
    return res.json([]);
  }
});

// تفعيل النشاط من الأدمن
app.post("/api/admin/businesses/:id/activate", requireAdmin, async (req, res) => {
  try {
    const b = await Business.findById(req.params.id);
    if (!b) return res.status(404).json({ error: "Not found" });

    b.status = "Active";
    await b.save();

    return res.json({ ok: true, business: b });
  } catch (e) {
    console.error("activate business error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

app.post("/api/admin/businesses/:id/suspend", requireAdmin, async (req, res) => {
  try {
    const b = await Business.findById(req.params.id);
    if (!b) return res.status(404).json({ error: "Not found" });

    b.status = "Suspended";
    await b.save();

    return res.json({ ok: true, business: b });
  } catch (e) {
    console.error("suspend business error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

let NOTIFS = [];

app.get("/api/admin/notifications", requireAdmin, async (_req, res) => res.json(NOTIFS));

app.post("/api/admin/notifications", requireAdmin, async (req, res) => {
  const { message } = req.body || {};
  if (!String(message || "").trim()) {
    return res.status(400).json({ error: "Message required" });
  }

  const n = {
    id: nanoid(10),
    title: "Admin",
    message: String(message),
    date: new Date().toISOString(),
  };

  NOTIFS = [n, ...NOTIFS].slice(0, 200);
  return res.json({ ok: true, notification: n });
});

app.get("/api/admin/insights", requireAdmin, async (_req, res) => {
  return res.json({
    insight:
      "No AI insights yet. Once tracking grows, this will show top categories, growth, and recommendations.",
  });
});

app.post("/api/admin/ai-summary", requireAdmin, async (_req, res) => {
  return res.json({
    summary:
      "AI Summary: System is running. Next step is enabling activity aggregation + insights generation.",
  });
});

let ADMIN_SETTINGS = {
  theme: "light",
  email: ADMIN_EMAIL,
};

app.get("/api/admin/settings", requireAdmin, async (_req, res) => res.json(ADMIN_SETTINGS));

app.post("/api/admin/settings", requireAdmin, async (req, res) => {
  ADMIN_SETTINGS = { ...ADMIN_SETTINGS, ...(req.body || {}) };
  return res.json({ ok: true, settings: ADMIN_SETTINGS });
});

function detectLanguage(text = "") {
  return /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
}

function isHelpCommand(text = "") {
  const t = String(text || "").trim().toLowerCase();
  return ["help", "start", "مساعدة", "ابدأ"].includes(t);
}

function isThanks(text = "") {
  const t = String(text).toLowerCase().trim();
  return ["شكرا", "شكرًا", "thanks", "thank you"].includes(t);
}

function isGreeting(text = "") {
  const t = String(text || "").trim().toLowerCase();
  return [
    "سلام",
    "مرحبا",
    "هلا",
    "اهلا",
    "أهلا",
    "hello",
    "hi",
    "hey",
    "start",
    "ابدأ",
  ].includes(t);
}

function getWelcomeMessage(lang = "ar") {
  if (lang === "ar") {
    return (
      "مرحبًا بك في TrustedLinks 👋\n\n" +
      "يمكنني مساعدتك في البحث عن الشركات بسهولة.\n\n" +
      "أمثلة:\n" +
      "• مطعم\n" +
      "• قهوة\n" +
      "• صيدلية\n" +
      "• كوكو\n\n" +
      "ويمكنك أيضًا إرسال:\n" +
      "• أقرب شركة\n" +
      "• أقرب مطعم\n\n" +
      "اكتب اسم الشركة أو نوع النشاط للبدء."
    );
  }

  return (
    "Welcome to TrustedLinks 👋\n\n" +
    "I can help you find businesses easily.\n\n" +
    "Examples:\n" +
    "• restaurant\n" +
    "• coffee\n" +
    "• pharmacy\n" +
    "• coco\n\n" +
    "You can also send:\n" +
    "• nearest business\n" +
    "• nearest restaurant\n\n" +
    "Type a business name or category to begin."
  );
}

function parseNearbyIntent(text = "") {
  const raw = String(text || "").trim();
  const q = raw.toLowerCase();

  const phrasesToRemove = [
    "قريبة مني",
    "قريب مني",
    "قريبة",
    "قريب",
    "أقرب",
    "اقرب",
    "بالقرب مني",
    "بالقرب",
    "حولي",
    "مني",
    "عندي",
    "near me",
    "nearest",
    "closest",
    "near",
    "around me",
    "around",
    "me",
  ];

  const isNearby = phrasesToRemove.some((word) =>
    q.includes(word.toLowerCase())
  );

  if (!isNearby) {
    return { isNearby: false, categoryQuery: "" };
  }

  let categoryQuery = raw;

  phrasesToRemove
    .sort((a, b) => b.length - a.length)
    .forEach((word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "ig");
      categoryQuery = categoryQuery.replace(rx, " ");
    });

  categoryQuery = categoryQuery.replace(/\s+/g, " ").trim();

  return {
    isNearby: true,
    categoryQuery,
  };
}
app.get("/webhooks/javna/whatsapp", (_req, res) => {
  res.status(200).send("WhatsApp webhook is live");
});


app.post("/webhooks/javna/whatsapp", async (req, res) => {
  try {
    console.log("POST WEBHOOK HIT");
    console.log("HEADERS:", JSON.stringify(req.headers, null, 2));
    console.log("BODY:", JSON.stringify(req.body, null, 2));

    // Reply immediately to Javna
    res.status(200).json({ ok: true });

    const body = req.body || {};

    if (body.eventScope !== "whatsapp" || body.event !== "wa.message.received") {
      console.log("IGNORED EVENT:", body.eventScope, body.event);
      return;
    }

    const from = cleanDigits(body.from || body?.data?.from || "");
    const messageType = body?.data?.type || "";
    const incomingLocation = body?.data?.location || null;
    const incomingText = (body?.data?.text?.text || body?.data?.text || "")
      .toString()
      .trim();

    console.log("FROM:", from);
    console.log("TEXT:", incomingText);
    console.log("MESSAGE TYPE:", messageType);
    console.log("LOCATION:", incomingLocation);

    if (!from) {
      console.log("MISSING FROM");
      return;
    }

    const lang = detectLanguage(incomingText || "");
    const normalizedIncomingText = normalizeSearchText(incomingText || "");
    const pendingNearby = await getPendingNearbySession(from);

    // 1) Thanks
    if (isThanks(incomingText)) {
      await javnaSendText({
        to: from,
        body:
          lang === "ar"
            ? "على الرحب والسعة 😊\nإذا احتجت البحث عن شركة اكتب اسمها أو نوع النشاط."
            : "You're welcome 😊\nSend a company name or category any time.",
      });
      return;
    }

    // 2) Location message
    if (
      messageType === "location" &&
      incomingLocation?.latitude != null &&
      incomingLocation?.longitude != null
    ) {
      const lat = Number(incomingLocation.latitude);
      const lng = Number(incomingLocation.longitude);

      console.log("PENDING NEARBY SESSION:", JSON.stringify(pendingNearby, null, 2));
      
      const categoryQuery = pendingNearby?.pendingNearby?.category || "";
      const cacheKey = buildNearbyCacheKey(lat, lng, categoryQuery);

      let nearest = await getCachedSearch(cacheKey);

      if (!nearest) {
        nearest = await findNearestBusinesses(lat, lng, 5, categoryQuery);
        await setCachedSearch(cacheKey, nearest, 10);
      }

      const locationReply = formatNearestResults(nearest, lang, categoryQuery, {
        userPhone: from,
      });

      await logSearchEvent({
        type: "nearby_location_received",
        userPhone: from,
        rawText: incomingText || null,
        query: categoryQuery || null,
        normalizedQuery: categoryQuery || null,
        intent: "nearby",
        lang,
        location: {
          lat,
          lng,
        },
        resultsCount: Array.isArray(nearest) ? nearest.length : 0,
        usedAI: false,
        source: "nearby",
        timestamp: new Date(),
      });

      await setSearchSession(from, {
        userPhone: from,
        lastQuery: categoryQuery || "",
        normalizedQuery: categoryQuery || "",
        lastIntent: "nearby",
        lastResults: Array.isArray(nearest) ? nearest.slice(0, 10) : [],
        pendingNearby: null,
        updatedAt: new Date(),
      });

      const locationSendResp = await javnaSendText({
        to: from,
        body: locationReply,
      });

      console.log("LOCATION SEND RESP:", JSON.stringify(locationSendResp, null, 2));
      return;
    }

    // 3) Empty text
    if (!incomingText) {
      const emptyTextResp = await javnaSendText({
        to: from,
        body:
          lang === "ar"
            ? "أرسل اسم شركة أو نوع نشاط للبحث، أو شارك موقعك لإظهار الأقرب."
            : "Send a company name or category, or share your location to find nearby results.",
      });

      console.log("EMPTY TEXT RESP:", JSON.stringify(emptyTextResp, null, 2));
      return;
    }

    // 4) Greeting
    if (isGreeting(incomingText)) {
      const welcomeReply = getWelcomeMessage(lang);

      const welcomeResp = await javnaSendText({
        to: from,
        body: welcomeReply,
      });

      console.log("WELCOME RESP:", JSON.stringify(welcomeResp, null, 2));
      return;
    }

    // 5) Help
    if (isHelpCommand(incomingText)) {
      const helpReply =
        lang === "ar"
          ? "مرحبًا بك في TrustedLinks 👋\n\nأرسل:\n• اسم شركة\n• أو نوع نشاط مثل: مطعم، قهوة، صيدلية\n\nوللبحث القريب أرسل:\n• أقرب شركة\n• أقرب مطعم\n• أقرب قهوة"
          : "Welcome to TrustedLinks 👋\n\nSend:\n• a business name\n• or a category like: restaurant, coffee, pharmacy\n\nFor nearby search, send:\n• nearest business\n• nearest restaurant\n• nearest coffee";

      const helpResp = await javnaSendText({
        to: from,
        body: helpReply,
      });

      console.log("HELP RESP:", JSON.stringify(helpResp, null, 2));
      return;
    }

    // 6) Nearby intent
    const nearbyIntent = parseNearbyIntent(incomingText);
    console.log("NEARBY INTENT:", nearbyIntent);

    if (nearbyIntent.isNearby) {
      const categoryQuery = normalizeSearchText(nearbyIntent.categoryQuery || "");

      await setSearchSession(from, {
        userPhone: from,
        lastQuery: categoryQuery || "",
        normalizedQuery: categoryQuery || "",
        lastIntent: "nearby_request",
        lastResults: [],
        pendingNearby: {
          category: categoryQuery,
        },
        updatedAt: new Date(),
      });

      await logSearchEvent({
        type: "nearby_request",
        userPhone: from,
        rawText: incomingText,
        query: nearbyIntent.categoryQuery || "",
        normalizedQuery: categoryQuery || "",
        intent: "nearby",
        lang,
        location: null,
        resultsCount: 0,
        usedAI: false,
        source: "nearby_request",
        timestamp: new Date(),
      });

      const nearbyReply =
        lang === "ar"
          ? categoryQuery
            ? `📍 أرسل موقعك عبر واتساب، وسأعرض لك أقرب النتائج لـ "${categoryQuery}".`
            : "📍 أرسل موقعك عبر واتساب، وسأعرض لك أقرب الأنشطة المسجلة."
          : categoryQuery
            ? `📍 Please share your location on WhatsApp, and I’ll show you the nearest results for "${categoryQuery}".`
            : "📍 Please share your location on WhatsApp, and I’ll show you the nearest listed businesses.";

      const nearbyResp = await javnaSendText({
        to: from,
        body: nearbyReply,
      });

      console.log("NEARBY RESP:", JSON.stringify(nearbyResp, null, 2));
      return;
    }

    // 7) MORE command
    if (isMoreCommand(incomingText)) {
      const session = await getSearchSession(from);

      if (!session?.lastResults || session.lastResults.length === 0) {
        const noSessionReply =
          lang === "ar"
            ? "لا يوجد نتائج سابقة لعرض المزيد منها. اكتب اسم شركة أو نوع نشاط للبحث."
            : "There are no previous results to continue. Send a company name or category to search.";

        const noSessionResp = await javnaSendText({
          to: from,
          body: noSessionReply,
        });

        console.log("NO SESSION MORE RESP:", JSON.stringify(noSessionResp, null, 2));
        return;
      }

      const moreReply =
        lang === "ar"
          ? "ميزة المزيد ستعتمد على الترقيم وحفظ الصفحات في المرحلة التالية. حالياً أرسل بحثًا جديدًا أو موقعك."
          : "The MORE feature will use saved paging in the next step. For now, send a new search or your location.";

      const moreResp = await javnaSendText({
        to: from,
        body: moreReply,
      });

      console.log("MORE RESP:", JSON.stringify(moreResp, null, 2));
      return;
    }

    // 8) Normal search
    let query = normalizedIncomingText;

    console.log("LANG:", lang);
    console.log("INITIAL QUERY:", query);

    if (!query) {
      const emptyReply =
        lang === "ar"
          ? "أرسل اسم شركة أو نوع النشاط الذي تريد البحث عنه."
          : "Please send a company name or business category to search for.";

      const emptyResp = await javnaSendText({
        to: from,
        body: emptyReply,
      });

      console.log("EMPTY RESP:", JSON.stringify(emptyResp, null, 2));
      return;
    }

    let results = [];
    let usedAI = false;
    let finalSource = "local";
    let aiCategory = null;

    const cacheKey = buildSearchCacheKey(query);

    const cachedResults = await getCachedSearch(cacheKey);
    if (cachedResults) {
      results = cachedResults;
      finalSource = "cache";
      console.log("CACHE HIT:", cacheKey, "COUNT:", results.length);
    } else {
      results = await searchBusinesses(query);
      console.log("LOCAL SEARCH RESULTS COUNT:", results.length);

     if (false && (!results || results.length === 0) && shouldUseAIFallback(incomingText, query)) {
        try {
          const ai = await parseSearchIntent(incomingText);
          console.log("AI RESULT:", ai);

          if (ai?.category) {
            aiCategory = normalizeSearchText(ai.category);
            query = aiCategory;
            usedAI = true;
            finalSource = "ai_fallback";

            const aiCacheKey = buildSearchCacheKey(query);
            const cachedAiResults = await getCachedSearch(aiCacheKey);

            if (cachedAiResults) {
              results = cachedAiResults;
              finalSource = "ai_fallback_cache";
            } else {
              results = await searchBusinesses(query);
              await setCachedSearch(aiCacheKey, results, 10);
            }

            console.log("AI FALLBACK RESULTS COUNT:", results.length);
          }
        } catch (err) {
          console.error("AI PARSE FAILED:", err);
        }
      }

      if (!usedAI) {
        await setCachedSearch(cacheKey, results, 10);
      }
    }

    await logSearchEvent({
      type: "search",
      userPhone: from,
      rawText: incomingText,
      query,
      normalizedQuery: query,
      intent: "search",
      lang,
      location: null,
      resultsCount: Array.isArray(results) ? results.length : 0,
      usedAI,
      aiCategory,
      source: finalSource,
      timestamp: new Date(),
    });

    await setSearchSession(from, {
      userPhone: from,
      lastQuery: query,
      normalizedQuery: query,
      lastIntent: "search",
      lastResults: Array.isArray(results) ? results.slice(0, 10) : [],
      pendingNearby: null,
      updatedAt: new Date(),
    });

    const reply = formatSearchResults(results, query, lang, {
      userPhone: from,
    });

    const sendResp = await javnaSendText({
      to: from,
      body: reply,
    });

    console.log("SEND RESP:", JSON.stringify(sendResp, null, 2));
  } catch (e) {
    console.error("WHATSAPP WEBHOOK ERROR:", e);
  }
});


app.get("/l/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).send("Invalid link");
    }

    const leadToken = await LeadToken.findById(token).lean();

    if (!leadToken) {
      return res.status(404).send("Link not found or expired");
    }

    const {
      businessId = "",
      businessPhone = "",
      query = "",
      userPhone = "",
    } = leadToken;

    if (!businessPhone) {
      return res.status(400).send("Invalid destination");
    }

    await ClickLog.create({
      businessId,
      businessPhone,
      userPhone,
      query,
      timestamp: new Date(),
    });

    const message = encodeURIComponent("Hello, I found you on TrustedLinks");

    return res.redirect(`https://wa.me/${businessPhone}?text=${message}`);
  } catch (err) {
    console.error("LEAD CLICK ERROR:", err);
    return res.status(500).send("Error");
  }
});

// ---------------------------------------------------------------------------
// Debug
// ---------------------------------------------------------------------------
app.get("/api/debug/resend", (_req, res) => {
  res.json({
    hasKey: Boolean(process.env.RESEND_API_KEY),
    hasFrom: Boolean(process.env.MAIL_FROM),
    from: process.env.MAIL_FROM || null,
  });
});

app.get("/api/debug/mongo", async (_req, res) => {
  try {
    const users = await User.countDocuments();
    const businesses = await Business.countDocuments();

    res.json({
      ok: true,
      users,
      businesses,
      hasMongoUri: Boolean(process.env.MONGODB_URI),
    });
    
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

process.on("uncaughtException", (err) => console.error("UNCAUGHT_EXCEPTION:", err));
process.on("unhandledRejection", (reason) => console.error("UNHANDLED_REJECTION:", reason));

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Trusted Links API running on port ${PORT}`);
  console.log("FRONTEND_BASE_URL:", FRONTEND_BASE_URL);
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log(`JAVNA_API_KEY: ${JAVNA_API_KEY ? "Loaded ✅" : "Missing ❌"}`);
});
