// ============================================================================
// Trusted Links Backend API (Stable + Hardened) - JAVNA ONLY
// WhatsApp: OTP for business signup + Chat search via WhatsApp webhook
// Storage: flat JSON (data.json) - MVP friendly
// ============================================================================

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import geolib from "geolib";

dotenv.config();

// ---------------------------------------------------------------------------
// App + Paths
// ---------------------------------------------------------------------------
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5175;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const DB_FILE = path.join(__dirname, "data.json");

// ---------------------------------------------------------------------------
// CORS + JSON
// ---------------------------------------------------------------------------
const allowedOrigins = new Set([
  FRONTEND_ORIGIN,
  "https://trustedlinks.net",
  "http://localhost:5173",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server / curl without Origin
      if (!origin) return cb(null, true);

      const ok =
        allowedOrigins.has(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      return cb(ok ? null : new Error("CORS blocked"), ok);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));
// Preflight for all routes
// Preflight for all routes (use SAME cors config)
app.options(
  "*",
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const ok =
        allowedOrigins.has(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      return cb(ok ? null : new Error("CORS blocked"), ok);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: false,
  })
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@trustedlinks.app";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
const JWT_SECRET = process.env.JWT_SECRET || "trustedlinks_secret";

const GMAIL_USER = (process.env.GMAIL_USER || "").trim();
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || "").trim();

console.log("MAIL_ENV_CHECK", {
  GMAIL_USER: Boolean(GMAIL_USER),
  GMAIL_PASS: Boolean(GMAIL_PASS),
  GMAIL_USER_LEN: GMAIL_USER.length,
  GMAIL_PASS_LEN: GMAIL_PASS.length,
});

// ---------------------------------------------------------------------------
// DB Helpers (flat JSON)
// ---------------------------------------------------------------------------
function ensureDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        { users: [], businesses: [], notifications: [], otpRequests: [] },
        null,
        2
      )
    );
  }
}
function load() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, "utf8").trim() || "{}";
  const data = JSON.parse(raw);

  data.users ||= [];
  data.businesses ||= [];
  data.notifications ||= [];
  data.otpRequests ||= []; // [{ id, whatsapp, code, expiresAt, createdAt, purpose }]
  return data;
}
function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function nowISO() {
  return new Date().toISOString();
}
function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// Mailer (optional)
// ---------------------------------------------------------------------------
let transporter = null;
if (GMAIL_USER && GMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
}

// ---------------------------------------------------------------------------
// JWT Helpers
// ---------------------------------------------------------------------------
function createToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}
function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("Missing token");
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") throw new Error("Invalid role");
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// ---------------------------------------------------------------------------
// JAVNA Config (single place)
// ---------------------------------------------------------------------------
// ---------------------- JAVNA CONFIG ----------------------
// ---------------------- JAVNA CONFIG ----------------------
const JAVNA_API_KEY = process.env.JAVNA_API_KEY || "";
const JAVNA_FROM = process.env.JAVNA_FROM || "";

// 👇 يجب أن يكون أولاً
const JAVNA_BASE_URL = "https://whatsapp.api.javna.com/whatsapp/v1.0";

// 👇 بعده مباشرة
const JAVNA_SEND_TEXT_URL = `${JAVNA_BASE_URL}/message/text`;
const JAVNA_SEND_AUTH_TEMPLATE_URL = `${JAVNA_BASE_URL}/message/template/authentication`;

console.log("JAVNA_SEND_TEXT_URL:", JAVNA_SEND_TEXT_URL);
console.log("JAVNA_SEND_AUTH_TEMPLATE_URL:", JAVNA_SEND_AUTH_TEMPLATE_URL);

// ---------------------------------------------------------------------------
// JAVNA Client (single place)
// ---------------------------------------------------------------------------
async function javnaSendText({ to, body }) {
  if (!JAVNA_API_KEY) throw new Error("Missing JAVNA_API_KEY");
  if (!JAVNA_FROM) throw new Error("Missing JAVNA_FROM");

  const headers = { "Content-Type": "application/json", "X-API-Key": JAVNA_API_KEY };

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

// ---------------------------------------------------------------------------
// JAVNA: send template OTP
// ---------------------------------------------------------------------------
async function javnaSendOtpTemplate({ to, code, lang = "en" }) {
  if (!JAVNA_API_KEY) throw new Error("Missing JAVNA_API_KEY");
  if (!JAVNA_FROM) throw new Error("Missing JAVNA_FROM");

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": JAVNA_API_KEY,
  };

  const from = JAVNA_FROM.startsWith("+") ? JAVNA_FROM : `+${JAVNA_FROM}`;
  const toNumber = to.startsWith("+") ? to : `+${to}`;

  const templateName =
    lang === "ar" ? "turstedlinks_otp_ar" : "trustedlinks_otp_en";

  const templateLanguage =
    lang === "ar" ? "ar" : "en";

  const payload = {
    from,
    to: toNumber,
    content: {
      templateName,
      templateLanguage,
      otp: String(code),
    },
  };

  console.log("JAVNA_AUTH_TEMPLATE_URL:", JAVNA_SEND_AUTH_TEMPLATE_URL);
  console.log("JAVNA_AUTH_TEMPLATE_PAYLOAD:", JSON.stringify(payload));

  const r = await fetch(JAVNA_SEND_AUTH_TEMPLATE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const txt = await r.text();
  console.log("JAVNA_AUTH_TEMPLATE_RESPONSE_RAW:", txt);

  if (!r.ok) throw new Error(`Javna auth template failed (${r.status}): ${txt}`);

  return JSON.parse(txt);
}
// ---------------------------------------------------------------------------
// OTP Helpers (stored in data.json)
// ---------------------------------------------------------------------------
function upsertOtp(db, { whatsapp, code, purpose = "business_signup" }) {
  const clean = cleanDigits(whatsapp);
  // remove old for same whatsapp+purpose
  db.otpRequests = db.otpRequests.filter(
    (x) => !(x.whatsapp === clean && x.purpose === purpose)
  );
  db.otpRequests.push({
    id: nanoid(10),
    whatsapp: clean,
    code,
    purpose,
    createdAt: nowISO(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min
  });
}
function verifyOtp(db, { whatsapp, code, purpose = "business_signup" }) {
  const clean = cleanDigits(whatsapp);
  const rec = db.otpRequests.find(
    (x) => x.whatsapp === clean && x.purpose === purpose
  );
  if (!rec) return { ok: false, reason: "NO_OTP" };
  if (String(rec.code) !== String(code)) return { ok: false, reason: "BAD_CODE" };
  if (new Date(rec.expiresAt).getTime() < Date.now()) return { ok: false, reason: "EXPIRED" };

  // consume
  db.otpRequests = db.otpRequests.filter((x) => x.id !== rec.id);
  return { ok: true };
}

// ============================================================================
// AUTH (Email signup/login) + Email Verification (Clean)
// ============================================================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const db = load();
    if (db.users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const verifyToken = nanoid(32);

    const user = {
      id: nanoid(8),
      email,
      password,              // MVP plain (later hash)
      emailVerified: false,  // ✅ must verify
      verifyToken,           // ✅
      subscriptionPlan: null,
      planActivatedAt: null,
      createdAt: nowISO(),
    };

    db.users.push(user);
    save(db);

    // Send verification email (if configured)
    if (transporter) {
      try {
        const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || FRONTEND_ORIGIN;
        const verifyUrl =
          `${FRONTEND_BASE_URL}/verify-email` +
          `?email=${encodeURIComponent(email)}` +
          `&token=${encodeURIComponent(verifyToken)}`;

        await transporter.sendMail({
          from: GMAIL_USER,
          to: email,
          subject: "Verify your email",
          text: `Verify your email using this link: ${verifyUrl}`,
          html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
        });
      } catch (err) {
        console.error("send verification email error:", err);
        // Do not fail signup
      }
    } else {
      console.log("🧪 Mailer disabled. verifyToken:", verifyToken, "email:", email);
    }

    return res.json({
      success: true,
      user: { id: user.id, email: user.email, emailVerified: user.emailVerified },
    });
  } catch (e) {
    console.error("signup error", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const db = load();
    const user = db.users.find((u) => u.email === email && u.password === password);

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Email not verified",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const token = createToken(user.id);
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

app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email required" });

    const db = load();
    const user = db.users.find((u) => u.email === email);
    if (!user) return res.status(404).json({ error: "Email not found" });

    if (user.emailVerified) {
      return res.json({ ok: true, message: "Email already verified" });
    }

    if (!user.verifyToken) user.verifyToken = nanoid(32);
    save(db);

    if (!transporter) {
      console.log("🧪 Mailer disabled. verifyToken:", user.verifyToken, "email:", email);
      return res.status(500).json({ error: "Email service not configured" });
    }

    const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || FRONTEND_ORIGIN;
    const verifyUrl =
      `${FRONTEND_BASE_URL}/verify-email` +
      `?email=${encodeURIComponent(email)}` +
      `&token=${encodeURIComponent(user.verifyToken)}`;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: email,
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

app.get("/api/auth/verify-email", (req, res) => {
  try {
    const { email, token } = req.query || {};
    if (!email || !token) return res.status(400).json({ error: "Missing email/token" });

    const db = load();
    const user = db.users.find((u) => u.email === String(email));
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.emailVerified) return res.json({ ok: true, message: "Already verified" });

    if (String(user.verifyToken) !== String(token)) {
      return res.status(401).json({ error: "Invalid token" });
    }

    user.emailVerified = true;
    user.verifyToken = null;
    save(db);

    return res.json({ ok: true, message: "Email verified ✅" });
  } catch (e) {
    console.error("verify-email error:", e);
    return res.status(500).json({ error: "Verification failed" });
  }
});

// ============================================================================
// WhatsApp OTP (Javna) - for business signup  (fixed)
// ============================================================================
app.post("/api/whatsapp/request-otp", async (req, res) => {
  try {
    const { whatsapp } = req.body || {};

    if (!whatsapp) {
      return res.status(400).json({ error: "WhatsApp number missing" });
    }

    const clean = cleanDigits(whatsapp);

    // International validation: 10–15 digits (E.164 without +)
    if (!/^\d{10,15}$/.test(clean)) {
      return res.status(400).json({ error: "Invalid WhatsApp number" });
    }

    const db = load();

    // duplication check: if already used in businesses
    const already = db.businesses.find((b) => cleanDigits(b.whatsapp) === clean);
    if (already) {
      return res.status(409).json({ error: "This WhatsApp number is already registered." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    upsertOtp(db, { whatsapp: clean, code: otp, purpose: "business_signup" });
    save(db);

    // send via Javna (if key exists)
    if (!JAVNA_API_KEY) {
      // dev mode
      console.log("🧪 JAVNA disabled (missing key). OTP:", otp, "to:", clean);
      return res.json({ success: true, message: "OTP generated (mock).", devOtp: otp });
    }

    // --- call Javna and handle response ---
    try {
      // pass digits only — javnaSendOtpTemplate will normalise and add '+'
    const javnaResp = await javnaSendOtpTemplate({ to: `+${clean}`, code: otp, lang: "en" });

if (javnaResp?.stats?.rejected === "1") {
  return res.status(400).json({ success: false, error: "Javna rejected template", javna: javnaResp });
}

return res.json({ success: true, message: "OTP sent.", javna: javnaResp });

      // log for Railway (very important to inspect payload/response)
      console.log("JAVNA_RESP:", JSON.stringify(javnaResp));

      // check common rejection signals from Javna
      const rejectedCount =
        javnaResp?.stats?.rejected ||
        (Array.isArray(javnaResp?.rejectedMessages) ? String(javnaResp.rejectedMessages.length) : "0");

      if (String(rejectedCount) !== "0") {
        // return full javna object so client / logs can show the reason
        return res.status(400).json({ success: false, error: "Javna rejected template", javna: javnaResp });
      }

      // success — include devOtp so you can test if message not delivered but OTP stored
      return res.json({ success: true, message: "OTP sent.", javna: javnaResp, devOtp: otp });
    } catch (err) {
      console.error("javna send error:", err);
      // return JS-friendly error to client and logs
      return res.status(500).json({ success: false, error: "Javna send failed", details: String(err) });
    }
  } catch (e) {
    console.error("request-otp error", e);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ============================================================================
// WhatsApp OTP Verify (Javna) - for business signup (Clean)
// ============================================================================
app.post("/api/whatsapp/verify-otp", async (req, res) => {
  try {
    const { whatsapp, code } = req.body || {};

    if (!whatsapp || !code) {
      return res.status(400).json({ ok: false, error: "WhatsApp number and code are required" });
    }

    const clean = cleanDigits(whatsapp);

    // E.164 without "+" should be 10–15 digits
    if (!/^\d{10,15}$/.test(clean)) {
      return res.status(400).json({ ok: false, error: "Invalid WhatsApp number" });
    }

    const db = load();

    // Optional: prevent verify if already registered
    const already = db.businesses.find((b) => cleanDigits(b.whatsapp) === clean);
    if (already) {
      return res.status(409).json({ ok: false, error: "This WhatsApp number is already registered." });
    }

    const result = verifyOtp(db, { whatsapp: clean, code, purpose: "business_signup" });

    if (!result.ok) {
      if (result.reason === "NO_OTP") {
        return res.status(404).json({ ok: false, error: "No OTP found. Request a new code.", reason: "NO_OTP" });
      }
      if (result.reason === "BAD_CODE") {
        return res.status(401).json({ ok: false, error: "Invalid OTP code.", reason: "BAD_CODE" });
      }
      if (result.reason === "EXPIRED") {
        return res.status(410).json({ ok: false, error: "OTP expired. Request a new code.", reason: "EXPIRED" });
      }
      return res.status(400).json({ ok: false, error: "OTP verification failed.", reason: result.reason });
    }

    // verifyOtp consumes otpRequests entry, so save now
    save(db);

    // Issue short-lived token for next step (optional)
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
// WhatsApp Chat Search (Webhook) - Javna -> TrustedLinks
// ============================================================================
/**
 * Webhook endpoint (Javna -> your server)
 * NOTE: payload structure depends on Javna. We'll handle common shapes safely.
 */
app.post("/webhooks/javna/whatsapp", async (req, res) => {
  try {
    // Always ACK fast
    res.json({ ok: true });

    const body = req.body || {};

    // Try extract:
    // - from: sender number
    // - text: message content
    const from =
      cleanDigits(body.from || body.sender || body?.data?.from || body?.message?.from || "");
    const text =
      (body.text || body.message || body?.data?.text || body?.message?.text || "").toString().trim();

    if (!from || !text) return;

    // Command: "search pizza" or just "pizza"
    const q = text.replace(/^search\s+/i, "").trim();

    // Search in directory
    const db = load();
    let results = db.businesses.filter((b) => (b.status || "") === "Active");

    if (q) {
      const qq = q.toLowerCase();
      results = results.filter((b) => {
        const name = (b.name || "").toLowerCase();
        const nameAr = (b.nameAr || b.name_ar || "").toLowerCase();
        const desc = (b.description || "").toLowerCase();
        const cat = Array.isArray(b.category) ? b.category.join(" ").toLowerCase() : (b.category || "").toLowerCase();
        return name.includes(qq) || nameAr.includes(qq) || desc.includes(qq) || cat.includes(qq);
      });
    }

    const top = results.slice(0, 5);

    let reply = "";
    if (!top.length) {
      reply = `No results found for: "${q}".\nTry another keyword or category.`;
    } else {
      reply =
        `Top results for "${q}":\n\n` +
        top
          .map((b, i) => {
            const wa = b.whatsapp ? `https://wa.me/${cleanDigits(b.whatsapp)}` : "";
            const map = b.mapLink || "";
            return `${i + 1}) ${b.name || "Business"}\n${wa ? `WhatsApp: ${wa}\n` : ""}${map ? `Map: ${map}\n` : ""}`;
          })
          .join("\n");
    }

    // Send reply via Javna
    if (!JAVNA_API_KEY) {
      console.log("🧪 JAVNA disabled. Would reply to", from, "=>", reply);
      return;
    }

    await javnaSendText({ to: from, body: reply });
  } catch (e) {
    console.error("webhook error", e);
  }
});

// ============================================================================
// Public search API (frontend)
// ============================================================================
app.get("/api/search", (req, res) => {
  try {
    const db = load();
    const { query = "", category = "all", lat, lng } = req.query;

    let results = db.businesses.filter((b) => (b.status || "") === "Active");

    if (query) {
      const q = String(query).toLowerCase();
      results = results.filter((b) => {
        return (
          (b.name && b.name.toLowerCase().includes(q)) ||
          (b.name_ar && b.name_ar.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (Array.isArray(b.category) && b.category.some((c) => String(c).toLowerCase().includes(q)))
        );
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
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return res.json(results);
  } catch (e) {
    console.error("/api/search error", e);
    return res.status(500).json({ error: "Failed to search" });
  }
});

// ============================================================================
// Admin login (optional)
// ============================================================================
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (email !== ADMIN_EMAIL) return res.status(401).json({ error: "Invalid credentials" });

  const ok = ADMIN_PASSWORD.startsWith("$2")
    ? await bcrypt.compare(password, ADMIN_PASSWORD)
    : password === ADMIN_PASSWORD;
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
  return res.json({ token });
});

// ============================================================================
// Health check
// ============================================================================
app.get("/", (_req, res) => res.status(200).send("OK"));
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

app.get("/api/test", (_req, res) => res.json({ ok: true, message: "✅ Backend is reachable" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    javnaKeyLoaded: Boolean(process.env.JAVNA_API_KEY),
    javnaKeyLength: (process.env.JAVNA_API_KEY || "").length,
  });
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT_EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED_REJECTION:", reason);
});
// ============================================================================
// Start server
// ============================================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Trusted Links API running on port ${PORT}`);

  console.log("ENV_HAS_JAVNA_API_KEY:", Object.prototype.hasOwnProperty.call(process.env, "JAVNA_API_KEY"));
  console.log("JAVNA_API_KEY_RAW:", JSON.stringify(process.env.JAVNA_API_KEY));
  console.log("JAVNA_KEYS:", Object.keys(process.env).filter(k => k.includes("JAVNA")));
console.log("JAVNA_SEND_TEXT_URL:", JAVNA_SEND_TEXT_URL);
console.log("JAVNA_SEND_AUTH_TEMPLATE_URL:", JAVNA_SEND_AUTH_TEMPLATE_URL);
  console.log(`JAVNA_API_KEY: ${JAVNA_API_KEY ? "Loaded ✅" : "Missing ❌"}`);
});
