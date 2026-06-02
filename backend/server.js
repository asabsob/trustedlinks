// backend/server.js
// ============================================================================
// Trusted Links Backend API (Supabase Version)
// ============================================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

    
import supabase from "./db/postgres.js";
import adminAIRoutes from "./routes/ai/adminAI.js";

import crypto from "crypto";
import { optimizeBusinessProfile } from "./services/aiOptimizer.js";
import { translateBusinessContent } from "./services/ai/translateBusiness.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import campaignAuthRoutes from "./routes/campaignAuthRoutes.js";
import fundingCodeRoutes from "./routes/fundingCodeRoutes.js";
import platformAnalyticsRoutes from "./routes/platformAnalyticsRoutes.js";

import merchantAIRoutes from "./routes/ai/merchantAI.js";
import { sendOpsAlert } from "./services/ops/sendOpsAlert.js";

import { createOrUpdateIncident }
from "./services/ops/createOrUpdateIncident.js";

import opsRoutes from "./routes/ops.routes.js";

import whatsappOtpRoutes from "./routes/whatsappOtp.routes.js";
import businessRoutes from "./routes/business.routes.js";


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

import { sendEmail } from "./services/email.js";

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
  redactIp,
  normalizeQueryForStorage,
  buildSafeSearchLog,
  hashValue,   // 👈 أضف هذا
} from "./utils/privacy.js";

import {
  buildFingerprint,
  hashPhone as hashFraudPhone,
} from "./services/antiFraud/fingerprint.js";

import { buildChargeKey } from "./services/antiFraud/dedupe.js";
import { analyzeLeadSignals } from "./services/antiFraud/analyzeSignals.js";
import { calculateRiskScore } from "./services/antiFraud/scoring.js";
import {
  logFraudEvent,
  findActiveChargeLock,
  createChargeLock,
  createPendingCharge,
} from "./services/antiFraud/store.js";

import privacyRoutes from "./routes/privacy.js";

import {
  understandConversationMessage,
  saveSearchSession,
  MESSAGE_TYPES,
} from "./services/conversationOrchestrator.js";

import {
  logOperationEvent,
  operationErrorLogger,
} from "./middleware/operationLogger.js";

import authRoutes from "./routes/auth.js";

import paymentsRoutes from "./routes/payments.routes.js";

import searchRoutes from "./routes/search.routes.js";

import publicBusinessRoutes from "./routes/publicBusiness.routes.js";

import meRoutes from "./routes/me.routes.js";

import analyticsRoutes from "./routes/analytics.routes.js";

import uploadRoutes from "./routes/upload.routes.js";

import mediaRoutes from "./routes/media.routes.js";

import leadRoutes from "./routes/lead.routes.js";

import adminRoutes from "./routes/admin.routes.js";

import adminFraudRoutes from "./routes/adminFraud.routes.js";

import adminReportsRoutes from "./routes/adminReports.routes.js";

import whatsappWebhookRoutes from "./routes/whatsappWebhook.routes.js";

import {
  getBusinessPricing,
  getConversationStartPrice,
  tryDeductFromCampaign,
  deductWalletBalance,
  logBusinessEvent,
} from "./services/billing.service.js";



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

// مفتاح بسيط لمنع تكرار نفس التنبيه خلال فترة زمنية
const NOTIF_TTL_MIN = 10;

async function shouldSendNotification({ key }) {
  const since = new Date(Date.now() - NOTIF_TTL_MIN * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("meta->>dedupKey", key)
    .gte("created_at", since);

  if (error) {
    console.error("notif dedup check error:", error);
    return true;
  }
  return (count || 0) === 0;
}

async function emitNotification({
  audienceType = "admin",
  audienceId = null,
  type = "system",
  priority = "normal",
  title,
  message,
  actionLabel = null,
  actionUrl = null,
  meta = {},
  dedupKey = null,
}) {
  if (!message) return;

  const finalKey = dedupKey || `${type}:${meta.businessId || "global"}`;

  const okToSend = await shouldSendNotification({ key: finalKey });
  if (!okToSend) return;

  await createNotification({
    audienceType,
    audienceId,
    type,
    priority,
    title,
    message,
    actionLabel,
    actionUrl,
    meta: {
      ...meta,
      dedupKey: finalKey,
    },
  });
}


dotenv.config();
console.log("🚀 SERVER VERSION: TEST 1 - SAMEER");
console.log("🚀 SERVER VERSION: sponsorship-route-v1 loaded");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const app = express();
app.set("trust proxy", 1);


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

app.use("/api/business", businessRoutes);

app.use("/api/businesses", publicBusinessRoutes);
app.use("/api/business", publicBusinessRoutes);

app.use("/api/me", meRoutes);

app.use("/api", analyticsRoutes);

app.use("/api/upload", uploadRoutes);

app.use("/media", mediaRoutes);

app.use("/", leadRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/admin/fraud", adminFraudRoutes);

app.use("/api/admin", adminReportsRoutes);

app.use("/webhooks/javna/whatsapp", whatsappWebhookRoutes);

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

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

app.use("/", opsRoutes);
app.use("/api/ai", adminAIRoutes);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

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

const adminApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests, please try again later." },
});

const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many lead requests, please try again later.",
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    String(req.headers["x-forwarded-for"] || req.ip || "unknown")
      .split(",")[0]
      .trim(),
  message: { error: "Too many search requests" },
});

app.use("/api", apiLimiter);

app.use("/api/search", searchLimiter, searchRoutes);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/resend-verification", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

app.use("/api/auth", authRoutes);

app.use("/api/whatsapp/request-otp", otpLimiter);
app.use("/api/whatsapp/verify-otp", otpLimiter);
app.use("/api/whatsapp", whatsappOtpRoutes);


app.use("/api/admin/login", adminLimiter);

app.use("/api/admin", (req, res, next) => {
  if (req.path === "/login") return next();
  return adminApiLimiter(req, res, next);
});

app.use("/l", leadLimiter);


app.use(express.urlencoded({ extended: true, limit: "200kb" }));

app.use("/api/privacy", privacyRoutes);
app.use("/api/campaign", campaignRoutes);

app.use("/api/campaign/auth", campaignAuthRoutes);
app.use("/api/platform/analytics", platformAnalyticsRoutes);

app.use("/api/campaign/auth", campaignAuthRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/campaign/funding-codes", fundingCodeRoutes);

app.use("/api/ai", merchantAIRoutes);

app.use("/api/payments", paymentsRoutes); 

app.use(
  "/api/platform/analytics",
  platformAnalyticsRoutes
);

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


async function mapBusinessNames(rows = []) {
  const businessIds = [
    ...new Set(
      rows.map(r => String(r.business_id || "").trim()).filter(Boolean)
    ),
  ];

  if (businessIds.length === 0) return new Map();

  const { data } = await supabase
    .from("businesses")
    .select("id, name, name_ar")
    .in("id", businessIds);

  return new Map(
    (data || []).map(b => [
      String(b.id),
      b.name || b.name_ar || String(b.id),
    ])
  );
}

     async function notifyFraudBlocked({ businessId, tokenId, intentType, risk }) {
  const score = Number(risk.score || 0);
  const level = String(risk.riskLevel || "").toLowerCase();

  if (score < 80 && !["high", "critical"].includes(level)) return;

  await emitNotification({
    type: "fraud",
    priority: level === "critical" ? "critical" : "high",
    title: "Fraud attempt blocked",
    message: `Blocked ${intentType} lead (risk ${score}).`,
    actionLabel: "Open fraud center",
    actionUrl: "/admin/fraud",
    meta: {
      businessId,
      tokenId,
      intentType,
      riskScore: score,
      riskLevel: level,
      reasonCodes: risk.reasonCodes || [],
    },
    dedupKey: `block:${businessId}:${tokenId}`,
  });
}

async function notifyPendingCharge({ businessId, tokenId, risk }) {
  await emitNotification({
    type: "fraud",
    priority: "high",
    title: "Pending charge created",
    message: `Charge held for review (risk ${risk.score}).`,
    actionLabel: "Open fraud queue",
    actionUrl: "/admin/fraud",
    meta: {
      businessId,
      tokenId,
      riskScore: Number(risk.score || 0),
      riskLevel: risk.riskLevel,
      reasonCodes: risk.reasonCodes || [],
    },
    dedupKey: `hold:${businessId}:${tokenId}`,
  });
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("Invalid JWT_SECRET");
}

function signUserToken(userId) {
  return jwt.sign({ id: userId, role: "user" }, JWT_SECRET, { expiresIn: "7d" });
}


function detectCurrencyByCountry({ countryCode = "", whatsapp = "" }) {
  const cc = String(countryCode || "").toUpperCase();
  const phone = String(whatsapp || "").replace(/\D/g, "");

  if (cc === "JO" || phone.startsWith("962")) return "JOD";
  if (cc === "SA" || phone.startsWith("966")) return "SAR";
  if (cc === "AE" || phone.startsWith("971")) return "AED";
  if (cc === "QA" || phone.startsWith("974")) return "QAR";
  if (cc === "KW" || phone.startsWith("965")) return "KWD";
  if (cc === "OM" || phone.startsWith("968")) return "OMR";
  if (cc === "BH" || phone.startsWith("973")) return "BHD";

  return "USD";
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



// ============================================================================
// Health
// ============================================================================

app.get("/test-double-deduct", async (req, res) => {
  try {
    const businessId = "PUT_REAL_BUSINESS_ID_HERE";

    const results = await Promise.allSettled([
      deductBusinessWallet({
        businessId,
        amount: 0.25,
        eventType: "test_parallel_deduct",
        note: "parallel A",
        meta: { test: true, label: "A" },
      }),
      deductBusinessWallet({
        businessId,
        amount: 0.25,
        eventType: "test_parallel_deduct",
        note: "parallel B",
        meta: { test: true, label: "B" },
      }),
    ]);

    return res.json({
      ok: true,
      results,
    });
  } catch (error) {
    console.error("test-double-deduct error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
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

async function createNotification({
  audienceType = "admin",
  audienceId = null,
  type = "system",
  priority = "normal",
  title = "",
  message = "",
  actionLabel = null,
  actionUrl = null,
  channel = "dashboard",
  meta = {},
}) {
  const payload = {
    audience_type: audienceType,
    audience_id: audienceId,
    type,
    priority,
    title: String(title || "").trim() || "Notification",
    message: String(message || "").trim(),
    action_label: actionLabel || null,
    action_url: actionUrl || null,
    channel,
    meta: meta || {},
  };

  if (!payload.message) {
    throw new Error("Notification message is required");
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function listNotifications({
  audienceType = "admin",
  audienceId = null,
  status = "",
  limit = 50,
}) {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("audience_type", audienceType)
    .order("created_at", { ascending: false })
    .limit(Math.min(Number(limit || 50), 200));

  if (audienceId) {
    query = query.eq("audience_id", audienceId);
  } else {
    query = query.is("audience_id", null);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function markNotificationRead(id) {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function markAllNotificationsRead({
  audienceType = "admin",
  audienceId = null,
}) {
  let query = supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString(),
    })
    .eq("audience_type", audienceType)
    .eq("status", "unread");

  if (audienceId) {
    query = query.eq("audience_id", audienceId);
  } else {
    query = query.is("audience_id", null);
  }

  const { error } = await query;
  if (error) throw error;
  return true;
}

async function getUnreadNotificationCount({
  audienceType = "admin",
  audienceId = null,
}) {
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("audience_type", audienceType)
    .eq("status", "unread");

  if (audienceId) {
    query = query.eq("audience_id", audienceId);
  } else {
    query = query.is("audience_id", null);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}
// ============================================================================
// Admin Auth + Admin endpoints (Supabase Clean Version)
// ============================================================================


function getAutoApprovalDecision(pendingCharge) {
  const score = Number(pendingCharge?.risk_score || 0);

  if (score >= 80) {
    return { autoApprove: false, autoReject: false, reason: "high_risk_manual_review" };
  }

  if (score <= 25) {
    return { autoApprove: true, autoReject: false, reason: "low_risk_auto_approve" };
  }

  return { autoApprove: false, autoReject: false, reason: "medium_risk_manual_review" };
}

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

// Operations logger must come before final error response
app.use(operationErrorLogger);

app.use((err, _req, res, _next) => {
  console.error("UNHANDLED ERROR:", err);
  return res.status(500).json({ error: "Internal server error" });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Trusted Links API running on port ${PORT}`);
  console.log("FRONTEND_BASE_URL:", FRONTEND_BASE_URL);
  console.log("API_BASE_URL:", API_BASE_URL);
 console.log(
  `JAVNA_API_KEY: ${process.env.JAVNA_API_KEY ? "Loaded ✅" : "Missing ❌"}`
);
});
