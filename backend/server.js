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

import supabase from "./db/postgres.js";

import { searchBusinesses } from "./search/searchService.js";
import { normalizeSearchText } from "./search/textNormalizer.js";
import { formatSearchResponse, formatNearestResults } from "./search/searchFormatter.js";
import { findNearestBusinesses } from "./search/nearbyService.js";
import crypto from "crypto";
import { parseSearchIntent } from "./search/intentDetector.js";
import { optimizeBusinessProfile } from "./services/aiOptimizer.js";
import { translateBusinessContent } from "./services/ai/translateBusiness.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import campaignAnalyticsRoutes from "./routes/campaignAnalyticsRoutes.js";
import campaignAuthRoutes from "./routes/campaignAuthRoutes.js";
import fundingCodeRoutes from "./routes/fundingCodeRoutes.js";


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

app.use("/l", leadLimiter);


app.use(express.urlencoded({ extended: true, limit: "200kb" }));

app.use("/api/privacy", privacyRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/campaign/analytics",campaignAnalyticsRoutes);
app.use("/api/campaign/auth", campaignAuthRoutes);

app.use("/api/campaign/auth", campaignAuthRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/campaign/funding-codes", fundingCodeRoutes);
app.use("/api/campaign/analytics", campaignAnalyticsRoutes);

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

async function enrichTopResultWithTrackedLink({
  items = [],
  query = "",
  userPhone = "",
  intentType = "category",
}) {
  const finalIntentType = intentType || "category";
  const safeItems = Array.isArray(items) ? items : [];

  if (!safeItems.length) return [];

  const enriched = [];

  for (const item of safeItems) {
    let trackedLink = null;

    try {
      if (item?.id && item?.whatsapp) {
        trackedLink = await createLeadTrackedLink({
          businessId: item.id,
          phone: item.whatsapp,
          query,
          userPhone,
          intentType: finalIntentType,
        });
      }
    } catch (err) {
      console.error("TRACKED_LINK_CREATE_ERROR", {
        businessId: item?.id,
        error: err.message,
      });
    }

    enriched.push({
      ...item,
      trackedLink,
    });
  }

  return enriched;
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
// =========================
// MEMORY (instead of Mongo sessions)
// =========================
const PENDING_NEARBY_REQUESTS = new Map();
const PENDING_REFINEMENT_REQUESTS = new Map();

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
  intentType = "category",
}) {
  const finalIntentType = intentType || "category";

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
    intentType: finalIntentType,
  });

  const tokenId = token?.id || token?._id?.toString();
  const baseUrl = (process.env.FRONTEND_BASE_URL || "https://trustedlinks.net")
    .trim()
    .replace(/\/+$/, "");

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

function getBusinessPricing(business = {}) {
  const countryCode = String(business.countryCode || business.country_code || "").toUpperCase();
  const phone = String(business.whatsapp || "").replace(/\D/g, "");

  if (countryCode === "JO" || phone.startsWith("962")) {
    return { currency: "JOD", direct: 0.2, category: 0.25, nearby: 0.3 };
  }

  if (countryCode === "QA" || phone.startsWith("974")) {
    return { currency: "QAR", direct: 1, category: 1.25, nearby: 1.5 };
  }

  if (countryCode === "SA" || phone.startsWith("966")) {
    return { currency: "SAR", direct: 1, category: 1.25, nearby: 1.5 };
  }

  if (countryCode === "AE" || phone.startsWith("971")) {
    return { currency: "AED", direct: 1, category: 1.25, nearby: 1.5 };
  }

  return { currency: "USD", direct: 0.25, category: 0.3, nearby: 0.4 };
}

function getConversationStartPrice(business, intentType) {
  const type = intentType || "category";
  const pricing = getBusinessPricing(business);

  if (type === "direct") return pricing.direct;
  if (type === "nearby") return pricing.nearby;

  return pricing.category;
}

async function tryDeductFromCampaign({
  businessId,
  amount,
  intentType = "category",
  reference = "",
  meta = {},
}) {
  try {
    if (!businessId || !amount || amount <= 0) {
      return { ok: false, skipped: true };
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle();

    if (businessError) throw businessError;

    if (!business) {
      return { ok: false, error: "Business not found" };
    }

    const sponsoredBalance = Number(business.sponsored_balance || 0);

    if (sponsoredBalance < amount) {
      return {
        ok: false,
        skipped: true,
        reason: "No campaign balance",
      };
    }

    const { data: claims, error: claimsError } = await supabase
      .from("campaign_claims")
      .select(`
        id,
        funding_code_id,
        funding_codes (
          id,
          campaign_id,
          campaigns (
            id,
            remaining_budget,
            currency,
            status
          )
        )
      `)
      .eq("business_id", businessId)
      .order("claimed_at", { ascending: false })
      .limit(1);

    if (claimsError) throw claimsError;

    const claim = claims?.[0];

    const campaign =
      claim?.funding_codes?.campaigns;

    if (!campaign || campaign.status !== "active") {
      return {
        ok: false,
        skipped: true,
        reason: "No active campaign",
      };
    }

    const campaignRemaining =
      Number(campaign.remaining_budget || 0);

    if (campaignRemaining < amount) {
      return {
        ok: false,
        skipped: true,
        reason: "Campaign budget insufficient",
      };
    }

    const newSponsoredBalance =
      sponsoredBalance - amount;

    const newCampaignRemaining =
      campaignRemaining - amount;

    const { error: businessUpdateError } = await supabase
      .from("businesses")
      .update({
        sponsored_balance: newSponsoredBalance,
      })
      .eq("id", businessId);

    if (businessUpdateError) throw businessUpdateError;

    const { error: campaignUpdateError } = await supabase
      .from("campaigns")
      .update({
        remaining_budget: newCampaignRemaining,
      })
      .eq("id", campaign.id);

    if (campaignUpdateError) throw campaignUpdateError;

    const { error: txError } = await supabase
      .from("campaign_transactions")
      .insert({
        campaign_id: campaign.id,
        business_id: businessId,
        amount,
        currency: campaign.currency || "JOD",
        transaction_type: "campaign_lead_charge",
        reference_id: reference,
        metadata: {
          ...meta,
          intentType,
          source: "lead_billing",
        },
      });

    if (txError) throw txError;

    return {
      ok: true,
      chargedFrom: "campaign",
      amount,
      sponsoredBalanceAfter: newSponsoredBalance,
      campaignRemainingAfter: newCampaignRemaining,
      currency: campaign.currency || "JOD",
    };
  } catch (err) {
    console.error("CAMPAIGN DEDUCT ERROR:", err);
    return {
      ok: false,
      skipped: true,
      error: err.message,
    };
  }
}

async function deductWalletBalance({
  ownerUserId,
  businessId = null,
  intentType = "category",
  reason,
  reference = "",
  meta = {},
}) {
  try {
    if (!businessId) {
      return { ok: false, error: "businessId required" };
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return { ok: false, error: "Business not found" };
    }

    const finalIntentType = intentType || "category";
    const amount = getConversationStartPrice(business, finalIntentType);

    if (!amount || amount <= 0) {
      return { ok: true, skipped: true, reason: "No charge for this event" };
    }

    const campaignDeduct = await tryDeductFromCampaign({
  businessId,
  amount,
  intentType: finalIntentType,
  reference,
  meta: {
    ...meta,
    ownerUserId,
  },
});

if (campaignDeduct.ok) {
  return campaignDeduct;
}

    const result = await deductBusinessWallet({
      businessId,
      amount,
      eventType: `conversation_start_${finalIntentType}`,
      note: reason,
      meta: {
        ...meta,
        reference,
        ownerUserId,
        intentType: finalIntentType,
      },
    });
    
  if (
  Number(result.balanceAfter) > 0 &&
  Number(result.balanceAfter) < 5
) {
  try {
    if (typeof notifyLowBalance === "function") {
      await notifyLowBalance({
        businessId,
        balanceAfter: Number(result.balanceAfter),
      });
    } else {
      console.warn(
        "notifyLowBalance is not defined"
      );
    }
  } catch (notifyErr) {
    console.error(
      "notifyLowBalance failed:",
      notifyErr
    );
  }
}
    
  if (Number(result.balanceAfter) < 0) {
  if (typeof notifyNegativeBalance === "function") {
    await notifyNegativeBalance({
      businessId,
      balanceAfter: Number(result.balanceAfter),
    });
  }
}
    return {
      ok: true,
      amount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
     currency: getBusinessPricing(business).currency,
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
     walletCurrency: detectCurrencyByCountry({
  countryCode: business.countryCode,
  whatsapp: business.whatsapp,
}),
      walletStatus: "active",
     walletAllowNegative: true,
      walletNegativeLimit: -5,
      walletLowBalanceThreshold: 5,
      
     planName: "standard",
billingDirectIntentCost: getBusinessPricing({
  countryCode: business.countryCode,
  whatsapp: business.whatsapp,
}).direct,

billingCategoryIntentCost: getBusinessPricing({
  countryCode: business.countryCode,
  whatsapp: business.whatsapp,
}).category,

billingNearbyIntentCost: getBusinessPricing({
  countryCode: business.countryCode,
  whatsapp: business.whatsapp,
}).nearby,
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
        return res.status(403).json({
      ok: false,
      error: "Free top-up is currently disabled",
      reason: "FREE_TOPUP_DISABLED",
    });
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

    const pricing = getBusinessPricing(business);

    const walletBalance = Number(business?.wallet?.balance ?? 0);

    const sponsoredBalance = Number(
      business?.sponsoredBalance ??
      business?.sponsored_balance ??
      0
    );

    const currency =
      business?.wallet?.currency ||
      business?.walletCurrency ||
      business?.wallet_currency ||
      pricing.currency ||
      "JOD";

    const formatted = {
      ...business,

      wallet_balance: walletBalance,
      wallet_currency: currency,
      wallet_status: business?.wallet?.status || "active",

      sponsored_balance: sponsoredBalance,
      sponsored_campaign_name:
        business?.sponsoredCampaignName ??
        business?.sponsored_campaign_name ??
        null,

      sponsored_status:
        business?.sponsoredStatus ??
        business?.sponsored_status ??
        "none",

      sponsored_credit_expires_at:
        business?.sponsoredCreditExpiresAt ??
        business?.sponsored_credit_expires_at ??
        null,

      total_available_balance: walletBalance + sponsoredBalance,

      pricing: {
        currency,
        direct: pricing.direct,
        category: pricing.category,
        nearby: pricing.nearby,
      },

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
   mediaLink: req.body.mediaLink || "",
logo: req.body.logo || "",
locationText: req.body.locationText || "",
countryCode: req.body.countryCode || "",
countryName: req.body.countryName || "",
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
    : ""),
      whatsappLink: updated.whatsapp
        ? `https://wa.me/${String(updated.whatsapp).replace(/\D/g, "")}`
       : "",
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
    console.error("ai optimize error:", {
  message: err.message,
  status: err.status,
  type: err.type,
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
    : ""),
      whatsappLink: updated.whatsapp
        ? `https://wa.me/${String(updated.whatsapp).replace(/\D/g, "")}`
       : "",
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
// Source of truth: transactions
// =========================
app.get("/api/business/reports", requireUser, async (req, res) => {
  try {
    const business = await getBusinessByOwnerUserId(String(req.user.id));

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const businessId = String(business.id);

    const { data: rows, error } = await supabase
      .from("transactions")
      .select("type, amount, reason, event_type, created_at, status, currency")
      .eq("business_id", businessId)
      .eq("type", "debit")
      .eq("status", "completed")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("business/reports transactions fetch error:", error);
      return res.status(500).json({ error: "Failed to load reports" });
    }

    const safeRows = Array.isArray(rows) ? rows : [];

    let directStarts = 0;
    let categoryStarts = 0;
    let nearbyStarts = 0;
    let estimatedRevenue = 0;

    const activityMap = {};

    for (const row of safeRows) {
      const amount = Number(row.amount || 0);
      estimatedRevenue += amount;

      const eventType = String(row.event_type || "").toLowerCase();
      const reason = String(row.reason || "").toLowerCase();

      let intent = "direct";

      if (eventType.includes("category") || reason.includes("category")) {
        intent = "category";
      } else if (eventType.includes("nearby") || reason.includes("nearby")) {
        intent = "nearby";
      } else {
        intent = "direct";
      }

      if (intent === "direct") directStarts += 1;
      if (intent === "category") categoryStarts += 1;
      if (intent === "nearby") nearbyStarts += 1;

      const date = new Date(row.created_at).toISOString().slice(0, 10);

      if (!activityMap[date]) {
        activityMap[date] = {
          date,
          direct: 0,
          category: 0,
          nearby: 0,
          total: 0,
        };
      }

      activityMap[date][intent] += 1;
      activityMap[date].total += 1;
    }

    const totalBilledConversations =
      directStarts + categoryStarts + nearbyStarts;

    const activity = Object.values(activityMap);

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

      direct_starts: directStarts,
      category_starts: categoryStarts,
      nearby_starts: nearbyStarts,
      total_billed_conversations: totalBilledConversations,
      estimated_revenue: Number(estimatedRevenue.toFixed(2)),
      currency: business.wallet_currency || business.wallet?.currency || "USD",

     pricing: {
  currency: getBusinessPricing(business).currency,
  direct: getBusinessPricing(business).direct,
  category: getBusinessPricing(business).category,
  nearby: getBusinessPricing(business).nearby,
},
      activity,
      hourly: [],
      keywords: [],
      peakHour: null,
      peakDay: null,
      weeklyGrowth: 0,

      sources: [
        { name_en: "Direct", name_ar: "مباشر", value: directStarts },
        { name_en: "Category", name_ar: "فئة", value: categoryStarts },
        { name_en: "Nearby", name_ar: "قريب", value: nearbyStarts },
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
app.get("/api/search", searchLimiter, async (req, res) => {
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

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Missing admin credentials");
}

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

    // activity chart
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

    // categories (mock from businesses)
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

app.get("/api/admin/businesses", requireAdmin, async (_req, res) => {
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
// =========================
// ADMIN NOTIFICATIONS
// =========================
app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
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
    return res.status(500).json({ error: "Failed to load notifications" });
  }
});

app.post("/api/admin/notifications", requireAdmin, async (req, res) => {
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

    return res.json({ ok: true, notification });
  } catch (e) {
    console.error("admin notification create error:", e);
    return res.status(500).json({ error: e.message || "Failed to send notification" });
  }
});

app.post("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "Notification id required" });

    const notification = await markNotificationRead(id);
    return res.json({ ok: true, notification });
  } catch (e) {
    console.error("admin notification read error:", e);
    return res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

app.post("/api/admin/notifications/read-all", requireAdmin, async (_req, res) => {
  try {
    await markAllNotificationsRead({
      audienceType: "admin",
      audienceId: null,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("admin notifications read-all error:", e);
    return res.status(500).json({ error: "Failed to mark all as read" });
  }
});

app.get("/api/admin/notifications/unread-count", requireAdmin, async (_req, res) => {
  try {
    const unreadCount = await getUnreadNotificationCount({
      audienceType: "admin",
      audienceId: null,
    });

    return res.json({ ok: true, unreadCount });
  } catch (e) {
    console.error("admin notifications unread count error:", e);
    return res.status(500).json({ error: "Failed to load unread count" });
  }
});

// =========================
// ADMIN FRAUD OVERVIEW
// =========================
app.get("/api/admin/fraud/overview", requireAdmin, async (_req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const today = startOfDay.toISOString();

    const [events, pending] = await Promise.all([
      supabase
        .from("anti_fraud_events")
        .select("risk_level, action_taken, business_id, created_at")
        .gte("created_at", today),

      supabase
        .from("pending_charges")
        .select("id", { count: "exact" })
        .eq("status", "pending"),
    ]);

    const rows = events.data || [];

    const suspiciousToday = rows.filter(e =>
      ["medium", "high", "critical"].includes(e.risk_level)
    ).length;

    const blockedToday = rows.filter(e => e.action_taken === "block").length;

    const heldToday = rows.filter(e =>
      ["hold", "billing_hold"].includes(e.action_taken)
    ).length;

    const duplicateNoChargeToday = rows.filter(
      e => e.action_taken === "allow_duplicate_no_charge"
    ).length;

    const businessMap = new Map();

    rows.forEach(r => {
      const id = String(r.business_id || "");
      if (!id) return;
      businessMap.set(id, (businessMap.get(id) || 0) + 1);
    });

    const topTargetedBusinesses = [...businessMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .length;

    return res.json({
      ok: true,
      data: {
        suspiciousToday,
        blockedToday,
        heldToday,
        duplicateNoChargeToday,
        pendingCharges: pending.count || 0,
        topTargetedBusinesses,
      },
    });
  } catch (e) {
    console.error("fraud overview error:", e);
    return res.status(500).json({ ok: false });
  }
});

// =========================
// ADMIN FRAUD EVENTS
// =========================
app.get("/api/admin/fraud/events", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);

    let query = supabase
      .from("anti_fraud_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (req.query.riskLevel) {
      query = query.eq("risk_level", req.query.riskLevel);
    }

    if (req.query.action) {
      query = query.eq("action_taken", req.query.action);
    }

    if (req.query.businessId) {
      query = query.eq("business_id", req.query.businessId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const nameMap = await mapBusinessNames(data);

    const results = (data || []).map(e => ({
      ...e,
      business_name: nameMap.get(String(e.business_id)) || null,
    }));

    return res.json({ ok: true, data: results });
  } catch (e) {
    console.error("fraud events error:", e);
    return res.status(500).json({ ok: false });
  }
});

// =========================
// AUTO PROCESS PENDING CHARGES
// =========================
app.post("/api/admin/fraud/auto-process", requireAdmin, async (_req, res) => {
  try {
    const { data: pending, error } = await supabase
      .from("pending_charges")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: "Failed to load pending charges" });
    }

    let approved = 0;
    let skipped = 0;

    for (const charge of pending || []) {
      const decision = getAutoApprovalDecision(charge);

      if (!decision.autoApprove) {
        skipped++;
        continue;
      }

      await createTransaction({
        userId: charge.business_id,
        businessId: charge.business_id,
        type: "debit",
        amount: Number(charge.amount || 0),
        currency: charge.currency || "USD",
        reason: "Auto-approved pending charge",
        eventType: "pending_charge_auto_approved",
        reference: charge.id,
        status: "completed",
        balanceBefore: 0,
        balanceAfter: 0,
        notes: decision.reason,
        meta: {
          pendingChargeId: charge.id,
          riskScore: charge.risk_score,
        },
      });

      await supabase
        .from("pending_charges")
        .update({
          status: "approved",
          charged_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", charge.id);

      approved++;
    }

    return res.json({
      ok: true,
      approved,
      skipped,
    });
  } catch (e) {
    console.error("auto process pending charges error:", e);
    return res.status(500).json({ error: "Failed to auto process charges" });
  }
});

// =========================
// ADMIN PENDING CHARGES
// =========================

app.get("/api/admin/fraud/pending-charges", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);

    const { data, error } = await supabase
      .from("pending_charges")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const nameMap = await mapBusinessNames(data);

    return res.json({
      ok: true,
      data: (data || []).map(row => ({
        ...row,
        business_name: nameMap.get(String(row.business_id)) || null,
      })),
    });
  } catch (e) {
    console.error("pending charges error:", e);
    return res.status(500).json({ ok: false });
  }
});

// =========================
// APPROVE PENDING CHARGE
// =========================
app.post("/api/admin/fraud/pending-charges/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    const { data: charge, error } = await supabase
      .from("pending_charges")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !charge) {
      return res.status(404).json({ error: "Charge not found" });
    }

    if (charge.status !== "pending") {
      return res.status(400).json({ error: "Already processed" });
    }

    const walletResult = await deductBusinessWallet({
      businessId: charge.business_id,
      amount: Number(charge.amount || 0),
      eventType: "pending_charge_approved",
      note: "Approved pending charge",
      meta: {
        pendingChargeId: charge.id,
        approvedBy: req.admin?.email || "admin",
      },
    });
    
async function notifyNegativeBalance({ businessId, balanceAfter }) {
  if (typeof emitNotification !== "function") {
    console.warn("NEGATIVE BALANCE ALERT", { businessId, balanceAfter });
    return;
  }

  await emitNotification({
    type: "billing",
    priority: "critical",
    title: "Negative balance detected",
    message: `Business ${businessId} is in negative balance (${balanceAfter}).`,
    actionLabel: "Review account",
    actionUrl: "/admin/revenue",
    meta: { businessId, balanceAfter },
    dedupKey: `neg:${businessId}`,
  });
}
    if (Number(walletResult?.balanceAfter) < 0) {
  await createNotification({
    audienceType: "admin",
    type: "billing",
    priority: "critical",
    title: "Negative balance detected",
    message: `Business ${charge.business_id} is now in negative balance after approving a pending charge.`,
    actionLabel: "Review revenue",
    actionUrl: "/admin/revenue",
    meta: {
      businessId: charge.business_id,
      pendingChargeId: charge.id,
      balanceAfter: Number(walletResult?.balanceAfter || 0),
      approvedBy: req.admin?.email || "admin",
    },
  });
} else if (Number(walletResult?.balanceAfter) > 0 && Number(walletResult?.balanceAfter) < 5) {
  await createNotification({
    audienceType: "admin",
    type: "billing",
    priority: "high",
    title: "Low balance alert",
    message: `Business ${charge.business_id} wallet is low after approving a pending charge.`,
    actionLabel: "Review revenue",
    actionUrl: "/admin/revenue",
    meta: {
      businessId: charge.business_id,
      pendingChargeId: charge.id,
      balanceAfter: Number(walletResult?.balanceAfter || 0),
      approvedBy: req.admin?.email || "admin",
    },
  });
}

    await supabase
      .from("pending_charges")
      .update({
        status: "approved",
        charged_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    return res.json({
      ok: true,
      balance: walletResult.balanceAfter,
      currency: walletResult.currency || "USD",
    });
  } catch (e) {
    console.error("approve pending charge error:", e);
    return res.status(500).json({ error: "Failed to approve" });
  }
});

// =========================
// CANCEL PENDING CHARGE
// =========================
app.post("/api/admin/fraud/pending-charges/:id/cancel", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    const { data: charge, error } = await supabase
      .from("pending_charges")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !charge) {
      return res.status(404).json({ error: "Charge not found" });
    }

    if (charge.status !== "pending") {
      return res.status(400).json({ error: "Already processed" });
    }

    await supabase
      .from("pending_charges")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    return res.json({ ok: true });
  } catch (e) {
    console.error("cancel pending charge error:", e);
    return res.status(500).json({ error: "Failed to cancel" });
  }
});

// =========================
// REFUND CHARGE
// =========================
app.post("/api/admin/fraud/refund/:businessId", requireAdmin, async (req, res) => {
  try {
    const businessId = String(req.params.businessId || "").trim();
    const amount = Number(req.body?.amount || 0);
    const reference = String(req.body?.reference || "").trim();
    const reason = String(req.body?.reason || "Fraud refund").trim();

    if (!businessId) {
      return res.status(400).json({ error: "businessId required" });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const result = await topupBusinessWallet({
      businessId,
      amount,
      note: reason,
      meta: {
        reference,
        refundedBy: req.admin?.email || "admin",
      },
    });

    await createTransaction({
      userId: businessId,
      businessId,
      type: "credit",
      amount,
      currency: result.currency || "USD",
      reason,
      eventType: "fraud_refund",
      reference,
      status: "completed",
      balanceBefore: Number(result.balanceBefore || 0),
      balanceAfter: Number(result.balanceAfter || 0),
      notes: "Manual fraud refund by admin",
      meta: {
        refundedBy: req.admin?.email || "admin",
      },
    });

    async function notifyRefund({
  businessId,
  amount,
  currency,
  balanceAfter,
  reference,
  refundedBy,
}) {
  await emitNotification({
    type: "billing",
    priority: "normal",
    title: "Refund completed",
    message: `Refund ${Number(amount).toFixed(2)} ${currency} for ${businessId}.`,
    actionLabel: "Open revenue page",
    actionUrl: "/admin/revenue",
    meta: {
      businessId,
      amount,
      currency,
      balanceAfter,
      reference: reference || null,
      refundedBy,
    },
    dedupKey: `refund:${businessId}:${reference || "manual"}`,
  });
}

    await createNotification({
  audienceType: "admin",
  type: "billing",
  priority: "normal",
  title: "Refund completed",
  message: `A fraud refund of ${amount} USD was completed for business ${businessId}.`,
  actionLabel: "Open revenue page",
  actionUrl: `/admin/revenue`,
  meta: {
    businessId,
    amount,
    reference,
    refundedBy: req.admin?.email || "admin",
  },
});

    return res.json({
      ok: true,
      balance: result.balanceAfter,
      currency: result.currency || "USD",
    });
  } catch (e) {
    console.error("refund charge error:", e);
    return res.status(500).json({ error: "Failed to refund" });
  }
});

// =========================
// BUSINESS FRAUD SCORES
// =========================
app.get("/api/admin/fraud/business-scores", requireAdmin, async (_req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("anti_fraud_events")
      .select("business_id, risk_score, action_taken, risk_level")
      .not("business_id", "is", null);

    if (error) {
      return res.status(500).json({ error: "Failed to load fraud scores" });
    }

    const scoreMap = new Map();

    for (const e of events || []) {
      const businessId = String(e.business_id || "").trim();
      if (!businessId) continue;

      const current = scoreMap.get(businessId) || {
        businessId,
        suspiciousEvents: 0,
        blockedEvents: 0,
        totalRiskScore: 0,
        averageRiskScore: 0,
      };

      current.suspiciousEvents += 1;
      current.totalRiskScore += Number(e.risk_score || 0);

      if (String(e.action_taken || "") === "block") {
        current.blockedEvents += 1;
      }

      scoreMap.set(businessId, current);
    }

    const scores = [...scoreMap.values()].map((row) => ({
      ...row,
      averageRiskScore:
        row.suspiciousEvents > 0
          ? Math.round((row.totalRiskScore / row.suspiciousEvents) * 10) / 10
          : 0,
    }));

    return res.json({
      ok: true,
      scores,
    });
  } catch (e) {
    console.error("business fraud scores error:", e);
    return res.status(500).json({ error: "Failed to load business fraud scores" });
  }
});

// =========================
// ADMIN REVENUE
// =========================
// =========================
// ADMIN REVENUE
// =========================
app.get("/api/admin/revenue", requireAdmin, async (_req, res) => {
  try {
    const [
      businessesRes,
      transactionsRes,
      pendingChargesRes,
      topupOrdersRes,
      fraudEventsRes,
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, name_ar, wallet_balance"),

      supabase
        .from("transactions")
        .select("amount, type, status, event_type, business_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),

      supabase
        .from("pending_charges")
        .select("amount, status, business_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),

      supabase
        .from("topup_orders")
        .select("amount, status, business_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),

      supabase
        .from("anti_fraud_events")
        .select("business_id, action_taken, risk_level, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    const businesses = businessesRes?.data || [];
    const transactions = transactionsRes?.data || [];
    const pendingCharges = pendingChargesRes?.data || [];
    const topupOrders = topupOrdersRes?.data || [];
    const fraudEvents = fraudEventsRes?.data || [];

    const safeNumber = (value) => Number(value || 0);

    const totalWalletExposure = businesses.reduce(
      (sum, b) => sum + safeNumber(b.wallet_balance),
      0
    );

    const lowBalanceBusinesses = businesses.filter((b) => {
      const bal = safeNumber(b.wallet_balance);
      return bal > 0 && bal < 5;
    }).length;

    const negativeBalanceBusinesses = businesses.filter(
      (b) => safeNumber(b.wallet_balance) < 0
    ).length;

    // ✅ Revenue should only count billed conversation-start debits
    const completedDebits = transactions.filter((t) => {
      const type = String(t.type || "").toLowerCase();
      const status = String(t.status || "completed").toLowerCase();
      const eventType = String(t.event_type || "").toLowerCase();

      return (
        type === "debit" &&
        status === "completed" &&
        eventType.startsWith("conversation_start")
      );
    });

    const completedCredits = transactions.filter((t) => {
      const type = String(t.type || "").toLowerCase();
      const status = String(t.status || "completed").toLowerCase();
      return type === "credit" && status === "completed";
    });

    const totalRevenue = completedDebits.reduce(
      (sum, t) => sum + safeNumber(t.amount),
      0
    );

    const totalRefunds = completedCredits
      .filter((t) => String(t.event_type || "").toLowerCase() === "fraud_refund")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const approvedPendingAmount = pendingCharges
      .filter((p) => String(p.status || "").toLowerCase() === "approved")
      .reduce((sum, p) => sum + safeNumber(p.amount), 0);

    const openPendingAmount = pendingCharges
      .filter((p) => String(p.status || "").toLowerCase() === "pending")
      .reduce((sum, p) => sum + safeNumber(p.amount), 0);

    const totalTopups = topupOrders
      .filter((o) => String(o.status || "").toLowerCase() === "paid")
      .reduce((sum, o) => sum + safeNumber(o.amount), 0);

    const totalCharges = completedDebits.length;
    const avgRevenuePerLead = totalCharges > 0 ? totalRevenue / totalCharges : 0;

    const blockedFraudCount = fraudEvents.filter(
      (e) => String(e.action_taken || "").toLowerCase() === "block"
    ).length;

    const holdFraudCount = fraudEvents.filter((e) => {
      const action = String(e.action_taken || "").toLowerCase();
      return action === "hold" || action === "billing_hold";
    }).length;

    const suspiciousFraudCount = fraudEvents.filter((e) =>
      ["medium", "high", "critical"].includes(
        String(e.risk_level || "").toLowerCase()
      )
    ).length;

    const businessMap = new Map();

    businesses.forEach((b) => {
      businessMap.set(String(b.id), {
        id: b.id,
        name: b.name || b.name_ar || String(b.id),
        walletBalance: safeNumber(b.wallet_balance),
        suspiciousEvents: 0,
        blockedEvents: 0,
        holdEvents: 0,
        totalRevenue: 0,
        totalCharges: 0,
        totalRefunds: 0,
        roi: 0,
      });
    });

    completedDebits.forEach((t) => {
      const id = String(t.business_id || "");
      if (!businessMap.has(id)) return;

      const row = businessMap.get(id);
      row.totalRevenue += safeNumber(t.amount);
      row.totalCharges += 1;
    });

    completedCredits.forEach((t) => {
      if (String(t.event_type || "").toLowerCase() !== "fraud_refund") return;

      const id = String(t.business_id || "");
      if (!businessMap.has(id)) return;

      const row = businessMap.get(id);
      row.totalRefunds += safeNumber(t.amount);
    });

    fraudEvents.forEach((e) => {
      const id = String(e.business_id || "");
      if (!businessMap.has(id)) return;

      const row = businessMap.get(id);
      row.suspiciousEvents += 1;

      const action = String(e.action_taken || "").toLowerCase();
      if (action === "block") row.blockedEvents += 1;
      if (action === "hold" || action === "billing_hold") row.holdEvents += 1;
    });

    businessMap.forEach((row) => {
      row.roi = row.totalRevenue - row.totalRefunds;
    });

    const topRevenueBusinesses = [...businessMap.values()]
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10);

    const revenueByDayMap = new Map();
    completedDebits.forEach((t) => {
      const date = String(t.created_at || "").slice(0, 10);
      if (!date) return;

      revenueByDayMap.set(
        date,
        (revenueByDayMap.get(date) || 0) + safeNumber(t.amount)
      );
    });

    const revenueTrend = [...revenueByDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(2)),
      }));

    const refundsByDayMap = new Map();
    completedCredits
      .filter((t) => String(t.event_type || "").toLowerCase() === "fraud_refund")
      .forEach((t) => {
        const date = String(t.created_at || "").slice(0, 10);
        if (!date) return;

        refundsByDayMap.set(
          date,
          (refundsByDayMap.get(date) || 0) + safeNumber(t.amount)
        );
      });

    const refundTrend = [...refundsByDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(2)),
      }));

    const netRevenue = totalRevenue - totalRefunds;

    return res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      data: {
        totalWalletExposure: Number(totalWalletExposure.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalRefunds: Number(totalRefunds.toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        totalTopups: Number(totalTopups.toFixed(2)),
        approvedPendingAmount: Number(approvedPendingAmount.toFixed(2)),
        openPendingAmount: Number(openPendingAmount.toFixed(2)),
        lowBalanceBusinesses,
        negativeBalanceBusinesses,
        businessCount: businesses.length,
        transactionCount: transactions.length,
        totalCharges,
        avgRevenuePerLead: Number(avgRevenuePerLead.toFixed(2)),
        blockedFraudCount,
        holdFraudCount,
        suspiciousFraudCount,
        topRevenueBusinesses,
        revenueTrend,
        refundTrend,
      },
    });
  } catch (e) {
    console.error("admin revenue error:", e);
    return res.status(500).json({
      ok: false,
      error: "Failed to load revenue data",
    });
  }
});
// =========================
// ADMIN INSIGHTS
// =========================
app.get("/api/admin/insights", requireAdmin, async (_req, res) => {
  try {
    const [
      statsRes,
      fraudOverviewRes,
      revenueRes,
    ] = await Promise.all([
      Promise.all([listAllUsers(), listAllBusinesses()]),
      (async () => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const today = startOfDay.toISOString();

        const { data: fraudRows } = await supabase
          .from("anti_fraud_events")
          .select("risk_level, action_taken, business_id, created_at")
          .gte("created_at", today);

        const { count: pendingCount } = await supabase
          .from("pending_charges")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        const rows = fraudRows || [];

        return {
          suspiciousToday: rows.filter((e) =>
            ["medium", "high", "critical"].includes(String(e.risk_level || ""))
          ).length,
          blockedToday: rows.filter((e) => String(e.action_taken || "") === "block").length,
          heldToday: rows.filter((e) =>
            ["hold", "billing_hold"].includes(String(e.action_taken || ""))
          ).length,
          duplicateNoChargeToday: rows.filter(
            (e) => String(e.action_taken || "") === "allow_duplicate_no_charge"
          ).length,
          pendingCharges: pendingCount || 0,
        };
      })(),
      (async () => {
        const { data: businesses } = await supabase.from("businesses").select("*");
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);

        const biz = businesses || [];
        const tx = transactions || [];

        const totalRevenue = tx
          .filter(
            (t) =>
              String(t.type || "").toLowerCase() === "debit" &&
              String(t.status || "completed").toLowerCase() === "completed"
          )
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const lowBalanceBusinesses = biz.filter((b) => {
          const bal = Number(b.wallet_balance || 0);
          return bal > 0 && bal < 5;
        }).length;

        const negativeBalanceBusinesses = biz.filter(
          (b) => Number(b.wallet_balance || 0) < 0
        ).length;

        return {
          totalRevenue,
          lowBalanceBusinesses,
          negativeBalanceBusinesses,
        };
      })(),
    ]);

    const users = statsRes[0] || [];
    const businesses = statsRes[1] || [];
    const fraud = fraudOverviewRes;
    const revenue = revenueRes;

    const lines = [];

    lines.push(
      `Platform snapshot: ${businesses.length} businesses and ${users.length} users are currently registered.`
    );

    if (revenue.totalRevenue > 0) {
      lines.push(
        `Revenue signal: completed billed activity has generated ${revenue.totalRevenue.toFixed(
          2
        )} USD so far.`
      );
    } else {
      lines.push(`Revenue signal: no meaningful billed revenue has been recorded yet.`);
    }

    if (fraud.suspiciousToday > 0 || fraud.blockedToday > 0 || fraud.heldToday > 0) {
      lines.push(
        `Risk signal: today recorded ${fraud.suspiciousToday} suspicious events, ${fraud.blockedToday} blocked events, and ${fraud.heldToday} held events.`
      );
    } else {
      lines.push(`Risk signal: fraud activity is currently stable with no major escalation today.`);
    }

    if (fraud.pendingCharges > 0) {
      lines.push(
        `Operations signal: ${fraud.pendingCharges} pending charges need review to prevent revenue leakage or delayed decisions.`
      );
    }

    if (revenue.lowBalanceBusinesses > 0) {
      lines.push(
        `Billing readiness: ${revenue.lowBalanceBusinesses} businesses are running on low wallet balance and may require top-up soon.`
      );
    }

    if (revenue.negativeBalanceBusinesses > 0) {
      lines.push(
        `Account health: ${revenue.negativeBalanceBusinesses} businesses are already in negative balance and should be reviewed immediately.`
      );
    }

    if (fraud.duplicateNoChargeToday > 0) {
      lines.push(
        `Protection signal: ${fraud.duplicateNoChargeToday} duplicate no-charge events were prevented by the anti-fraud engine today.`
      );
    }

    lines.push(
      `Recommended focus: monitor pending charges, low-balance businesses, and unusual fraud spikes while maintaining revenue continuity.`
    );

    return res.json({
      ok: true,
      insight: lines.join("\n\n"),
    });
  } catch (e) {
    console.error("admin insights error:", e);
    return res.status(500).json({ ok: false, error: "Failed to load admin insights" });
  }
});

// =========================
// ADMIN AI SUMMARY
// =========================
app.post("/api/admin/ai-summary", requireAdmin, async (_req, res) => {
  try {
    const [
      { data: businesses },
      { data: transactions },
      { data: fraudEvents },
      { count: pendingCount },
    ] = await Promise.all([
      supabase.from("businesses").select("*"),
      supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("anti_fraud_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("pending_charges")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const biz = businesses || [];
    const tx = transactions || [];
    const fraud = fraudEvents || [];

    const totalRevenue = tx
      .filter(
        (t) =>
          String(t.type || "").toLowerCase() === "debit" &&
          String(t.status || "completed").toLowerCase() === "completed"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const refunds = tx
      .filter((t) => String(t.event_type || "").toLowerCase() === "fraud_refund")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const blocked = fraud.filter((e) => String(e.action_taken || "") === "block").length;
    const held = fraud.filter((e) =>
      ["hold", "billing_hold"].includes(String(e.action_taken || ""))
    ).length;
    const suspicious = fraud.filter((e) =>
      ["medium", "high", "critical"].includes(String(e.risk_level || ""))
    ).length;
    const duplicateSaved = fraud.filter(
      (e) => String(e.action_taken || "") === "allow_duplicate_no_charge"
    ).length;

    const lowBalance = biz.filter((b) => {
      const bal = Number(b.wallet_balance || 0);
      return bal > 0 && bal < 5;
    }).length;

    const negativeBalance = biz.filter((b) => Number(b.wallet_balance || 0) < 0).length;

    const summary = [
      `Trusted Links executive summary: ${biz.length} businesses are active in the current operating dataset.`,
      `Revenue status: billed transaction value stands at ${totalRevenue.toFixed(2)} USD, while recorded fraud refunds total ${refunds.toFixed(2)} USD.`,
      `Fraud status: ${suspicious} suspicious events were detected, with ${blocked} blocked and ${held} held for manual or delayed review.`,
      `Protection impact: the platform prevented ${duplicateSaved} duplicate no-charge events through its anti-fraud protection layer.`,
      `Operational pressure: ${pendingCount || 0} pending charges remain open, ${lowBalance} businesses are on low balance, and ${negativeBalance} are in negative balance.`,
      `Recommended action: review pending charges first, push top-up actions for low-balance businesses, and continue monitoring fraud patterns around repeated device or fingerprint activity.`,
    ].join("\n\n");

    return res.json({
      ok: true,
      summary,
    });
  } catch (e) {
    console.error("admin ai summary error:", e);
    return res.status(500).json({ ok: false, error: "Failed to generate AI summary" });
  }
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

app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

app.get("/api/admin/notifications/unread-count", requireAdmin, async (req, res) => {
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  res.json({ count: count || 0 });
});

app.post("/api/admin/notifications/:id/read", requireAdmin, async (req, res) => {
  const { id } = req.params;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  res.json({ ok: true });
});


// ============================================================================
// WhatsApp Helpers - Compact Production Version
// ============================================================================

function detectLanguage(text = "") {
  return /[\u0600-\u06FF]/.test(String(text || "")) ? "ar" : "en";
}

function isGreeting(text = "") {
  return /^(hi|hello|hey|مرحبا|اهلا|أهلا|هلا|سلام)$/i.test(
    String(text || "").trim()
  );
}

function isHelpCommand(text = "") {
  return /^(help|start|مساعدة|ابدأ)$/i.test(String(text || "").trim());
}

function isThanks(text = "") {
  return /^(thanks|thank you|شكرا|شكرًا)$/i.test(String(text || "").trim());
}

function getWelcomeMessage(lang = "ar") {
  return lang === "ar"
    ? "مرحبًا بك في TrustedLinks 👋\n\nاكتب اسم شركة أو نوع نشاط للبحث.\n\nمثال:\n• مطعم\n• قهوة\n• صيدلية\n• أقرب مطعم"
    : "Welcome to TrustedLinks 👋\n\nType a business name or category to search.\n\nExample:\n• restaurant\n• coffee\n• pharmacy\n• nearest restaurant";
}

function normalizeNearbyText(text = "") {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNearbyIntent(text = "", session = {}) {
  const raw = String(text || "").trim();
  const q = normalizeNearbyText(raw);

  if (!q) {
    return { isNearby: false, categoryQuery: "", source: "empty" };
  }

  const nearbySignals = [
    "اقرب",
    "قريب",
    "قريبه",
    "قريب مني",
    "قريبه مني",
    "حولي",
    "حولينا",
    "جنب",
    "جنبي",
    "جنبنا",
    "بالقرب",
    "بالقرب مني",
    "ناحيتي",
    "بجانبي",
    "وين اقرب",
    "هات الاقرب",
    "الاقرب",
    "في المنطقه",
    "بالمنطقه",
    "داخل المول",
    "في المول",
    "نفس المول",
    "near me",
    "nearest",
    "closest",
    "nearby",
    "around me",
    "around us",
    "close to me",
    "near",
    "in the mall",
    "inside mall",
    "inside the mall",
  ];

  const contextualNearbyAnswers = [
    "قريب",
    "قريبه",
    "اقرب",
    "الاقرب",
    "حولي",
    "حولينا",
    "جنبنا",
    "جنب",
    "داخل المول",
    "في المول",
    "near",
    "nearby",
    "nearest",
    "closest",
  ];

  const hasNearbySignal = nearbySignals.some((signal) =>
    q.includes(normalizeNearbyText(signal))
  );

  const isContextNearby =
    session?.state === "awaiting_refinement" &&
    contextualNearbyAnswers.includes(q);

  if (!hasNearbySignal && !isContextNearby) {
    return { isNearby: false, categoryQuery: "", source: "none" };
  }

  let categoryQuery = q;

  const cleanupPatterns = [
    /وين اقرب/g,
    /هات الاقرب/g,
    /الاقرب/g,
    /اقرب/g,
    /قريب مني/g,
    /قريبه مني/g,
    /قريب/g,
    /قريبه/g,
    /مني/g,
    /حولي/g,
    /حولينا/g,
    /جنبنا/g,
    /جنبي/g,
    /جنب/g,
    /بالقرب مني/g,
    /بالقرب/g,
    /ناحيتي/g,
    /بجانبي/g,
    /في المنطقه/g,
    /بالمنطقه/g,
    /داخل المول/g,
    /في المول/g,
    /نفس المول/g,
    /near me/g,
    /nearest/g,
    /closest/g,
    /nearby/g,
    /around me/g,
    /around us/g,
    /close to me/g,
    /inside the mall/g,
    /inside mall/g,
    /in the mall/g,
    /near/g,
  ];

  cleanupPatterns.forEach((pattern) => {
    categoryQuery = categoryQuery.replace(pattern, " ");
  });

  categoryQuery = categoryQuery.replace(/\s+/g, " ").trim();

  if (!categoryQuery && session?.last_query) {
    categoryQuery = session.last_query;
  }

  return {
    isNearby: true,
    categoryQuery,
    source: isContextNearby ? "conversation_context" : "rules",
  };
}

// ============================================================================
// Search Cache
// ============================================================================

const SEARCH_CACHE_TTL_MS = 60 * 1000;
const searchCache = new Map();

function getCacheKey(type = "search", query = "", lang = "ar") {
  return `${type}:${lang}:${String(query || "").toLowerCase().trim()}`;
}

function getCached(key) {
  const cached = searchCache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    searchCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCached(key, data, ttlMs = SEARCH_CACHE_TTL_MS) {
  searchCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

async function searchBusinessesFast({ query, lang }) {
  const key = getCacheKey("search", query, lang);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await searchBusinesses({ query, lang });

  const safeData = {
    ...data,
    results: Array.isArray(data?.results) ? data.results.slice(0, 4) : [],
  };

  setCached(key, safeData);

  return safeData;
}

function resolveIntentType(intentData = {}) {
  if (intentData.isNearby) return "nearby";
  if (intentData.intent === "brand") return "direct";
  if (intentData.intent === "category") return "category";
  return "direct";
}

async function enrichTopOnly({
  results = [],
  query = "",
  userPhone = "",
  intentType = "category",
}) {
  if (!Array.isArray(results) || results.length === 0) return [];

  const finalIntentType = intentType || "category";

  console.log("ENRICH_INTENT_DEBUG", {
    query,
    intentType,
    finalIntentType,
    resultCount: results.length,
  });

  const resultsToEnrich = results.slice(0, 4);

  const enrichedResults = await enrichTopResultWithTrackedLink({
    items: resultsToEnrich,
    query,
    userPhone,
    intentType: finalIntentType,
  });

  return enrichedResults;
}

function normalizeIntentType(intentData = {}, query = "") {
  const q = String(query || "").trim().toLowerCase();

  // nearby intent
  if (
    intentData?.isNearby ||
    intentData?.intent === "nearby" ||
    q.includes("near me") ||
    q.includes("قريب") ||
    q.includes("قريبة") ||
    q.includes("حولي") ||
    q.includes("جنب")
  ) {
    return "nearby";
  }

  // direct business / brand search
  if (
    intentData?.intent === "brand" ||
    intentData?.isBrandSearch === true
  ) {
    return "direct";
  }

  // category search
  if (intentData?.intent === "category") {
    return "category";
  }

  // smart fallback
  if (q.split(" ").length <= 2) {
    return "direct";
  }

  return "category";
}
// ============================================================================
// WhatsApp Webhook - Production Fast Version
// ============================================================================

app.post("/webhooks/javna/whatsapp", async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const body = req.body || {};

    if (body.eventScope !== "whatsapp" || body.event !== "wa.message.received") {
      return;
    }

    const from = cleanDigits(body.from || body?.data?.from || "");
    if (!from) return;

    const messageType = body?.data?.type || "";
    const incomingLocation = body?.data?.location || null;
    const incomingText = String(body?.data?.text?.text || body?.data?.text || "").trim();

    const lang = detectLanguage(incomingText);
    const normalizedQuery = normalizeSearchText(incomingText);

    const conversationDecision = await understandConversationMessage({
  userPhone: from,
  message: incomingText,
});

console.log("CONVERSATION_DECISION_DEBUG", {
  message: incomingText,
  messageType: conversationDecision.messageType,
  action: conversationDecision.action,
});

    // Greeting / Help
    if (messageType === "text" && (isGreeting(incomingText) || isHelpCommand(incomingText))) {
      return javnaSendText({
        to: from,
        body: getWelcomeMessage(lang),
      }).catch(console.error);
    }

    // Thanks
    if (messageType === "text" && isThanks(incomingText)) {
      return javnaSendText({
        to: from,
        body: lang === "ar" ? "على الرحب والسعة 😊" : "You're welcome 😊",
      }).catch(console.error);
    }

    // Location Search
    if (
      messageType === "location" &&
      incomingLocation?.latitude &&
      incomingLocation?.longitude
    ) {
      const lat = Number(incomingLocation.latitude);
      const lng = Number(incomingLocation.longitude);

      const pendingNearby = getPendingNearby(from);
      const categoryQuery = pendingNearby?.category || "";

      const nearestResults = await findNearestBusinesses(lat, lng, 3, categoryQuery);

      const enrichedResults = await enrichTopOnly({
        results: nearestResults || [],
        query: categoryQuery || pendingNearby?.rawQuery || "",
        userPhone: from,
        intentType: "nearby",
      });

      clearPendingNearby(from);

      const reply = formatNearestResults(
        enrichedResults,
        lang,
        categoryQuery || pendingNearby?.rawQuery || ""
      );

      return javnaSendText({
        to: from,
        body: reply,
      }).catch(console.error);
    }

    // Empty Text
    if (!normalizedQuery) {
      return javnaSendText({
        to: from,
        body:
          lang === "ar"
            ? "اكتب اسم شركة أو نوع نشاط."
            : "Send a business name or category.",
      }).catch(console.error);
    }

    // Conversation Result Selection
if (
  conversationDecision.messageType ===
  MESSAGE_TYPES.RESULT_SELECTION
) {
  const selected = conversationDecision.payload?.result;

  if (selected?.trackedLink) {
    return javnaSendText({
      to: from,
      body:
        lang === "ar"
          ? `تفضل رابط التواصل:\n${selected.trackedLink}`
          : `Here is the business link:\n${selected.trackedLink}`,
    }).catch(console.error);
  }
}

// Reset Conversation
if (
  conversationDecision.messageType ===
  MESSAGE_TYPES.RESET
) {
  return javnaSendText({
    to: from,
    body:
      lang === "ar"
        ? "تم بدء بحث جديد، ماذا تبحث عنه؟"
        : "Started a new search. What are you looking for?",
  }).catch(console.error);
}

// Refinement Answer
if (
  conversationDecision.messageType ===
  MESSAGE_TYPES.REFINEMENT_ANSWER
) {
  console.log("REFINEMENT_ANSWER_DEBUG", {
    payload: conversationDecision.payload,
  });

  const lastQuery =
    conversationDecision.session?.last_query ||
    conversationDecision.session?.lastQuery ||
    "";

  const answerValue =
    conversationDecision.payload?.value || "";

  const ignoredAnswers = [
    "اي شي",
    "أي شي",
    "اي شيء",
    "أي شيء",
    "مش مهم",
    "عادي",
    "نعم",
    "yes",
    "anything",
  ];

  const normalizedAnswer = normalizeSearchText(answerValue);

  const refinedQuery = ignoredAnswers
    .map((x) => normalizeSearchText(x))
    .includes(normalizedAnswer)
      ? lastQuery
      : `${lastQuery} ${answerValue}`.trim();

  const refinedIntentData = parseSearchIntent(refinedQuery);
  const refinedEffectiveQuery =
    refinedIntentData.categoryQuery ||
    normalizeSearchText(refinedQuery);

  const refinedIntentType = normalizeIntentType(
    refinedIntentData,
    refinedQuery
  );

  console.log("REFINEMENT_APPLY_DEBUG", {
    lastQuery,
    answerValue,
    refinedQuery,
    refinedEffectiveQuery,
    refinedIntentType,
  });

const searchData = await searchBusinesses({
  query: effectiveQuery,
  lang,
  intentType,
  isNearby: nearbyIntent?.isNearby || false,
});

  if (
    !searchData?.results ||
    searchData.results.length === 0
  ) {
    return javnaSendText({
      to: from,
      body:
        lang === "ar"
          ? "لم أجد نتائج مناسبة لهذا التفضيل. جرّب وصفًا آخر أو اكتب بحثًا جديدًا."
          : "I couldn’t find suitable results for that preference. Try another description or start a new search.",
    }).catch(console.error);
  }

  const enrichedResults = await enrichTopOnly({
    results: searchData.results || [],
    query: refinedEffectiveQuery,
    userPhone: from,
    intentType: refinedIntentType,
  });

  await saveSearchSession({
    userPhone: from,
    query: refinedEffectiveQuery,
    intentType: refinedIntentType,
    results: enrichedResults,
    needsRefinement: false,
  });

  const reply = formatSearchResponse(
    {
      ...searchData,
      mode: "results",
      results: enrichedResults,
    },
    lang
  );

  return javnaSendText({
    to: from,
    body: reply,
  }).catch(console.error);
}
    // Nearby Intent
  const nearbyIntent = parseNearbyIntent(
  incomingText,
  conversationDecision.session
);

    if (nearbyIntent.isNearby) {
      setPendingNearby(from, {
        category: nearbyIntent.categoryQuery || "",
        rawQuery: incomingText,
      });

      return javnaSendText({
        to: from,
        body:
          lang === "ar"
            ? "📍 أرسل موقعك الحالي لأعرض لك أقرب النتائج."
            : "📍 Please share your location so I can show nearest results.",
      }).catch(console.error);
    }

    // Normal Intent
   const effectiveIncomingText =
  conversationDecision.payload?.query || incomingText;

const intentData = parseSearchIntent(
  effectiveIncomingText
);
    
const effectiveQuery =
  intentData.categoryQuery ||
  normalizeSearchText(effectiveIncomingText);
    
const intentType = normalizeIntentType(intentData, incomingText);

console.log("INTENT_DEBUG", {
  query: incomingText,
  effectiveQuery,
  intentData,
  intentType,
});

   // Search Fast - TEMP PERFORMANCE TEST
const t0 = Date.now();

const searchTimerId = `SEARCH_TOTAL_${Date.now()}_${Math.random()}`;
console.time(searchTimerId);

console.time("searchBusinessesFast");
const searchData = await searchBusinesses({
  query: effectiveQuery,
  lang,
  intentType,
  isNearby: nearbyIntent?.isNearby || false,
});
console.timeEnd("searchBusinessesFast");

    console.log("SEARCH_RESULT_DEBUG", {
  query: effectiveQuery,
  mode: searchData?.mode,
  totalMatched: searchData?.totalMatched,
  resultCount: searchData?.results?.length,
  firstResult: searchData?.results?.[0]?.name || searchData?.results?.[0]?.name_ar || null,
});

    // Learn failed searches
if (
  searchData?.mode === "results" &&
  Number(searchData?.totalMatched || 0) === 0
) {
  try {
    await supabase.from("search_no_results").insert({
      query: incomingText,
      normalized_query: normalizeSearchText(incomingText),
      lang,
      intent: intentType,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("NO_RESULT_LOG_ERROR", err);
  }
}

// Refinement
if (searchData.mode === "refinement_required") {
  console.timeEnd(searchTimerId);
  console.log("TOTAL USER REPLY TIME:", Date.now() - t0, "ms");

  await saveSearchSession({
    userPhone: from,
    query: effectiveQuery,
    intentType,
    results: searchData.results || [],
    needsRefinement: true,
  });

  return javnaSendText({
    to: from,
    body: formatSingleRefinementQuestion({
      query: effectiveQuery,
      lang,
      answers: {
        preference: "",
        area: "",
        priority: "",
      },
      step: 0,
    }),
  }).catch(console.error);
}
    
const enrichTimer = `enrichTopOnly_${Date.now()}_${Math.random()}`;
console.time(enrichTimer);

const enrichedResults = await enrichTopOnly({
  results: searchData.results || [],
  query: searchData.effectiveQuery || effectiveQuery,
  userPhone: from,
  intentType,
});

    await saveSearchSession({
  userPhone: from,
  query: effectiveQuery,
  intentType,
  results: enrichedResults,
  needsRefinement:
    searchData?.mode === "refinement_required",
});
  

console.timeEnd(enrichTimer);

    console.log(
  "ENRICHED_LINKS_DEBUG",
  enrichedResults.map((r) => ({
    id: r.id,
    name: r.name,
    name_ar: r.name_ar,
    trackedLink: r.trackedLink,
  }))
);

const formatTimer = `formatSearchResponse_${Date.now()}_${Math.random()}`;
console.time(formatTimer);
    
const reply = formatSearchResponse(
  {
    ...searchData,
    results: enrichedResults,
  },
  lang
);

console.timeEnd(formatTimer);
    
javnaSendText({
  to: from,
  body: reply,
}).catch((err) => {
  console.error("JAVNA SEND ERROR:", err);
});

return;
    
      } catch (e) {
    console.error("WHATSAPP WEBHOOK ERROR:", e);
  }
});

app.post("/api/create-lead", async (req, res) => {
  try {
    const businessId = String(req.body?.businessId || "").trim();

    if (!businessId) {
      return res.status(400).json({
        error: "businessId is required",
      });
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, whatsapp, status")
      .eq("id", businessId)
      .maybeSingle();

    if (businessError) throw businessError;

    if (!business) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    const rawPhone = String(business.whatsapp || "").trim();

    if (!rawPhone) {
      return res.status(400).json({
        error: "Business WhatsApp number is missing",
      });
    }

   const token = await createLeadToken({
  businessId,
  businessPhone: rawPhone,
  userPhone: "",
  query: req.body?.source || "website_search",
  intentType: req.body?.intentType || "category",
});

    return res.json({
      success: true,
      token: token.id,
      link: `${process.env.BASE_URL || "https://trustedlinks.net"}/l/${token.id}`,
    });
  } catch (err) {
    console.error("Create lead error:", err);
    return res.status(500).json({
      error: "Failed to create lead",
    });
  }
});
// ============================================================================
// LEAD TRACKED REDIRECT
// ============================================================================

app.get("/l/:token", async (req, res) => {
  try {
    const tokenId = String(req.params.token || "").trim();

    if (!tokenId) {
      return res.status(400).send("Invalid lead token");
    }

    console.log("LEAD_TEST_START", { tokenId });

    const tokenRow = await getLeadTokenById(tokenId);

    if (!tokenRow) {
      return res.status(404).send("Lead link not found");
    }

    const businessId = String(
      tokenRow.business_id ||
        tokenRow.businessId ||
        ""
    ).trim();

    if (!businessId) {
      console.error("Lead token missing businessId", { tokenId, tokenRow });
      return res.status(400).send("Invalid lead token business");
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return res.status(410).send("Lead link expired");
    }

  const intentType =
  String(tokenRow.intent_type || tokenRow.intentType || "category").trim() ||
  "category";

    console.log("LEAD_TEST_TOKEN_LOADED", {
      tokenId,
      businessId,
      intentType,
    });

    const rawBusinessPhone =
      tokenRow.business_phone ||
      tokenRow.businessPhone ||
      "";

    let safePhone = String(rawBusinessPhone).replace(/\D/g, "");

    if (safePhone.startsWith("0")) {
      safePhone = `962${safePhone.slice(1)}`;
    }

    if (!safePhone.startsWith("962") && safePhone.length === 9) {
      safePhone = `962${safePhone}`;
    }

    if (!safePhone) {
      return res.status(400).send("Invalid business phone");
    }

    const message = "Hello, I found you on TrustedLinks";
    const waUrl = `https://wa.me/${safePhone}?text=${encodeURIComponent(
      message
    )}`;
    const fallbackUrl = `whatsapp://send?phone=${safePhone}&text=${encodeURIComponent(
      message
    )}`;

    const redirectHtml = `
      <html>
        <head>
          <meta http-equiv="refresh" content="0; url=${waUrl}" />
          <script>
            setTimeout(function() {
              window.location.href = "${fallbackUrl}";
            }, 500);
          </script>
        </head>
        <body>
          Redirecting to WhatsApp...
        </body>
      </html>
    `;

    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    const userAgent = String(req.headers["user-agent"] || "");
    const acceptLanguage = String(req.headers["accept-language"] || "");
    const platform = String(req.headers["sec-ch-ua-platform"] || "");

    const fingerprint = buildFingerprint({
      ip,
      userAgent,
      acceptLanguage,
      platform,
    });

    const userPhoneHash = hashFraudPhone(
      tokenRow.user_phone ||
        tokenRow.userPhone ||
        ""
    );

    const hasConsent =
      tokenRow.consent_snapshot_id || tokenRow.consentSnapshotId;

    if (!hasConsent) {
      const accepted = String(req.query.acceptConsent || "") === "1";

      const rawLang =
  tokenRow.language ||
  tokenRow.lang ||
  tokenRow.search_lang ||
  tokenRow.searchLang ||
  "";

const rawQuery = String(
  tokenRow.query ||
  tokenRow.search_query ||
  tokenRow.searchQuery ||
  ""
);

const looksEnglish = /[a-zA-Z]/.test(rawQuery) && !/[\u0600-\u06FF]/.test(rawQuery);

const pageLang = rawLang || (looksEnglish ? "en" : "ar");
const isAr = pageLang === "ar";

      if (!accepted) {
  
const isAr = pageLang === "ar";

const title = isAr ? "المتابعة إلى واتساب" : "Continue to WhatsApp";
const message = isAr
  ? "سيقوم TrustedLinks بتحويلك بأمان إلى النشاط التجاري المختار عبر واتساب."
  : "TrustedLinks will safely redirect you to the selected business on WhatsApp.";

const buttonText = isAr ? "أوافق وأكمل إلى واتساب" : "Agree and continue to WhatsApp";
const loadingText = isAr ? "جاري فتح واتساب..." : "Opening WhatsApp...";
const note = isAr ? "سيتم فتح واتساب بعد التأكيد." : "WhatsApp will open after confirmation.";

return res.send(`
<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #f0fdf4, #ffffff);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 22px;
      color: #102018;
    }

    .card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border-radius: 24px;
      padding: 30px 26px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.10);
      border: 1px solid #e7f5ec;
      text-align: center;
    }

    .logo {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      margin: 0 auto 18px;
      background: #0A7C55;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      font-weight: bold;
    }

    h2 {
      margin: 10px 0 18px;
      font-size: 27px;
      color: #0A7C55;
    }

    p {
      margin: 10px 0;
      line-height: 1.8;
      font-size: 16px;
      color: #475569;
    }

    .button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #0A7C55;
      color: white;
      padding: 16px 18px;
      border-radius: 16px;
      margin-top: 26px;
      text-decoration: none;
      font-weight: bold;
      font-size: 17px;
      transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
    }

    .button:active { transform: scale(0.97); }

    .button.loading {
      background: #075f42;
      opacity: 0.9;
      pointer-events: none;
      transform: scale(0.98);
    }

    .spinner {
      width: 19px;
      height: 19px;
      border: 2px solid rgba(255,255,255,0.5);
      border-top-color: white;
      border-radius: 50%;
      display: none;
      animation: spin 0.75s linear infinite;
    }

    .button.loading .spinner {
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .note {
      margin-top: 14px;
      font-size: 13px;
      color: #64748b;
    }
  </style>
</head>

<body>
  <div class="card">
    <div class="logo">✓</div>

    <h2>${title}</h2>
    <p>${message}</p>

    <a
      id="continueBtn"
      class="button"
      href="/l/${encodeURIComponent(tokenId)}?acceptConsent=1"
    >
      <span class="spinner"></span>
      <span id="btnText">${buttonText}</span>
    </a>

    <div class="note">${note}</div>
  </div>

 <script>
  const btn = document.getElementById("continueBtn");
  const btnText = document.getElementById("btnText");

  btn.addEventListener("click", function () {
    btn.classList.add("loading");
    btnText.textContent = "${loadingText}";
  });
</script>
</body>
</html>
`);
              }

      const { data: consentRow, error } = await supabase
        .from("privacy_consents")
        .insert({
          user_phone_hash: userPhoneHash || null,
          session_id: `lead-${tokenId}`,
          service_consent: true,
          profiling_consent: true,
          marketing_consent: false,
          status: "granted",
          policy_version: "v1.0",
          language: "ar",
          source: "lead_redirect",
          ip_hash: hashValue(ip || ""),
          user_agent: userAgent || "",
          proof_json: {
            tokenId,
            acceptedAt: new Date().toISOString(),
          },
        })
        .select("id")
        .single();

      if (error) {
        console.error("Consent insert error:", error);
        return res.status(500).send("Error. Try again.");
      }

      await supabase
        .from("lead_tokens")
        .update({
          consent_snapshot_id: consentRow.id,
        })
        .eq("id", tokenId);

      tokenRow.consent_snapshot_id = consentRow.id;
    }

    const signals = await analyzeLeadSignals({
      businessId,
      tokenId,
      ip,
      fingerprint,
      userPhoneHash,
      userAgent,
    });

    const risk = calculateRiskScore(signals);

    const chargeKey = buildChargeKey({
      businessId,
      userPhoneHash,
      fingerprint,
      ip,
      userAgent,
    });

    const existingLock = await findActiveChargeLock(chargeKey);

    console.log("LEAD_TEST_EXISTING_LOCK", {
      tokenId,
      existingLock: !!existingLock,
      lockId: existingLock?.id || null,
    });

    let actionTaken = risk.action;
    let charged = false;

    if (existingLock) {
      actionTaken = "allow";
      risk.reasonCodes.push("DUPLICATE_WITHIN_WINDOW");
    }

    if (risk.action === "block") {
      const fraudMeta = {
        businessId,
        tokenId,
        intentType,
        riskScore: Number(risk.score || 0),
        riskLevel: risk.riskLevel || "unknown",
        reasonCodes: Array.isArray(risk.reasonCodes)
          ? risk.reasonCodes
          : [],
        ip: ip || null,
        fingerprint: fingerprint || null,
        userAgent: userAgent || "",
      };

      await logFraudEvent({
        event_type: "lead_click",
        user_phone_hash: userPhoneHash || null,
        business_id: businessId,
        token_id: tokenId,
        ip_address: ip || null,
        user_agent: userAgent,
        fingerprint,
        intent_type: intentType,
        risk_score: risk.score,
        risk_level: risk.riskLevel,
        action_taken: "block",
        reason_codes: fraudMeta.reasonCodes,
        meta: {
          blocked: true,
          ...fraudMeta,
        },
      });

      await notifyFraudBlocked({
        businessId,
        tokenId,
        intentType,
        risk,
      });

      return res.status(429).send("Request blocked");
    }

    if (!existingLock && risk.action === "hold") {
      await createPendingCharge({
        business_id: businessId,
        token_id: tokenId,
        amount: Number(tokenRow.charge_amount || 0),
        currency: "USD",
        intent_type: intentType,
        status: "pending",
        risk_score: risk.score,
        reason_codes: risk.reasonCodes,
        meta: { ip, fingerprint },
      });

      await notifyPendingCharge({
        businessId,
        tokenId,
        risk,
      });
    }

   if (!existingLock && risk.action === "allow") {
  const alreadyOpened = tokenRow.opened_at || tokenRow.openedAt;

  if (alreadyOpened) {
    console.log("SKIP_ALREADY_OPENED", {
      tokenId,
      openedAt: alreadyOpened,
    });

    return res.send(redirectHtml);
  }

  console.log("LEAD_TEST_DEDUCT_ATTEMPT", {
    tokenId,
    businessId,
    intentType,
  });

      const billingResult = await deductWalletBalance({
        ownerUserId: "",
        businessId,
        intentType,
        reason: "Tracked lead WhatsApp charge",
        reference: tokenId,
        meta: {
          tokenId,
          ip,
          fingerprint,
        },
      });

      console.log("LEAD_TEST_DEDUCT_RESULT", {
        tokenId,
        ok: billingResult?.ok,
        amount: billingResult?.amount,
        balanceBefore: billingResult?.balanceBefore,
        balanceAfter: billingResult?.balanceAfter,
        error: billingResult?.error || null,
        insufficient: billingResult?.insufficient || false,
      });

      if (!billingResult?.ok && !billingResult?.skipped) {
        await logFraudEvent({
          event_type: "lead_click",
          user_phone_hash: userPhoneHash || null,
          business_id: businessId,
          token_id: tokenId,
          ip_address: ip || null,
          user_agent: userAgent,
          fingerprint,
          intent_type: intentType,
          risk_score: risk.score,
          risk_level: risk.riskLevel,
          action_taken: "billing_failed",
          reason_codes: [...risk.reasonCodes, "BILLING_FAILED"],
          meta: {
            billingError: billingResult?.error || null,
            insufficient: billingResult?.insufficient || false,
          },
        });

        return res.send(redirectHtml);
      }

      const expiresAt = new Date(
        Date.now() + 72 * 60 * 60 * 1000
      ).toISOString();

      const chargeLock = await createChargeLock({
        business_id: businessId,
        user_phone_hash: userPhoneHash || null,
        fingerprint: fingerprint || null,
        ip_address: ip || null,
        charge_key: chargeKey,
        first_token_id: tokenId,
        expires_at: expiresAt,
      });

      console.log("LEAD_TEST_CREATE_LOCK_RESULT", {
        tokenId,
        created: !!chargeLock,
        lockId: chargeLock?.id || null,
      });

      charged = true;
    }

    await logFraudEvent({
      event_type: "lead_click",
      user_phone_hash: userPhoneHash || null,
      business_id: businessId,
      token_id: tokenId,
      ip_address: ip || null,
      user_agent: userAgent,
      fingerprint,
      intent_type: intentType,
      risk_score: risk.score,
      risk_level: risk.riskLevel,
      action_taken: existingLock ? "allow_duplicate_no_charge" : actionTaken,
      reason_codes: risk.reasonCodes,
      meta: {
        charged,
        duplicateSkipped: !!existingLock,
      },
    });

    await supabase
      .from("lead_tokens")
      .update({
        opened_at: new Date().toISOString(),
      })
      .eq("id", tokenId);

    console.log("LEAD_TEST_DONE", {
      tokenId,
      charged,
      duplicateSkipped: !!existingLock,
      actionTaken: existingLock ? "allow_duplicate_no_charge" : actionTaken,
    });

    return res.send(redirectHtml);
  } catch (error) {
    console.error("Lead redirect anti-fraud error:", error);
    return res.status(500).send("Internal server error");
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
  console.log(`✅ Trusted Links API running on port ${PORT}`);
  console.log("FRONTEND_BASE_URL:", FRONTEND_BASE_URL);
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log(`JAVNA_API_KEY: ${JAVNA_API_KEY ? "Loaded ✅" : "Missing ❌"}`);
});
