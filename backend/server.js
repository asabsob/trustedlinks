// backend/server.js
// ============================================================================
// Trusted Links Backend API
// ============================================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import * as Sentry from "@sentry/node";

import opsRoutes from "./routes/ops.routes.js";
import authRoutes from "./routes/auth.js";
import searchRoutes from "./routes/search.routes.js";
import businessRoutes from "./routes/business.routes.js";
import publicBusinessRoutes from "./routes/publicBusiness.routes.js";
import meRoutes from "./routes/me.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import privacyRoutes from "./routes/privacy.js";
import paymentsRoutes from "./routes/payments.routes.js";

import adminRoutes from "./routes/admin.routes.js";
import adminFraudRoutes from "./routes/adminFraud.routes.js";
import adminReportsRoutes from "./routes/adminReports.routes.js";

import adminAIRoutes from "./routes/ai/adminAI.js";
import merchantAIRoutes from "./routes/ai/merchantAI.js";

import whatsappOtpRoutes from "./routes/whatsappOtp.routes.js";
import whatsappWebhookRoutes from "./routes/whatsappWebhook.routes.js";

import campaignRoutes from "./routes/campaignRoutes.js";
import campaignAuthRoutes from "./routes/campaignAuthRoutes.js";
import fundingCodeRoutes from "./routes/fundingCodeRoutes.js";
import platformAnalyticsRoutes from "./routes/platformAnalyticsRoutes.js";

import { operationErrorLogger } from "./middleware/operationLogger.js";

import adminCampaignApprovalsRoutes from "./routes/adminCampaignApprovalsRoutes.js";

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    release: process.env.npm_package_version || undefined,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.authorization;
        delete event.request.headers?.cookie;
      }
      return event;
    },
  });

  console.log("✅ Sentry backend monitoring enabled");
} else {
  console.log("ℹ️ Sentry backend monitoring disabled: SENTRY_DSN not set");
}
console.log("🚀 SERVER VERSION: TEST 1 - SAMEER");
console.log("🚀 SERVER VERSION: sponsorship-route-v1 loaded");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length < 32) {
  throw new Error("JWT_SECRET is missing or too short");
}

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error("Missing admin credentials");
}

if (!process.env.BASE_URL || !/^https?:\/\//i.test(process.env.BASE_URL)) {
  throw new Error("Missing or invalid BASE_URL");
}

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5175;

const FRONTEND_ORIGIN = (
  process.env.FRONTEND_ORIGIN || "http://localhost:5173"
).trim();

const FRONTEND_BASE_URL = (
  process.env.FRONTEND_BASE_URL || FRONTEND_ORIGIN
).trim();

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  "https://trustedlinks-backend-production.up.railway.app"
).trim();

const allowedOrigins = [
  "https://trustedlinks.net",
  "https://www.trustedlinks.net",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

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
    "X-API-Key",
    "X-OTP-Token",
    "x-otp-token",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
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
  message: { error: "Too many OTP attempts, please try again later." },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin login attempts, please try again later." },
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

app.use("/", opsRoutes);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/resend-verification", authLimiter);
app.use("/api/auth/reset-password", authLimiter);
app.use("/api/auth", authRoutes);

app.use("/api/search", searchLimiter, searchRoutes);

app.use("/api/business", businessRoutes);
app.use("/api/businesses", publicBusinessRoutes);
app.use("/api/business", publicBusinessRoutes);

app.use("/api/me", meRoutes);
app.use("/api", analyticsRoutes);

app.use("/api/upload", uploadRoutes);
app.use("/media", mediaRoutes);

app.use("/l", leadLimiter);
app.use("/", leadRoutes);

app.use("/api/privacy", privacyRoutes);
app.use("/api/payments", paymentsRoutes);

app.use("/api/whatsapp/request-otp", otpLimiter);
app.use("/api/whatsapp/verify-otp", otpLimiter);
app.use("/api/whatsapp", whatsappOtpRoutes);

app.use("/webhooks/javna/whatsapp", whatsappWebhookRoutes);

app.use("/api/admin/login", adminLimiter);

app.use("/api/admin", (req, res, next) => {
  if (req.path === "/login") return next();
  return adminApiLimiter(req, res, next);
});

app.use("/api/admin", adminRoutes);
app.use("/api/admin/fraud", adminFraudRoutes);
app.use("/api/admin", adminReportsRoutes);

app.use("/api/admin", adminCampaignApprovalsRoutes);
app.use("/api/ai", adminAIRoutes);
app.use("/api/ai", merchantAIRoutes);

app.use("/api/campaign/auth", campaignAuthRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/campaign/funding-codes", fundingCodeRoutes);

app.use("/api/platform/analytics", platformAnalyticsRoutes);

app.get("/api/debug/resend", (_req, res) => {
  return res.json({
    ok: true,
    hasKey: Boolean(process.env.RESEND_API_KEY),
    hasFrom: Boolean(process.env.MAIL_FROM),
    from: process.env.MAIL_FROM || null,
  });
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT_EXCEPTION:", err);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED_REJECTION:", reason);
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
});

app.use(operationErrorLogger);

app.use((err, _req, res, _next) => {
  console.error("UNHANDLED ERROR:", err);

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Trusted Links API running on port ${PORT}`);
  console.log("FRONTEND_BASE_URL:", FRONTEND_BASE_URL);
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log(
    `JAVNA_API_KEY: ${process.env.JAVNA_API_KEY ? "Loaded ✅" : "Missing ❌"}`
  );
});

