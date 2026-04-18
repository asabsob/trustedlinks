// backend/server.js
// ============================================================================
// Trusted Links Backend API (Supabase Version)
// ============================================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import geolib from "geolib";
import { nanoid } from "nanoid";


import { searchBusinesses } from "./search/searchService.js";
import { normalizeSearchText } from "./search/textNormalizer.js";
import { formatSearchResponse, formatNearestResults } from "./search/searchFormatter.js";
import { findNearestBusinesses } from "./search/nearbyService.js";
import crypto from "crypto";
import { parseSearchIntent } from "./search/intentDetector.js";
import { optimizeBusinessProfile } from "./services/aiOptimizer.js";
import { translateBusinessContent } from "./services/ai/translateBusiness.js";

import {
  getUserById,
  getUserByEmail,
  createUser,
  verifyUserEmail,
  setVerifyToken,
  setResetToken,
  updateUserPassword,
  updateUserWalletBalance,
  updateUserSubscription,
} from "./services/pg/users.js";

import {
  getBusinessByWhatsapp,
  listAllBusinesses,
  createBusiness,
  getBusinessByOwnerUserId,
  updateBusinessByOwnerUserId,
  getBusinessById,
  getBusinessByCustomId,
  listActiveBusinesses,
  incrementBusinessEventField,
} from "./services/pg/businesses.js";

import { listAllUsers } from "./services/pg/users.js";

import {
  deleteOtpByWhatsappPurpose,
  createOtp,
  getOtp,
  consumeOtp,
  incrementOtpAttempts,
  blockOtp,
} from "./services/pg/otps.js"

import {
  createTransaction,
  listBusinessTransactions,
} from "./services/pg/transactions.js";

import {
  createTopupOrder,
  getTopupOrderById,
  markTopupOrderPaid,
  getPendingTopupOrders,
} from "./services/pg/topupOrders.js";

import { createBusinessEvent } from "./services/pg/businessEvents.js";

import {
  createLeadToken,
  getLeadTokenById,
} from "./services/pg/leadTokens.js";

import {
  topupBusinessWallet,
  deductBusinessWallet,
} from "./services/pg/businessWallet.js";

import { createClient } from "@supabase/supabase-js";

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { logEvent } from "./services/pg/auditLogs.js";

import {
  buildRequestHash,
  getIdempotencyRecord,
  createIdempotencyRecord,
  completeIdempotencyRecord,
} from "./services/pg/idempotency.js";

import {
  maskPhone,
  hashPhone,
  redactIp,
  normalizeQueryForStorage,
  buildSafeSearchLog,
} from "./utils/privacy.js";


function hash(value = "") {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function maskIP(ip = "") {
  if (!ip) return "";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.x.x`;
  }
  return "masked";
}

function getClientMeta(req) {
  return {
    ip:
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      null,
    userAgent: req.headers["user-agent"] || null,
  };
}

dotenv.config();
console.log("🚀 SERVER VERSION: TEST 1 - SAMEER");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const app = express();

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

app.use(helmet());
app.use(morgan("dev"));

const PORT = process.env.PORT || 5175;
const allowedOrigins = [
  "https://trustedlinks.net",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    // دعم Vercel preview domains (مهم)
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Idempotency-Key",
  ],

  credentials: true,

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const isProd = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
  throw new Error("JWT_SECRET is missing or too short");
}

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error("Missing admin credentials");
}

if (!process.env.BASE_URL || !/^https?:\/\//i.test(process.env.BASE_URL)) {
  throw new Error("Missing or invalid BASE_URL");
}


app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(
  morgan(isProd ? "combined" : "dev", {
    skip: (req) => req.path === "/healthz",
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.set("trust proxy", 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
  keyGenerator: (req) =>
    String(req.headers["x-forwarded-for"] || req.ip || "unknown")
      .split(",")[0]
      .trim(),
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many OTP attempts, please try again later.",
  },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin login attempts, please try again later." },
});

const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many tracking requests, please try again later." },
});

app.use("/api", apiLimiter);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/resend-verification", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

app.use("/api/whatsapp/request-otp", otpLimiter);
app.use("/api/whatsapp/verify-otp", otpLimiter);

app.use("/api/admin/login", adminLimiter);
app.use("/api/admin", (req, res, next) => {
  if (req.path === "/login") return next();
  return adminApiLimiter(req, res, next);
});

app.use("/api/track-click", trackingLimiter);
app.use("/api/track-whatsapp", trackingLimiter);
app.use("/api/track-media", trackingLimiter);

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many lead requests, please try again later.",
});

app.use("/l", leadLimiter);

const adminApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests, please try again later." },
});

app.use("/api/admin", adminApiLimiter);

const getIP = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  null;

const DAILY_LIMIT = new Map();

function incrementDailyLimit(key, limit = 50) {
  const now = Date.now();
  const day = Math.floor(now / (1000 * 60 * 60 * 24));

  const data = DAILY_LIMIT.get(key) || { count: 0, day };

  if (data.day !== day) {
    data.count = 0;
    data.day = day;
  }

  data.count++;

  DAILY_LIMIT.set(key, data);

  return data.count > limit;
}

async function beginIdempotentRequest({
  req,
  scope,
  payload,
  ttlHours = 24,
}) {
  const idempotencyKey = req.headers["idempotency-key"];

  if (!idempotencyKey) {
    return {
      ok: false,
      type: "missing_key",
      response: {
        status: 400,
        body: {
          ok: false,
          error: "Missing Idempotency-Key header",
          reason: "MISSING_IDEMPOTENCY_KEY",
        },
      },
    };
  }

  const requestHash = buildRequestHash(payload || {});
  const existing = await getIdempotencyRecord(scope, idempotencyKey);

  if (existing) {
    if (existing.requestHash && existing.requestHash !== requestHash) {
      return {
        ok: false,
        type: "hash_mismatch",
        response: {
          status: 409,
          body: {
            ok: false,
            error: "Idempotency-Key was already used with different payload.",
            reason: "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD",
          },
        },
      };
    }

    if (existing.status === "completed") {
      return {
        ok: false,
        type: "replay",
        response: {
          status: existing.responseCode || 200,
          body: existing.responseBody || {
            ok: true,
            replayed: true,
          },
        },
      };
    }

    return {
      ok: false,
      type: "still_processing",
      response: {
        status: 409,
        body: {
          ok: false,
          error: "Request with this Idempotency-Key is already processing.",
          reason: "IDEMPOTENT_REQUEST_IN_PROGRESS",
        },
      },
    };
  }

  await createIdempotencyRecord({
    scope,
    idempotencyKey,
    requestHash,
    ttlHours,
  });

  return {
    ok: true,
    idempotencyKey,
    scope,
    requestHash,
  };
}
// =========================
// MEMORY (instead of Mongo sessions)
// =========================
const PENDING_NEARBY_REQUESTS = new Map();
const PENDING_REFINEMENT_REQUESTS = new Map();

// =========================
// CONFIG
// =========================
const EVENT_COSTS = {
  click: 0.01,
  whatsapp: 0.25,
  media: 0.02,
  view: 0,
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);


// =========================
// HELPERS
// =========================

function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("Invalid JWT_SECRET");
}

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

function safeString(v) {
  return String(v || "").trim().slice(0, 500);
}
// =========================
// AUTH MIDDLEWARE
// =========================

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

// =========================
// UTILS
// =========================

function toSafeCategoryValue(cat) {
  if (!cat) return "";
  if (Array.isArray(cat)) return cat.join(", ");
  if (typeof cat === "string") return cat;
  if (typeof cat === "object") return cat?.name || cat?.key || "";
  return String(cat);
}

async function getUserOr404(userId, res) {
  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return null;
  }
  return user;
}

// =========================
// NEARBY MEMORY (NO MONGO)
// =========================

function setPendingNearby(from, data = {}) {
  PENDING_NEARBY_REQUESTS.set(from, {
    category: data.category || "",
    rawQuery: data.rawQuery || "",
    createdAt: Date.now(),
  });
}

function getPendingNearby(from) {
  const item = PENDING_NEARBY_REQUESTS.get(from);
  if (!item) return null;

  if (Date.now() - item.createdAt > 10 * 60 * 1000) {
    PENDING_NEARBY_REQUESTS.delete(from);
    return null;
  }

  return item;
}

function clearPendingNearby(from) {
  PENDING_NEARBY_REQUESTS.delete(from);
}

const CLICK_GUARD = new Map();
const LEAD_GUARD = new Map();

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function makeGuardKey({ businessId, ip, action }) {
  return `${action}:${businessId}:${ip}`;
}

function isWithinCooldown(map, key, cooldownMs) {
  const now = Date.now();
  const last = map.get(key) || 0;

  if (now - last < cooldownMs) {
    return true;
  }

  map.set(key, now);
  return false;
}

function cleanupGuardMap(map, olderThanMs = 60 * 60 * 1000) {
  const now = Date.now();
  for (const [key, ts] of map.entries()) {
    if (now - ts > olderThanMs) {
      map.delete(key);
    }
  }
}

setInterval(() => {
  cleanupGuardMap(CLICK_GUARD);
  cleanupGuardMap(LEAD_GUARD);
}, 30 * 60 * 1000);

// =========================
// REFINEMENT MEMORY
// =========================

function getRefinementQuestions(lang = "ar") {
  return [
    {
      key: "preference",
      text:
        lang === "ar"
          ? "ماذا تفضل بالتحديد؟"
          : "What exactly do you prefer?",
    },
    {
      key: "area",
      text:
        lang === "ar"
          ? "في أي منطقة؟"
          : "Which area?",
    },
    {
      key: "priority",
      text:
        lang === "ar"
          ? "هل تريد خيارًا اقتصاديًا أم الأفضل تقييمًا؟"
          : "Do you want a budget option or top-rated?",
    },
  ];
}

function setPendingRefinement(from, data = {}) {
  PENDING_REFINEMENT_REQUESTS.set(from, {
    query: data.query || "",
    lang: data.lang || "ar",
    answers: {
      preference: data.answers?.preference || "",
      area: data.answers?.area || "",
      priority: data.answers?.priority || "",
    },
    step: Number(data.step || 0),
    createdAt: Date.now(),
  });
}

function getPendingRefinement(from) {
  const item = PENDING_REFINEMENT_REQUESTS.get(from);
  if (!item) return null;

  if (Date.now() - item.createdAt > 15 * 60 * 1000) {
    PENDING_REFINEMENT_REQUESTS.delete(from);
    return null;
  }

  return item;
}

function clearPendingRefinement(from) {
  PENDING_REFINEMENT_REQUESTS.delete(from);
}

function getCurrentRefinementQuestion(session) {
  if (!session) return null;

  const questions = getRefinementQuestions(session.lang || "ar");
  return questions[session.step] || null;
}

function saveRefinementAnswer(session, answer = "") {
  if (!session) return null;

  const questions = getRefinementQuestions(session.lang || "ar");
  const currentQuestion = questions[session.step];

  if (!currentQuestion) return session;

  const cleanAnswer = String(answer || "").trim();

  const nextAnswers = {
    ...session.answers,
    [currentQuestion.key]: cleanAnswer,
  };

  return {
    ...session,
    answers: nextAnswers,
    step: session.step + 1,
    createdAt: Date.now(),
  };
}

function isRefinementComplete(session) {
  if (!session) return false;
  return (
    String(session.answers?.preference || "").trim() &&
    String(session.answers?.area || "").trim() &&
    String(session.answers?.priority || "").trim()
  );
}

function formatSingleRefinementQuestion(session) {
  const question = getCurrentRefinementQuestion(session);
  const lang = session?.lang || "ar";

  if (!question) {
    return lang === "ar"
      ? "شكرًا، سأعرض لك النتائج الآن."
      : "Thanks, I’ll show you the results now.";
  }

  return `${session.step + 1}) ${question.text}`;
}
// =========================
// SEARCH HELPERS (NO CACHE NOW)
// =========================


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

async function createLeadTrackedLink({
  businessId = "",
  phone = "",
  query = "",
  userPhone = "",
}) {
  const safePhone = String(phone || "").replace(/\D/g, "");
  const safeBusinessId = String(businessId || "").trim();
  const safeUserPhone = String(userPhone || "").replace(/\D/g, "");
  const safeQuery = String(query || "").trim();

  if (!safePhone || !safeBusinessId) return "";

  const token = await createLeadToken({
    businessId: safeBusinessId,
    businessPhone: safePhone,
    userPhone: safeUserPhone,
    query: safeQuery,
  });

  const tokenId = token?.id || token?._id?.toString();
  const baseUrl = String(process.env.BASE_URL || "").trim().replace(/\/+$/, "");

  if (!tokenId || !baseUrl) {
    console.error("Failed to create tracked link", {
      hasToken: !!token,
      tokenId,
      baseUrl,
      businessId: safeBusinessId,
    });
    return "";
  }

  return `${baseUrl}/l/${tokenId}`;
}

async function enrichBusinessesWithTrackedLinks({
  items = [],
  query = "",
  userPhone = "",
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return await Promise.all(
    safeItems.map(async (item) => ({
      ...item,
      trackedLink: await createLeadTrackedLink({
        businessId: item.id,
        phone: item.whatsapp,
        query,
        userPhone,
      }),
    }))
  );
}
// =========================
// Business Activity Log
// =========================
async function logBusinessEvent({
  businessId,
  ownerUserId,
  type,
  source = "",
  meta = {},
}) {
  try {
    await createBusinessEvent({
      businessId,
      ownerUserId: String(ownerUserId || ""),
      type,
      source,
      meta,
    });
  } catch (e) {
    console.error("logBusinessEvent error:", e);
  }
}

// =========================
// Business Owner Info
// =========================
async function getBusinessOwnerInfo(businessId) {
  const business = await getBusinessById(businessId);
  if (!business) return null;

  return {
    businessId: business.id,
    ownerUserId: String(business.ownerUserId || ""),
    business,
  };
}

// =========================
// Deduct From Business Wallet
// =========================
async function deductWalletBalance({
  ownerUserId,
  businessId = null,
  eventType,
  reason,
  reference = "",
  meta = {},
}) {
  try {
    const amount = Number(EVENT_COSTS[eventType] || 0);

    if (!amount || amount <= 0) {
      return { ok: true, skipped: true, reason: "No charge for this event" };
    }

    if (!businessId) {
      return { ok: false, error: "businessId required" };
    }

    const result = await deductBusinessWallet({
      businessId,
      amount,
      eventType,
      note: reason,
      meta: {
        ...meta,
        reference,
        ownerUserId,
      },
    });

    return {
      ok: true,
      amount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      currency: result.currency,
      isNegative: Number(result.balanceAfter) < 0,
    };
  } catch (e) {
    if (e.message === "INSUFFICIENT_BALANCE") {
      return {
        ok: false,
        insufficient: true,
        balanceBefore: 0,
        balanceAfter: 0,
      };
    }

    console.error("deductWalletBalance error:", e);
    return { ok: false, error: "Deduction failed" };
  }
}

// =========================
// Credit Business Wallet
// =========================
async function creditWalletBalance({
  businessId,
  amount,
  reason = "Wallet top up",
  reference = "",
  notes = "",
  meta = {},
}) {
  try {
    if (!businessId) {
      return { ok: false, error: "businessId required" };
    }

    const result = await topupBusinessWallet({
      businessId,
      amount: Number(amount),
      note: reason || notes || "Wallet top up",
      meta: {
        ...meta,
        reference,
      },
    });

    return {
      ok: true,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      currency: result.currency || "USD",
    };
  } catch (e) {
    console.error("creditWalletBalance error:", e);
    return { ok: false, error: "Failed to credit wallet" };
  }
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
    origin: [
      "https://trustedlinks.net",
      "https://www.trustedlinks.net",
      "http://localhost:5173",
    ],
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

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

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
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    throw new Error(`Resend failed (${r.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// JAVNA Config
// ---------------------------------------------------------------------------
const JAVNA_API_KEY = (process.env.JAVNA_API_KEY || "").trim();
const JAVNA_FROM = (process.env.JAVNA_FROM || "").trim();
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
  const toNumber = String(to || "").startsWith("+") ? String(to) : `+${to}`;

  const payload = {
    from,
    to: toNumber,
    content: {
      text: String(body || ""),
    },
  };

  const r = await fetch(JAVNA_SEND_TEXT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const txt = await r.text();

  if (!r.ok) {
    throw new Error(`Javna send failed (${r.status}): ${txt}`);
  }

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
  const toNumber = String(to || "").startsWith("+") ? String(to) : `+${to}`;

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

  if (!r.ok) {
    throw new Error(`Javna auth template failed (${r.status}): ${txt}`);
  }

  return JSON.parse(txt);
}

// ============================================================================
// Health
// ============================================================================
app.get("/", (_req, res) => res.status(200).send("OK"));
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/api/test", (_req, res) =>
  res.json({ ok: true, message: "✅ Backend is reachable" })
);
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    javnaKeyLoaded: Boolean(process.env.JAVNA_API_KEY),
    resendKeyLoaded: Boolean(process.env.RESEND_API_KEY),
    mailFrom: process.env.MAIL_FROM || null,
  });
});

// ============================================================================
// AUTH (Signup/Login + Email + Reset Password)
// ============================================================================

// =========================
// SIGNUP
// =========================
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, business } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!business) {
      return res.status(400).json({ error: "Business data is required" });
    }

    const emailNorm = String(email).trim().toLowerCase();

    const existingUser = await getUserByEmail(emailNorm);
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const existingBusiness = await getBusinessByWhatsapp(business.whatsapp);
    if (existingBusiness) {
      return res
        .status(409)
        .json({ error: "This WhatsApp number is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const user = await createUser({
      email: emailNorm,
      passwordHash,
      emailVerified: false,
      verifyToken,
      walletBalance: 5,
      currency: "USD",
      freeCreditGranted: true,
    });

    const createdBusiness = await createBusiness({
      ownerUserId: user.id,
      name: business.name || "",
      name_ar: business.name_ar || "",
      description: business.description || "",
      description_ar: business.description_ar || "",
      category: Array.isArray(business.category) ? business.category : [],
      keywords: Array.isArray(business.keywords) ? business.keywords : [],
      keywords_ar: Array.isArray(business.keywords_ar)
        ? business.keywords_ar
        : [],
      whatsapp: business.whatsapp || "",
      status: "Active",
      latitude: typeof business.latitude === "number" ? business.latitude : null,
      longitude:
        typeof business.longitude === "number" ? business.longitude : null,
      mapLink: business.mapLink || "",
      mediaLink: business.mediaLink || "",
      logo: business.logo || "",
      locationText: business.locationText || "",
      countryCode: business.countryCode || "",
      countryName: business.countryName || "",
      customId: business.customId || "",

      // Wallet (Business)
      walletBalance: 5,
      walletCurrency: "USD",
      walletStatus: "active",
     walletAllowNegative: true,
      walletNegativeLimit: -5,
      walletLowBalanceThreshold: 5,

      // Billing
      billingClickCost: 0.05,
      billingWhatsappCost: 0.1,
    });

    const verifyUrl =
      `${API_BASE_URL}/api/auth/verify-email` +
      `?email=${encodeURIComponent(emailNorm)}` +
      `&token=${encodeURIComponent(verifyToken)}`;

    try {
      await sendEmail({
        to: emailNorm,
        subject: "Verify your email",
        html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (mailErr) {
      console.error("signup email error:", mailErr);
    }

    return res.status(201).json({
      ok: true,
      userId: user.id,
      businessId: createdBusiness.id,
    });
  } catch (e) {
    console.error("signup error:", e);
    return res.status(500).json({ error: "Signup failed" });
  }
});

// =========================
// LOGIN
// =========================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailNorm = String(email || "").toLowerCase().trim();

    const user = await getUserByEmail(emailNorm);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const token = signUserToken(String(user.id));

    return res.json({
      ok: true,
      token,
      email: user.email,
      walletBalance: user.walletBalance,
      currency: user.currency,
    });
  } catch (e) {
    console.error("login error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// =========================
// VERIFY EMAIL
// =========================
app.get("/api/auth/verify-email", async (req, res) => {
  try {
    const { email, token } = req.query || {};
    if (!email || !token) return res.status(400).send("Missing email/token");

    const emailNorm = String(email).toLowerCase().trim();

    const existingUser = await getUserByEmail(emailNorm);
    if (!existingUser) return res.status(404).send("User not found");

    if (existingUser.emailVerified) {
      return res.redirect(`${FRONTEND_BASE_URL}/login?verified=1`);
    }

    const verifiedUser = await verifyUserEmail(emailNorm, token);
    if (!verifiedUser) {
      return res.status(401).send("Invalid token");
    }

    return res.redirect(`${FRONTEND_BASE_URL}/login?verified=1`);
  } catch (e) {
    console.error("verify-email error", e);
    return res.status(500).send("Verification failed");
  }
});

// =========================
// RESEND VERIFICATION
// =========================
app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const emailNorm = String(req.body?.email || "").toLowerCase().trim();

    const user = await getUserByEmail(emailNorm);
    if (!user) return res.status(404).json({ error: "Email not found" });

    if (user.emailVerified) {
      return res.json({ ok: true });
    }

    const verifyToken = user.verifyToken || nanoid(32);
    await setVerifyToken(user.id, verifyToken);

    const verifyUrl =
      `${API_BASE_URL}/api/auth/verify-email` +
      `?email=${encodeURIComponent(emailNorm)}` +
      `&token=${encodeURIComponent(verifyToken)}`;

    await sendEmail({
      to: emailNorm,
      subject: "Verify your email",
      html: `<p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("resend-verification error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// =========================
// RESET PASSWORD
// =========================
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};

    const user = await getUserByEmail(String(email).toLowerCase().trim());
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.resetToken || !user.resetTokenExpiresAt) {
      return res.status(400).json({ error: "Invalid token" });
    }

    if (user.resetToken !== token) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (new Date(user.resetTokenExpiresAt) < new Date()) {
      return res.status(410).json({ error: "Expired token" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user.id, hash);

    return res.json({ ok: true });
  } catch (e) {
    console.error("reset-password error", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// =========================
// CURRENT USER
// =========================
app.get("/api/me", requireUser, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      ok: true,
      id: user.id,
      email: user.email,
      walletBalance: user.walletBalance ?? 0,
      currency: user.currency || "USD",
      subscriptionPlan: user.subscriptionPlan || null,
    });
  } catch (e) {
    console.error("/api/me error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// ============================================================================
// WhatsApp OTP
// ============================================================================

// =========================
// REQUEST OTP
// =========================
const OTP_EXPIRES_SECONDS = 5 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

app.post("/api/whatsapp/request-otp", async (req, res) => {
  try {
    const { whatsapp } = req.body || {};

    if (!whatsapp) {
      return res.status(400).json({
        ok: false,
        error: "WhatsApp number missing",
      });
    }

    const clean = cleanDigits(whatsapp);

    if (!/^\d{10,15}$/.test(clean)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid WhatsApp number",
      });
    }

    const existingBusiness = await getBusinessByWhatsapp(clean);
    if (existingBusiness) {
      return res.status(409).json({
        ok: false,
        error: "This WhatsApp number is already registered.",
        reason: "WHATSAPP_ALREADY_REGISTERED",
      });
    }

    const { ip, userAgent } = getClientMeta(req);

    // Check cooldown before generating a new OTP
    const existingOtp = await getOtp(clean, "business_signup");
    const otpCreatedAt = existingOtp?.createdAt || existingOtp?.created_at;

    if (otpCreatedAt) {
      const createdAtMs = new Date(otpCreatedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - createdAtMs) / 1000);
      const retryAfter = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;

      if (retryAfter > 0) {
        await logEvent({
          event: "otp_request_cooldown_blocked",
          level: "warn",
          whatsapp: clean,
          ip,
          userAgent,
          meta: { retryAfter },
        });

        return res.status(429).json({
          ok: false,
          error: "Please wait before requesting a new OTP.",
          reason: "OTP_COOLDOWN",
          retryAfter,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await deleteOtpByWhatsappPurpose(clean, "business_signup");

    await createOtp({
      whatsapp: clean,
      code: otp,
      purpose: "business_signup",
      expiresAt: new Date(Date.now() + OTP_EXPIRES_SECONDS * 1000),
    });

    // Development fallback if JAVNA is not configured
    if (!JAVNA_API_KEY || !JAVNA_FROM) {
      await logEvent({
        event: "otp_request_success",
        level: "info",
        whatsapp: clean,
        ip,
        userAgent,
        meta: { provider: "mock" },
      });

      return res.json({
        ok: true,
        success: true,
        message: "OTP generated (mock).",
        devOtp: otp,
        expiresIn: OTP_EXPIRES_SECONDS,
        retryAfter: OTP_RESEND_COOLDOWN_SECONDS,
      });
    }

    const javnaResp = await javnaSendOtpTemplate({
      to: `+${clean}`,
      code: otp,
      lang: "en",
    });

    if (javnaResp?.stats?.rejected === "1") {
      await logEvent({
        event: "otp_request_rejected",
        level: "warn",
        whatsapp: clean,
        ip,
        userAgent,
        meta: { javna: javnaResp },
      });

      return res.status(400).json({
        ok: false,
        error: "Javna rejected template",
        javna: javnaResp,
      });
    }

    await logEvent({
      event: "otp_request_success",
      level: "info",
      whatsapp: clean,
      ip,
      userAgent,
      meta: { provider: "javna" },
    });

    return res.json({
      ok: true,
      success: true,
      message: "OTP sent.",
      expiresIn: OTP_EXPIRES_SECONDS,
      retryAfter: OTP_RESEND_COOLDOWN_SECONDS,
      javna: javnaResp,
    });
  } catch (e) {
    console.error("request-otp error:", e);
    return res.status(500).json({
      ok: false,
      error: "Failed to send OTP",
    });
  }
});

// =========================
// VERIFY OTP
// =========================

const OTP_MAX_VERIFY_ATTEMPTS = 5;

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

    const existingBusiness = await getBusinessByWhatsapp(clean);
    if (existingBusiness) {
      return res.status(409).json({
        ok: false,
        error: "This WhatsApp number is already registered.",
        reason: "WHATSAPP_ALREADY_REGISTERED",
      });
    }

    const { ip, userAgent } = getClientMeta(req);

    const rec = await getOtp(clean, "business_signup");

    if (!rec) {
      await logEvent({
        event: "otp_verify_no_otp",
        level: "warn",
        whatsapp: clean,
        ip,
        userAgent,
      });

      return res.status(404).json({
        ok: false,
        error: "No OTP found.",
        reason: "NO_OTP",
      });
    }

    if (rec.blockedAt) {
      await logEvent({
        event: "otp_verify_blocked",
        level: "error",
        whatsapp: clean,
        ip,
        userAgent,
        meta: {
          attempts: rec.attempts || 0,
        },
      });

      return res.status(423).json({
        ok: false,
        error: "OTP is blocked due to too many failed attempts.",
        reason: "OTP_BLOCKED",
      });
    }

    if (!rec.expiresAt || rec.expiresAt.getTime() < Date.now()) {
      await logEvent({
        event: "otp_verify_expired",
        level: "warn",
        whatsapp: clean,
        ip,
        userAgent,
      });

      return res.status(410).json({
        ok: false,
        error: "OTP expired.",
        reason: "EXPIRED",
      });
    }

    if (String(rec.code) !== String(code)) {
      const updatedOtp = await incrementOtpAttempts(rec.id);
      const attempts = Number(updatedOtp?.attempts || 0);
      const remainingAttempts = Math.max(0, OTP_MAX_VERIFY_ATTEMPTS - attempts);

      if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
        await blockOtp(rec.id);

        await logEvent({
          event: "otp_verify_blocked",
          level: "error",
          whatsapp: clean,
          ip,
          userAgent,
          meta: {
            attempts,
            reason: "max_attempts_reached",
          },
        });

        return res.status(423).json({
          ok: false,
          error: "OTP blocked due to too many failed attempts.",
          reason: "OTP_BLOCKED",
          attempts,
          remainingAttempts: 0,
        });
      }

      await logEvent({
        event: "otp_verify_bad_code",
        level: "warn",
        whatsapp: clean,
        ip,
        userAgent,
        meta: {
          attempts,
          remainingAttempts,
        },
      });

      return res.status(401).json({
        ok: false,
        error: "Invalid OTP code.",
        reason: "BAD_CODE",
        attempts,
        remainingAttempts,
      });
    }

    await consumeOtp(rec.id);

    const token = jwt.sign(
      {
        whatsapp: clean,
        purpose: "business_signup",
        verified: true,
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    await logEvent({
      event: "otp_verify_success",
      level: "info",
      whatsapp: clean,
      ip,
      userAgent,
    });

    return res.json({
      ok: true,
      message: "OTP verified ✅",
      token,
      whatsapp: clean,
      whatsappLink: `https://wa.me/${clean}`,
    });
  } catch (e) {
    console.error("verify-otp error:", e);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
});
// =========================
// CREATE BUSINESS TOPUP ORDER
// =========================
app.post("/api/payments/create-topup-order", requireUser, async (req, res) => {
  try {
    const amount = Number(req.body?.amount || 0);
    const businessId = String(req.body?.businessId || "").trim();

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        error: "businessId required",
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Invalid amount",
      });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "User not found",
      });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({
        ok: false,
        error: "Business not found",
      });
    }

    if (
      business.ownerUserId &&
      String(business.ownerUserId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized business",
      });
    }

    const MAX_TOPUP_LIMIT = 20;
    const requestedAmount = Number(amount);
    const currentBalance = Number(business?.wallet?.balance || 0);

    const pendingOrders = await getPendingTopupOrders(businessId);
    const pendingTotal = pendingOrders.reduce(
      (sum, order) => sum + Number(order.amount || 0),
      0
    );

    const remainingAllowed = Math.max(
      0,
      MAX_TOPUP_LIMIT - currentBalance - pendingTotal
    );

    if (requestedAmount > remainingAllowed) {
      await logEvent({
        event: "topup_limit_blocked",
        level: "warn",
        userId: user.id,
        businessId: business.id,
        meta: {
          requestedAmount,
          currentBalance,
          pendingTotal,
          limit: MAX_TOPUP_LIMIT,
          remainingAllowed,
        },
      });

      return res.status(400).json({
        ok: false,
        error: "Top-up limit exceeded for trial mode.",
        reason: "TOPUP_LIMIT_EXCEEDED",
        limit: MAX_TOPUP_LIMIT,
        currentBalance,
        pendingTotal,
        requestedAmount,
        remainingAllowed,
      });
    }

    const order = await createTopupOrder({
      businessId: business.id,
      userId: user.id,
      amount: requestedAmount,
      currency: business.wallet?.currency || "USD",
      reference: `topup_order_${Date.now()}`,
    });

    await logEvent({
      event: "topup_order_created",
      level: "info",
      userId: user.id,
      businessId: business.id,
      meta: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        currentBalance,
        pendingTotal,
        remainingAllowedAfterCreate: Math.max(
          0,
          MAX_TOPUP_LIMIT - currentBalance - pendingTotal - requestedAmount
        ),
      },
    });

    return res.json({
      ok: true,
      orderId: order.id,
      businessId: order.businessId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      reference: order.reference,
      trialLimit: MAX_TOPUP_LIMIT,
      remainingAllowed: Math.max(
        0,
        MAX_TOPUP_LIMIT - currentBalance - pendingTotal - requestedAmount
      ),
    });
  } catch (e) {
    console.error("create-topup-order error:", e);

    await logEvent({
      event: "topup_order_create_failed",
      level: "error",
      userId: req.user?.id,
      businessId: String(req.body?.businessId || "").trim() || null,
      meta: {
        amount: Number(req.body?.amount || 0),
        error: e.message,
      },
    });

    return res.status(500).json({
      ok: false,
      error: "Failed to create topup order",
    });
  }
});

// =========================
// MANUAL BUSINESS WALLET TOPUP
// =========================
app.post("/api/business/topup", requireUser, async (req, res) => {
  try {
    const businessId = String(req.body?.businessId || "").trim();
    const amount = Number(req.body?.amount || 0);

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        error: "businessId required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Invalid amount",
      });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({
        ok: false,
        error: "Business not found",
      });
    }

    if (
      business.ownerUserId &&
      String(business.ownerUserId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized business",
      });
    }

    const result = await topupBusinessWallet({
      businessId,
      amount,
      note: "Manual topup",
    });

    return res.json({
      ok: true,
      balance: result.balanceAfter,
      currency: result.currency || "USD",
      transaction: result.transaction || null,
    });
  } catch (e) {
    console.error("business topup error:", e);
    return res.status(400).json({
      ok: false,
      error: e.message || "Failed to top up business wallet",
    });
  }
});

// =========================
// GET BUSINESS TOPUP ORDER
// =========================
app.get("/api/payments/topup-orders/:id", requireUser, async (req, res) => {
  try {
    const order = await getTopupOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: "Order not found",
      });
    }

    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    return res.json({
      ok: true,
      order,
    });
  } catch (e) {
    console.error("get-topup-order error:", e);
    return res.status(500).json({
      ok: false,
      error: "Failed to load order",
    });
  }
});

// =========================
// CONFIRM BUSINESS TOPUP ORDER
// =========================
// =========================
// CONFIRM BUSINESS TOPUP ORDER
// =========================
app.post("/api/payments/confirm-topup-order", requireUser, async (req, res) => {
  try {
    const orderId = String(req.body?.orderId || "").trim();

    if (!orderId) {
      return res.status(400).json({
        ok: false,
        error: "orderId required",
      });
    }

    const idem = await beginIdempotentRequest({
      req,
      scope: "confirm_topup_order",
      payload: {
        orderId,
        userId: req.user.id,
      },
    });

    if (!idem.ok) {
      await logEvent({
        event: "topup_confirm_idempotency_blocked",
        level: "warn",
        userId: req.user.id,
        meta: {
          orderId,
          type: idem.type,
          status: idem.response?.status,
          reason: idem.response?.body?.reason || null,
        },
      });

      return res.status(idem.response.status).json(idem.response.body);
    }

    const order = await getTopupOrderById(orderId);

    if (!order) {
      await logEvent({
        event: "topup_confirm_order_not_found",
        level: "warn",
        userId: req.user.id,
        meta: {
          orderId,
        },
      });

      return res.status(404).json({
        ok: false,
        error: "Order not found",
      });
    }

    if (String(order.userId) !== String(req.user.id)) {
      await logEvent({
        event: "topup_confirm_unauthorized",
        level: "warn",
        userId: req.user.id,
        businessId: order.businessId,
        meta: {
          orderId: order.id,
          ownerUserId: order.userId,
        },
      });

      return res.status(403).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    if (order.status === "paid") {
      const business = await getBusinessById(order.businessId);

      const responseBody = {
        ok: true,
        alreadyPaid: true,
        balance: business?.wallet?.balance || 0,
        currency: business?.wallet?.currency || "USD",
        orderId: order.id,
      };

      await logEvent({
        event: "topup_already_paid",
        level: "info",
        userId: req.user.id,
        businessId: order.businessId,
        meta: {
          orderId: order.id,
        },
      });

      await completeIdempotencyRecord({
        scope: "confirm_topup_order",
        idempotencyKey: idem.idempotencyKey,
        responseCode: 200,
        responseBody,
      });

      return res.json(responseBody);
    }

    if (order.status !== "pending") {
      await logEvent({
        event: "topup_confirm_not_payable",
        level: "warn",
        userId: req.user.id,
        businessId: order.businessId,
        meta: {
          orderId: order.id,
          status: order.status,
        },
      });

      return res.status(400).json({
        ok: false,
        error: "Order is not payable",
      });
    }

    await logEvent({
      event: "topup_confirm_started",
      level: "info",
      userId: req.user.id,
      businessId: order.businessId,
      meta: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency || "USD",
        paymentMethod: order.paymentMethod || null,
      },
    });

    const result = await topupBusinessWallet({
      businessId: order.businessId,
      amount: order.amount,
      note: "Topup via order",
      meta: {
        orderId: order.id,
        paymentMethod: order.paymentMethod,
      },
    });

    await markTopupOrderPaid(order.id);

    const responseBody = {
      ok: true,
      balance: result.balanceAfter,
      currency: result.currency || "USD",
      orderId: order.id,
    };

    await logEvent({
      event: "topup_confirmed",
      level: "info",
      userId: req.user.id,
      businessId: order.businessId,
      meta: {
        orderId: order.id,
        amount: order.amount,
        balanceAfter: result.balanceAfter,
        currency: result.currency || "USD",
      },
    });

    await completeIdempotencyRecord({
      scope: "confirm_topup_order",
      idempotencyKey: idem.idempotencyKey,
      responseCode: 200,
      responseBody,
    });

    return res.json(responseBody);
  } catch (e) {
    console.error("confirm-topup-order error:", e);

    await logEvent({
      event: "topup_confirm_failed",
      level: "error",
      userId: req.user?.id,
      meta: {
        orderId: String(req.body?.orderId || "").trim() || null,
        error: e.message,
      },
    });

    return res.status(500).json({
      ok: false,
      error: "Failed to confirm payment",
    });
  }
});

// ============================================================================
// USER BUSINESS
// ============================================================================

// =========================
// GET CURRENT USER BUSINESS
// =========================
app.get("/api/business/me", requireUser, async (req, res) => {
  try {
    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }
    
    const formatted = {
      ...business,

      wallet_balance: Number(business?.wallet?.balance ?? 0),
      wallet_currency: business?.wallet?.currency || "USD",
      wallet_status: business?.wallet?.status || "active",

      logo:
        business.logo ||
        (business.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(String(business.mediaLink))
          ? business.mediaLink
          : null),

      whatsappLink: business.whatsapp
        ? `https://wa.me/${String(business.whatsapp).replace(/\D/g, "")}`
        : null,
    };

    return res.json(formatted);
  } catch (e) {
    console.error("business/me error:", e);
    return res.status(500).json({ error: "Failed to load business" });
  }
});

// =========================
// UPDATE CURRENT USER BUSINESS
// =========================
app.put("/api/business/update", requireUser, async (req, res) => {
  try {
    const existing = await getBusinessByOwnerUserId(String(req.user.id));
    if (!existing) {
      return res.status(404).json({ error: "Business not found" });
    }

    const payload = {
      name: req.body.name,
      name_ar: req.body.name_ar,
      description: req.body.description,
      description_ar: req.body.description_ar,
      keywords: Array.isArray(req.body.keywords) ? req.body.keywords : [],
      keywords_ar: Array.isArray(req.body.keywords_ar) ? req.body.keywords_ar : [],
      category: Array.isArray(req.body.category) ? req.body.category : [],
      whatsapp: req.body.whatsapp,
      mediaLink: req.body.mediaLink,
      logo: req.body.logo,
      locationText: req.body.locationText,
      countryCode: req.body.countryCode,
      countryName: req.body.countryName,
    };

    const lang = String(req.body?.lang || "en").toLowerCase();

    // =========================
    // Auto translation between EN <-> AR
    // =========================
    if (lang === "ar") {
      const sourceDescription = String(payload.description_ar || "").trim();
      const sourceKeywords = Array.isArray(payload.keywords_ar)
        ? payload.keywords_ar.map((k) => String(k).trim()).filter(Boolean)
        : [];

      if (sourceDescription || sourceKeywords.length) {
        const translated = await translateBusinessContent({
          description: sourceDescription,
          keywords: sourceKeywords,
          sourceLang: "ar",
        });

        if (translated) {
          payload.description_ar = translated.description_ar || sourceDescription;
          payload.description = translated.description_en || payload.description || "";
          payload.keywords_ar = Array.isArray(translated.keywords_ar)
            ? translated.keywords_ar
            : sourceKeywords;
          payload.keywords = Array.isArray(translated.keywords_en)
            ? translated.keywords_en
            : payload.keywords || [];
        }
      }
    } else {
      const sourceDescription = String(payload.description || "").trim();
      const sourceKeywords = Array.isArray(payload.keywords)
        ? payload.keywords.map((k) => String(k).trim()).filter(Boolean)
        : [];

      if (sourceDescription || sourceKeywords.length) {
        const translated = await translateBusinessContent({
          description: sourceDescription,
          keywords: sourceKeywords,
          sourceLang: "en",
        });

        if (translated) {
          payload.description = translated.description_en || sourceDescription;
          payload.description_ar = translated.description_ar || payload.description_ar || "";
          payload.keywords = Array.isArray(translated.keywords_en)
            ? translated.keywords_en
            : sourceKeywords;
          payload.keywords_ar = Array.isArray(translated.keywords_ar)
            ? translated.keywords_ar
            : payload.keywords_ar || [];
        }
      }
    }

    const updated = await updateBusinessByOwnerUserId(String(req.user.id), payload);

    const formatted = {
      ...updated,
      logo:
        updated.logo ||
        (updated.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(String(updated.mediaLink))
          ? updated.mediaLink
          : null),
      whatsappLink: updated.whatsapp
        ? `https://wa.me/${String(updated.whatsapp).replace(/\D/g, "")}`
        : null,
    };

    return res.json({
      ok: true,
      business: formatted,
    });
  } catch (e) {
    console.error("update business error:", e);
    return res.status(500).json({ error: "Update failed" });
  }
});
// =========================
// BUSINESS REPORTS
// =========================
app.get("/api/business/reports", requireUser, async (req, res) => {
  try {
    const userId = String(req.user.id);

    const business = await getBusinessByOwnerUserId(userId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const businessId = String(business.id);

    // =========================
    // Fetch all clicks
    // =========================
    const { data: clicks } = await supabase
      .from("lead_clicks")
      .select("*")
      .eq("business_id", businessId)
      .order("clicked_at", { ascending: true });

    const safeClicks = Array.isArray(clicks) ? clicks : [];

    // =========================
    // TOTALS
    // =========================
    const totalClicks = safeClicks.length;
    const totalMessages = totalClicks; // currently same
    const views = totalClicks;

    // =========================
    // ACTIVITY (daily)
    // =========================
    const activityMap = {};

    safeClicks.forEach((c) => {
      const date = new Date(c.clicked_at).toISOString().slice(0, 10);

      if (!activityMap[date]) {
        activityMap[date] = {
          date,
          total: 0,
          whatsapp: 0,
          media: 0,
          messages: 0,
          views: 0,
        };
      }

      activityMap[date].total += 1;
      activityMap[date].whatsapp += 1;
      activityMap[date].messages += 1;
      activityMap[date].views += 1;
    });

    const activity = Object.values(activityMap);

    // =========================
    // HOURLY TREND
    // =========================
    const hourlyMap = {};

    safeClicks.forEach((c) => {
      const hour = new Date(c.clicked_at).getHours();

      if (!hourlyMap[hour]) {
        hourlyMap[hour] = { hour, count: 0 };
      }

      hourlyMap[hour].count += 1;
    });

    const hourly = Object.values(hourlyMap);

    const peakHour =
      hourly.length > 0
        ? hourly.reduce((a, b) => (b.count > a.count ? b : a)).hour
        : null;

    // =========================
    // SOURCES (basic)
    // =========================
    const sources = [
      {
        name: "WhatsApp",
        value: totalClicks,
      },
    ];

    // =========================
    // KEYWORDS (from query)
    // =========================
    const keywordMap = {};

    safeClicks.forEach((c) => {
      const q = (c.query || "").toLowerCase().trim();
      if (!q) return;

      if (!keywordMap[q]) {
        keywordMap[q] = { keyword: q, searches: 0, clicks: 0 };
      }

      keywordMap[q].searches += 1;
      keywordMap[q].clicks += 1;
    });

    const keywords = Object.values(keywordMap);

    // =========================
    // PEAK DAY
    // =========================
    const peakDay =
      activity.length > 0
        ? activity.reduce((a, b) => (b.total > a.total ? b : a)).date
        : null;

    // =========================
    // WEEKLY GROWTH
    // =========================
    const last7 = safeClicks.filter((c) => {
      const d = new Date(c.clicked_at);
      const now = new Date();
      return (now - d) / (1000 * 60 * 60 * 24) <= 7;
    });

    const weeklyGrowth =
      totalClicks > 0
        ? Math.round((last7.length / totalClicks) * 100)
        : 0;

    return res.json({
      business: business.name || "",
      category: business.category || "",
      totalClicks,
      totalMessages,
      weeklyGrowth,
      views,
      mediaViews: 0,
      activity,
      sources,
      keywords,
      hourly,
      peakHour,
      peakDay,
    });
  } catch (e) {
    console.error("REPORTS ERROR:", e);
    return res.status(500).json({ error: "Failed to load reports" });
  }
});
// =========================
// AI OPTIMIZE BUSINESS PROFILE
// =========================
app.post("/api/business/ai-optimize", requireUser, async (req, res) => {
  try {
    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const {
      topSearchKeywords = [],
      lowConversionKeywords = [],
      correctionNotes = "",
      lang = "en",
    } = req.body || {};

    const result = await optimizeBusinessProfile({
      businessName: business.name || "",
      businessNameAr: business.name_ar || "",
      category: Array.isArray(business.category)
        ? business.category.join(", ")
        : toSafeCategoryValue(business.category),
      description:
        lang === "ar"
          ? business.description_ar || business.description || ""
          : business.description || "",
      keywords:
        lang === "ar"
          ? Array.isArray(business.keywords_ar) && business.keywords_ar.length
            ? business.keywords_ar
            : Array.isArray(business.keywords)
            ? business.keywords
            : []
          : Array.isArray(business.keywords)
          ? business.keywords
          : [],
      topSearchKeywords,
      lowConversionKeywords,
      locationText: business.locationText || "",
      countryName: business.countryName || "",
      correctionNotes,
      lang,
    });

    return res.json({
      ok: true,
      businessId: String(business.id),
      result,
    });
  } catch (e) {
    console.error("ai optimize error:", e?.message || e, e);
    return res.status(500).json({
      ok: false,
      error: "AI optimization failed",
    });
  }
});

// =========================
// APPLY AI OPTIMIZATION (Legacy / optional)
// Note:
// Frontend currently applies AI locally to form state,
// then saves through PUT /api/business/update
// =========================
app.post("/api/business/apply-ai-optimization", requireUser, async (req, res) => {
  try {
    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const {
      description = "",
      keywords = [],
      description_ar = "",
      keywords_ar = [],
      lang = "en",
    } = req.body || {};

    const payload = {};

    if (lang === "ar") {
      payload.description_ar = String(description_ar || description || "").trim();
      payload.keywords_ar = Array.isArray(keywords_ar)
        ? keywords_ar.map((k) => String(k).trim()).filter(Boolean)
        : Array.isArray(keywords)
        ? keywords.map((k) => String(k).trim()).filter(Boolean)
        : [];
    } else {
      payload.description = String(description || "").trim();
      payload.keywords = Array.isArray(keywords)
        ? keywords.map((k) => String(k).trim()).filter(Boolean)
        : [];
    }

    const updated = await updateBusinessByOwnerUserId(String(req.user.id), payload);

    const formatted = {
      ...updated,
      logo:
        updated.logo ||
        (updated.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(String(updated.mediaLink))
          ? updated.mediaLink
          : null),
      whatsappLink: updated.whatsapp
        ? `https://wa.me/${String(updated.whatsapp).replace(/\D/g, "")}`
        : null,
    };

    return res.json({
      ok: true,
      business: formatted,
    });
  } catch (e) {
    console.error("apply ai optimization error:", e);
    return res.status(500).json({
      ok: false,
      error: "Update failed",
    });
  }
});

// =========================
// BUSINESS REPORTS
// =========================
app.get("/api/business/reports", requireUser, async (req, res) => {
  try {
    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const commissionPerLead = Number(business.billingWhatsappCost || 0.1);
    const commissionPerClick = Number(business.billingClickCost || 0.01);
    const commissionPerMedia = Number(business.billingMediaCost || 0.02);

    const totalClicks = Number(business.clicksCount || 0);
    const totalMessages = Number(business.messagesCount || 0);
    const mediaViews = Number(business.mediaViewsCount || 0);
    const views = Number(business.viewsCount || 0);

    const estimatedRevenue =
      totalMessages * commissionPerLead +
      totalClicks * commissionPerClick +
      mediaViews * commissionPerMedia;

    return res.json({
      business: business.name || "Business",
      logo:
        business.logo ||
        (business.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(String(business.mediaLink))
          ? business.mediaLink
          : null),
      category: Array.isArray(business.category)
        ? business.category.join(", ")
        : toSafeCategoryValue(business.category) || "Category",

      totalClicks,
      totalMessages,
      mediaViews,
      views,
      weeklyGrowth: 0,

      peakHour: "00",
      peakHourCount: 0,
      peakDay: null,

      activity: [],
      hourly: [],
      keywords: [],

      commission_per_lead: commissionPerLead,
      commission_per_click: commissionPerClick,
      commission_per_media: commissionPerMedia,

      estimated_revenue: Number(estimatedRevenue.toFixed(2)),
      currency: business.walletCurrency || "USD",

      sources: [
        {
          name_en: "WhatsApp",
          name_ar: "واتساب",
          value: Number(business.whatsappClicksCount || 0),
        },
        {
          name_en: "Clicks",
          name_ar: "نقرات",
          value: totalClicks,
        },
        {
          name_en: "Media",
          name_ar: "وسائط",
          value: mediaViews,
        },
        {
          name_en: "Views",
          name_ar: "مشاهدات",
          value: views,
        },
      ],
    });
  } catch (e) {
    console.error("business/reports error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});
// =========================
// BUSINESS BALANCE
// =========================
app.get("/api/business/balance/:businessId", requireUser, async (req, res) => {
  try {
    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (String(business.id) !== String(req.params.businessId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const balance = Number(business.wallet?.balance || 0);
    const currency = business.wallet?.currency || "USD";

    let status = "active";
    if (balance <= 0) status = "out";
    else if (balance < 5) status = "low";

    return res.json({
      ok: true,
      wallet: { balance, currency, status },
    });
  } catch (e) {
    console.error("business balance error:", e);
    return res.status(500).json({ error: "Failed to load business balance" });
  }
});

// =========================
// BUSINESS TRANSACTIONS
// =========================
app.get("/api/business/transactions/:businessId", requireUser, async (req, res) => {
  try {
    const { businessId } = req.params;
    const limit = Math.min(Number(req.query.limit || 10), 100);

    const business = await getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (
      business.ownerUserId &&
      String(business.ownerUserId) !== String(req.user.id)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const transactions = await listBusinessTransactions(business.id, limit);

    return res.json({
      ok: true,
      transactions: transactions.map((tx) => ({
        id: String(tx.id),
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency || "USD",
        reason: tx.reason || "",
        eventType: tx.eventType || "",
        reference: tx.reference || "",
        status: tx.status || "completed",
        balanceBefore: Number(tx.balanceBefore || 0),
        balanceAfter: Number(tx.balanceAfter || 0),
        date: tx.createdAt,
      })),
    });
  } catch (e) {
    console.error("business transactions error:", e?.message, e);
    return res.status(500).json({ error: "Failed to load business transactions" });
  }
});

// =========================
// DIRECT BUSINESS TOPUP
// =========================
app.post("/api/topup", requireUser, async (req, res) => {
  try {
    const amount = Number(req.body?.amount || 0);
    const businessId = String(req.body?.businessId || "").trim();

    if (!businessId) {
      return res.status(400).json({ error: "businessId required" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (
      business.ownerUserId &&
      String(business.ownerUserId) !== String(req.user.id)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const result = await creditWalletBalance({
      businessId: business.id,
      amount,
      reason: "Wallet top up",
      reference: `topup_${Date.now()}`,
    });

    if (!result.ok) {
      return res.status(400).json({
        error: result.error || "Top up failed",
      });
    }

    let status = "active";
    if (result.balanceAfter <= 0) status = "out";
    else if (result.balanceAfter < 5) status = "low";

    return res.json({
      ok: true,
      balance: result.balanceAfter,
      currency: result.currency || "USD",
      status,
    });
  } catch (e) {
    console.error("topup error:", e);
    return res.status(500).json({ error: "Top up failed" });
  }
});

// ============================================================================
// PUBLIC SEARCH + PUBLIC business endpoints
// ============================================================================

// =========================
// SEARCH API
// =========================
app.get("/api/search", async (req, res) => {
  try {
    const {
      query = "",
      lang = "ar",
    } = req.query;

    const searchData = await searchBusinesses({
      query: String(query || "").trim(),
      lang: String(lang || "ar").trim(),
    });

    return res.json(searchData);
  } catch (e) {
    console.error("/api/search error", e);
    return res.status(500).json({
      ok: false,
      error: "Failed to search",
    });
  }
});

// =========================
// LIST BUSINESSES
// =========================
app.get("/api/businesses", async (_req, res) => {
  try {
    const list = await listActiveBusinesses();

    const formatted = await Promise.all(
      list.map(async (b) => ({
        ...b,
        logo:
          b.logo ||
          (b.mediaLink &&
          /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(String(b.mediaLink))
            ? b.mediaLink
            : null),

        whatsappLink: b.whatsapp
          ? `https://wa.me/${String(b.whatsapp).replace(/\D/g, "")}`
          : null,

        // ✅ tracked lead link باستخدام token حقيقي
        lead_link:
          b.id && b.whatsapp
            ? await createLeadTrackedLink({
                businessId: b.id,
                phone: b.whatsapp,
                query: "",
                userPhone: "",
              })
            : null,
      }))
    );

    return res.json({
      ok: true,
      results: formatted,
    });
  } catch (e) {
    console.error("/api/businesses error", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// =========================
// GET BUSINESS
// =========================
app.get("/api/business/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    let business = null;

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      business = await getBusinessById(id);
    }

    if (!business) {
      business = await getBusinessByCustomId(id);
    }

    if (!business) {
      return res.status(404).json({ error: "Not found" });
    }

    const formatted = {
      ...business,
      logo:
        business.logo ||
        (business.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(String(business.mediaLink))
          ? business.mediaLink
          : null),
      whatsappLink: business.whatsapp
        ? `https://wa.me/${String(business.whatsapp).replace(/\D/g, "")}`
        : null,
    };

    return res.json({
      ok: true,
      business: formatted,
    });
  } catch (e) {
    console.error("/api/business/:id error", e);
    return res.status(404).json({ error: "Not found" });
  }
});
// ============================================================================
// TRACKING (Core Monetization)
// ============================================================================

// =========================
// Internal helper
// =========================
async function pushEvent(businessId, field) {
  const fieldMap = {
    views: "views",
    clicks: "clicks",
    mediaViews: "media",
    mapClicks: "clicks",
    whatsappClicks: "whatsapp",
    messages: "whatsapp",
  };

  const mappedField = fieldMap[field];

  if (!mappedField) {
    throw new Error(`Unsupported event field: ${field}`);
  }

  return incrementBusinessEventField(businessId, mappedField);
}

// =========================
// VIEW (no charge)
// =========================
app.post("/api/track-view", async (req, res) => {
  try {
    const { businessId } = req.body || {};

    if (!businessId) {
      return res.status(400).json({ error: "businessId required" });
    }

    const info = await getBusinessOwnerInfo(businessId);
    if (!info) return res.status(404).json({ error: "Business not found" });

    await pushEvent(businessId, "views");

    await logBusinessEvent({
      businessId: info.businessId,
      ownerUserId: info.ownerUserId,
      type: "view",
      source: "business_details_page",
    });

    return res.json({ ok: true, charged: false });
  } catch (e) {
    console.error("track-view error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});


// =========================
// CLICK (paid)
// =========================

app.post("/api/track-click", async (req, res) => {
  try {
    const { businessId } = req.body || {};

    if (!businessId) {
      return res.status(400).json({ error: "businessId required" });
    }

    const info = await getBusinessOwnerInfo(businessId);
    if (!info) {
      return res.status(404).json({ error: "Business not found" });
    }

    const ip = getClientIp(req);
    const guardKey = makeGuardKey({
      businessId: info.businessId,
      ip,
      action: "click",
    });

    if (isWithinCooldown(CLICK_GUARD, guardKey, 30 * 1000)) {
      console.warn("ANTI_FRAUD_BLOCK_CLICK", {
        businessId: info.businessId,
        ip,
      });

      return res.status(429).json({
        error: "Too many repeated clicks",
        code: "CLICK_COOLDOWN",
      });
    }

    const dailyKey = `click:${info.businessId}:${ip}`;

    if (incrementDailyLimit(dailyKey, 50)) {
      console.warn("ANTI_FRAUD_DAILY_LIMIT_CLICK", {
        businessId: info.businessId,
        ip,
      });

      return res.status(429).json({
        error: "Daily click limit exceeded",
        code: "DAILY_LIMIT",
      });
    }

    const deduction = await deductWalletBalance({
      ownerUserId: info.ownerUserId,
      businessId: info.businessId,
      eventType: "click",
      reason: "Business profile click charge",
      reference: `click_${info.businessId}_${ip}_${Date.now()}`,
      meta: { source: "business_profile_click", ip },
    });

    if (deduction.insufficient) {
      return res.status(402).json({
        error: "Insufficient balance",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    await pushEvent(info.businessId, "clicks");

    await logBusinessEvent({
      businessId: info.businessId,
      ownerUserId: info.ownerUserId,
      type: "click",
      source: "business_profile_click",
      meta: { ip },
    });

    return res.json({
      ok: true,
      charged: true,
      amount: deduction.amount || 0,
    });
  } catch (e) {
    console.error("track-click error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// =========================
// MEDIA (paid)
// =========================
app.post("/api/track-media", async (req, res) => {
  try {
    const { businessId } = req.body || {};

    if (!businessId) {
      return res.status(400).json({ error: "businessId required" });
    }

    const info = await getBusinessOwnerInfo(businessId);
    if (!info) {
      return res.status(404).json({ error: "Business not found" });
    }

    const ip = getClientIp(req);
    const guardKey = makeGuardKey({
      businessId: info.businessId,
      ip,
      action: "media",
    });

    if (isWithinCooldown(CLICK_GUARD, guardKey, 30 * 1000)) {
      return res.status(429).json({
        error: "Too many repeated media actions",
        code: "MEDIA_COOLDOWN",
      });
    }

    const deduction = await deductWalletBalance({
      ownerUserId: info.ownerUserId,
      businessId: info.businessId,
      eventType: "media",
      reason: "Media view charge",
      reference: `media_${info.businessId}_${ip}_${Date.now()}`,
      meta: { source: "media_view", ip },
    });

    if (deduction.insufficient) {
      return res.status(402).json({
        error: "Insufficient balance",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    await pushEvent(info.businessId, "mediaViews");

    await logBusinessEvent({
      businessId: info.businessId,
      ownerUserId: info.ownerUserId,
      type: "media",
      source: "media_view",
      meta: { ip },
    });

    return res.json({ ok: true, charged: true });
  } catch (e) {
    console.error("track-media error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// =========================
// WHATSAPP (paid)
// =========================
app.post("/api/track-whatsapp", async (req, res) => {
  try {
    const { businessId } = req.body || {};

    if (!businessId) {
      return res.status(400).json({ error: "businessId required" });
    }

    const info = await getBusinessOwnerInfo(businessId);
    if (!info) {
      return res.status(404).json({ error: "Business not found" });
    }

    const ip = getClientIp(req);
    const guardKey = makeGuardKey({
      businessId: info.businessId,
      ip,
      action: "whatsapp",
    });

    if (isWithinCooldown(LEAD_GUARD, guardKey, 60 * 1000)) {
      console.warn("ANTI_FRAUD_BLOCK_WHATSAPP", {
        businessId: info.businessId,
        ip,
      });

      return res.status(429).json({
        error: "Too many repeated WhatsApp leads",
        code: "WHATSAPP_COOLDOWN",
      });
    }
const dailyKey = `whatsapp:${info.businessId}:${ip}`;

if (incrementDailyLimit(dailyKey, 20)) {
  console.warn("ANTI_FRAUD_DAILY_LIMIT_WHATSAPP", {
    businessId: info.businessId,
    ip,
  });

  return res.status(429).json({
    error: "Daily WhatsApp limit exceeded",
    code: "DAILY_LIMIT",
  });
}
    const deduction = await deductWalletBalance({
      ownerUserId: info.ownerUserId,
      businessId: info.businessId,
      eventType: "whatsapp",
      reason: "WhatsApp lead charge",
      reference: `whatsapp_${info.businessId}_${ip}_${Date.now()}`,
      meta: { source: "whatsapp_lead", ip },
    });

    if (deduction.insufficient) {
      return res.status(402).json({
        error: "Insufficient balance",
        code: "INSUFFICIENT_BALANCE",
      });
    }

    await pushEvent(info.businessId, "whatsappClicks");
    await pushEvent(info.businessId, "messages");

    await logBusinessEvent({
      businessId: info.businessId,
      ownerUserId: info.ownerUserId,
      type: "whatsapp",
      source: "whatsapp_lead",
      meta: { ip },
    });

    return res.json({
      ok: true,
      charged: true,
      amount: deduction.amount || 0,
    });
  } catch (e) {
    console.error("track-whatsapp error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// ============================================================================
// Admin Auth + Admin endpoints (Supabase Clean Version)
// ============================================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Missing admin credentials");
}

// =========================
// ADMIN LOGIN
// =========================
app.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      String(email || "").trim().toLowerCase() !==
      String(ADMIN_EMAIL).trim().toLowerCase()
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passOk = ADMIN_PASSWORD.startsWith("$2")
      ? await bcrypt.compare(String(password), ADMIN_PASSWORD)
      : String(password) === String(ADMIN_PASSWORD);

    if (!passOk) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signAdminToken(email);

    return res.json({ ok: true, token });
  } catch (e) {
    console.error("admin login error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// =========================
// ADMIN ME
// =========================
app.get("/api/admin/me", requireAdmin, async (req, res) => {
  return res.json({
    ok: true,
    email: req.admin.email,
    role: "admin",
  });
});

// =========================
// ADMIN STATS
// =========================
app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const [users, businesses] = await Promise.all([
      listAllUsers(),
      listAllBusinesses(),
    ]);

    return res.json({
      ok: true,
      totalUsers: users.length,
      totalBusinesses: businesses.length,
    });
  } catch (e) {
    console.error("admin stats error:", e);
    return res.status(500).json({ error: "Failed to load admin stats" });
  }
});

app.get("/api/admin/businesses", requireAdmin, async (_req, res) => {
  try {
    const businesses = await listAllBusinesses();

    return res.json({
      ok: true,
      results: businesses,
    });
  } catch (e) {
    console.error("admin businesses error:", e);
    return res.status(500).json({ error: "Failed to load businesses" });
  }
});

// =========================
// ADMIN USERS
// =========================
app.get("/api/admin/users", requireAdmin, async (_req, res) => {
  try {
    const users = await listAllUsers();
    return res.json({ ok: true, users });
  } catch (e) {
    console.error("admin users error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

// =========================
// ACTIVATE BUSINESS
// =========================
app.post("/api/admin/businesses/:id/activate", requireAdmin, async (req, res) => {
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

// =========================
// SUSPEND BUSINESS
// =========================
app.post("/api/admin/businesses/:id/suspend", requireAdmin, async (req, res) => {
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

// =========================
// NOTIFICATIONS (Memory - OK for MVP)
// =========================
let NOTIFS = [];

app.get("/api/admin/notifications", requireAdmin, async (_req, res) => {
  return res.json({ ok: true, notifications: NOTIFS });
});

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

// =========================
// SETTINGS
// =========================
let ADMIN_SETTINGS = {
  theme: "light",
  email: ADMIN_EMAIL,
};

app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
  return res.json({ ok: true, settings: ADMIN_SETTINGS });
});

app.post("/api/admin/settings", requireAdmin, async (req, res) => {
  ADMIN_SETTINGS = { ...ADMIN_SETTINGS, ...(req.body || {}) };
  return res.json({ ok: true, settings: ADMIN_SETTINGS });
});

// ============================================================================
// WhatsApp Webhook (FINAL CLEAN VERSION)
// ============================================================================

function parseNearbyIntent(text = "") {
  const raw = String(text || "").trim();
  const q = raw.toLowerCase();

  const nearbyWords = [
    "قريبة مني",
    "قريب مني",
    "أقرب",
    "اقرب",
    "قريبة",
    "قريب",
    "near me",
    "nearest",
    "closest",
    "near",
  ];

  const removeWords = [
    "مني",
    "عندي",
    "حولي",
    "بالقرب",
    "around",
    "me",
  ];

  const isNearby = nearbyWords.some((word) =>
    q.includes(word.toLowerCase())
  );

  if (!isNearby) {
    return { isNearby: false, categoryQuery: "" };
  }

  let categoryQuery = raw;

  [...nearbyWords, ...removeWords]
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

function detectLanguage(text = "") {
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  return hasArabic ? "ar" : "en";
}

function isHelpCommand(text = "") {
  const t = String(text || "").trim().toLowerCase();
  return ["help", "start", "مساعدة", "ابدأ"].includes(t);
}

function isThanks(text = "") {
  const t = String(text || "").toLowerCase().trim();
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

app.get("/webhooks/javna/whatsapp", (_req, res) => {
  res.status(200).send("WhatsApp webhook is live");
});

app.post("/webhooks/javna/whatsapp", async (req, res) => {
  try {
    res.status(200).json({ ok: true });

    const body = req.body || {};

    if (body.eventScope !== "whatsapp" || body.event !== "wa.message.received") {
      return;
    }

    const from = cleanDigits(body.from || body?.data?.from || "");
    const messageType = body?.data?.type || "";
    const incomingLocation = body?.data?.location || null;
    const incomingText = (body?.data?.text?.text || body?.data?.text || "")
      .toString()
      .trim();

    if (!from) return;

   const lang = detectLanguage(incomingText || "");


    const query = normalizeSearchText(incomingText || "");



// =========================
// REFINEMENT ANSWER FLOW (PUT IT HERE)
// =========================
if (messageType === "text" && incomingText && !isMoreCommand(incomingText)) {
  const pendingRefinement = getPendingRefinement(from);

  if (pendingRefinement) {
    const updatedSession = saveRefinementAnswer(pendingRefinement, incomingText);

    if (!isRefinementComplete(updatedSession)) {
      setPendingRefinement(from, updatedSession);

      const nextQuestion = formatSingleRefinementQuestion(updatedSession);

      return await javnaSendText({
        to: from,
        body: nextQuestion,
      });
    }

    clearPendingRefinement(from);

    const refinedSearchData = await searchBusinesses({
      query: updatedSession.query,
      lang: updatedSession.lang,
      refinementAnswers: updatedSession.answers,
    });

    const enrichedResults = await enrichBusinessesWithTrackedLinks({
      items: refinedSearchData.results || [],
      query: refinedSearchData.effectiveQuery || updatedSession.query,
      userPhone: from,
    });

   const finalSearchData = {
  ...refinedSearchData,
  results: enrichedResults,
};
    const reply = formatSearchResponse(finalSearchData, updatedSession.lang);

    return await javnaSendText({
      to: from,
      body: reply,
    });
  }
}
// =========================
// Greeting / Help / Thanks
// =========================
if (isGreeting(incomingText) || isHelpCommand(incomingText)) {
  return await javnaSendText({
    to: from,
    body: getWelcomeMessage(lang),
  });
}

if (isThanks(incomingText)) {
  return await javnaSendText({
    to: from,
    body: lang === "ar" ? "على الرحب والسعة 😊" : "You're welcome 😊",
  });
}

// =========================
// LOCATION SEARCH
// =========================
if (
  messageType === "location" &&
  incomingLocation?.latitude &&
  incomingLocation?.longitude
) {
  const lat = Number(incomingLocation.latitude);
  const lng = Number(incomingLocation.longitude);

  const pendingNearby = getPendingNearby(from);
  const categoryQuery = pendingNearby?.category || "";

  const nearest = await findNearestBusinesses(lat, lng, 3, categoryQuery);

  const enriched = await enrichBusinessesWithTrackedLinks({
    items: nearest,
    query: categoryQuery || "nearby",
    userPhone: from,
  });

  clearPendingNearby(from);

  const reply = formatNearestResults(
    enriched,
    lang,
    categoryQuery || pendingNearby?.rawQuery || ""
  );

  return await javnaSendText({
    to: from,
    body: reply,
  });
}

// =========================
// EMPTY
// =========================
if (!query) {
  return await javnaSendText({
    to: from,
    body:
      lang === "ar"
        ? "اكتب اسم شركة أو نوع نشاط."
        : "Send a business name or category.",
  });
}

// =========================
// NORMAL SEARCH (NEW ENGINE)
// =========================
const intentData = parseSearchIntent(incomingText || "");
const effectiveQuery =
  intentData.categoryQuery || normalizeSearchText(incomingText || "");

// =========================
// NEARBY → ask for location
// =========================
if (intentData.isNearby) {
  setPendingNearby(from, {
    category: intentData.categoryQuery || "",
    rawQuery: incomingText || "",
  });

  const body =
    lang === "ar"
      ? "📍 أرسل موقعك الحالي لأعرض لك أقرب النتائج."
      : "📍 Please share your location so I can show nearest results.";

  return await javnaSendText({
    to: from,
    body,
  });
}

// =========================
// RUN SEARCH ENGINE
// =========================
const searchData = await searchBusinesses({
  query: normalizeSearchText(incomingText || ""),
  lang,
});

// =========================
// REFINEMENT MODE
// =========================
if (searchData.mode === "refinement_required") {
  const session = {
    query: normalizeSearchText(incomingText || ""),
    lang,
    answers: {
      preference: "",
      area: "",
      priority: "",
    },
    step: 0,
  };

  setPendingRefinement(from, session);

  const firstQuestion = formatSingleRefinementQuestion(session);

  return await javnaSendText({
    to: from,
    body: firstQuestion,
  });
}

// =========================
// RESULTS MODE
// =========================
const enrichedResults = await enrichBusinessesWithTrackedLinks({
  items: searchData.results || [],
  query: searchData.effectiveQuery || effectiveQuery,
  userPhone: from,
});

const finalSearchData = {
  ...searchData,
  results: enrichedResults,
};

const reply = formatSearchResponse(finalSearchData, lang);

return await javnaSendText({
  to: from,
  body: reply,
});
      } catch (e) {
    console.error("WHATSAPP WEBHOOK ERROR:", e);
  }
});
    
// ============================================================================
// LEAD TRACKED REDIRECT
// ============================================================================
// =========================
// Lead Redirect Route
// =========================
// =========================
// Lead Redirect Route
// =========================
app.get("/l/:token", async (req, res) => {
  try {
    const tokenId = String(req.params.token || "").trim();

    if (!tokenId) {
      return res.status(400).send("Invalid lead token");
    }

    const { data: tokenRow, error: tokenError } = await supabase
      .from("lead_tokens")
      .select("*")
      .eq("id", tokenId)
      .maybeSingle();

    if (tokenError || !tokenRow) {
      console.error("LEAD TOKEN FETCH ERROR:", tokenError);
      return res.status(404).send("Lead link not found");
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return res.status(410).send("Lead link expired");
    }

    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    const leadKey = `lead:${tokenRow.id}:${ip}`;

    if (isWithinCooldown(LEAD_GUARD, leadKey, 60 * 1000)) {
      return res.status(429).send("Too many repeated lead requests");
    }

    const rawPhone = String(tokenRow.business_phone || "").replace(/\D/g, "");
    if (!rawPhone) {
      return res.status(400).send("Business phone missing");
    }

    const text = buildWhatsAppLeadMessage({
      query: tokenRow.query || "",
      businessId: tokenRow.business_id || "",
      userPhone: tokenRow.user_phone || "",
    });

    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`;

    try {
     const { error: insertError } = await supabase.from("lead_clicks").insert([
  {
    token_id: tokenRow.id,
    business_id: tokenRow.business_id || null,
    business_phone: rawPhone,

    // 🔒 PRIVACY
    user_phone: null,
    user_phone_hash: hash(tokenRow.user_phone || ""),
    query: normalizeSearchText(tokenRow.query || "") || null,
    ip_address: maskIP(ip),

    clicked_at: new Date().toISOString(),
    user_agent: req.get("user-agent") || null,
    referer: req.get("referer") || null,
  },
]);
      if (insertError) {
        console.error("LEAD CLICK INSERT ERROR:", insertError);
      }
    } catch (trackingErr) {
      console.error("LEAD CLICK TRACKING EXCEPTION:", trackingErr);
    }

    try {
      const currentClicks = Number(tokenRow.click_count || 0);
      const { error: updateError } = await supabase
        .from("lead_tokens")
        .update({
          click_count: currentClicks + 1,
          last_clicked_at: new Date().toISOString(),
        })
        .eq("id", tokenRow.id);

      if (updateError) {
        console.error("LEAD TOKEN UPDATE ERROR:", updateError);
      }
    } catch (updateErr) {
      console.error("LEAD TOKEN UPDATE EXCEPTION:", updateErr);
    }

    return res.redirect(302, whatsappUrl);
  } catch (err) {
    console.error("LEAD REDIRECT ERROR:", err);
    return res.status(500).send("Internal redirect error");
  }
});
// ---------------------------------------------------------------------------
// Debug
// ---------------------------------------------------------------------------
app.get("/api/debug/resend", (_req, res) => {
  return res.json({
    ok: true,
    hasKey: Boolean(process.env.RESEND_API_KEY),
    hasFrom: Boolean(process.env.MAIL_FROM),
    from: process.env.MAIL_FROM || null,
  });
});

// ---------------------------------------------------------------------------
// Process-level error logging
// ---------------------------------------------------------------------------
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT_EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED_REJECTION:", reason);
});

app.use((err, _req, res, _next) => {
  console.error("UNHANDLED ERROR:", err);
  return res.status(500).json({ error: "Internal server error" });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Trusted Links API running on port ${PORT}`);
  console.log("FRONTEND_BASE_URL:", FRONTEND_BASE_URL);
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log(`JAVNA_API_KEY: ${JAVNA_API_KEY ? "Loaded ✅" : "Missing ❌"}`);
});
