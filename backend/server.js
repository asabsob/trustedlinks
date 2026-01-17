// ============================================================================
// Trusted Links Backend API (Stable + Hardened)
// Modules: Auth | Business | Subscriptions | Admin | AI Summary
// ----------------------------------------------------------------------------
// Notes for Developers:
// 1️⃣ Keep each section isolated using the divider pattern below.
// 2️⃣ When adding new logic (routes, helpers, or integrations), create a new
//     SECTION under the right category and reference it in the header list.
// 3️⃣ All file operations use the flat JSON DB for simplicity (MVP-friendly).
// 4️⃣ For production, consider migrating to a persistent DB (e.g., MongoDB).
// ============================================================================
// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import geolib from "geolib"; // ✅ Keep here only once at the top
import OpenAI from "openai";
import authRoutes from "./routes/auth.js";
import connectDB from "./db.js";
import User from "./models/User.js";
import Otp from "./models/Otp.js";



dotenv.config();

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`;

console.log("🧩 WHATSAPP_PHONE_ID:", WHATSAPP_PHONE_ID);
console.log("🧩 WHATSAPP_TOKEN:", WHATSAPP_TOKEN ? "Loaded ✅" : "Missing ❌");
console.log("🧩 WHATSAPP_API_URL:", WHATSAPP_API_URL);



// ============================================================================
// APP SETUP
// ============================================================================
const app = express();
app.use(
  cors({
    origin: [/^http:\/\/localhost:5173$/, /^http:\/\/127\.0\.0\.1:5173$/],
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "data.json");
const PORT = process.env.PORT || 5175;

// ============================================================================
// CONSTANTS
// ============================================================================
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@trustedlinks.app";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
const JWT_SECRET = process.env.JWT_SECRET || "trustedlinks_secret";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GMAIL_USER = process.env.GMAIL_USER || "mskgroup@gmail.com";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || "lpohagvpjbiuwyml";

function safeReadJSON(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;

    const content = fs.readFileSync(filePath, "utf8").trim();
    if (!content) return defaultValue;

    return JSON.parse(content);
  } catch (e) {
    console.error("JSON read error for", filePath, e);
    return defaultValue;
  }
}


// ============================================================================
// DB HELPERS
// ============================================================================
function ensureDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users: [], businesses: [], notifications: [] }, null, 2)
    );
  }
}
function load() {
  try {
    ensureDb();
    const raw = fs.readFileSync(DB_FILE, "utf8").trim() || "{}";
    const data = JSON.parse(raw);
    data.users ||= [];
    data.businesses ||= [];
    data.notifications ||= [];
    return data;
  } catch (err) {
    console.error("⚠️ Failed to load DB:", err);
    const empty = { users: [], businesses: [], notifications: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
}
function save(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("❌ Failed to save DB:", err);
  }
}

// ============================================================================
// MAILER (Gmail Transporter)
// ============================================================================
let transporter = null;
if (GMAIL_USER && GMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
  transporter.verify((err) => {
    if (err) console.error("❌ SMTP verification failed:", err.message);
    else console.log("✅ Gmail transporter verified and ready");
  });
} else {
  console.log("📧 Mailer disabled (missing Gmail credentials)");
}

async function sendVerificationEmail(email, token) {
  if (!transporter) return false;
  const link = `http://localhost:${PORT}/api/auth/verify/${token}`;
  const html = `
    <div style="font-family:sans-serif">
      <h2>Welcome to Trusted Links</h2>
      <p>Click below to verify your email:</p>
      <a href="${link}" style="background:#22c55e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Verify Email</a>
      <p style="font-size:13px;color:#555;margin-top:15px;">If you didn't create an account, ignore this email.</p>
    </div>`;
  try {
    await transporter.sendMail({
      from: `"Trusted Links" <${GMAIL_USER}>`,
      to: email,
      subject: "Verify your email – Trusted Links",
      html,
    });
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    return false;
  }
}

// ============================================================================
// OPENAI (Optional)
// ============================================================================
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// ============================================================================
// AUTH MIDDLEWARES
// ============================================================================
function userAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    if (!token) return res.status(401).json({ error: "Missing token" });
    const db = load();
    const user = db.users.find((u) => u.token === token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.db = db;
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) throw new Error("Missing token");
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") throw new Error("Invalid role");
    req.admin = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// ============================================================================
// SECTION 1: USER AUTH (JWT-BASED)
// ============================================================================


// ---------------------------------------------------------------------------
// Helper: Create a signed JWT
// ---------------------------------------------------------------------------
function createToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

// ---------------------------------------------------------------------------
// SIGNUP  (user only, business will be created after plan selection)
// ---------------------------------------------------------------------------
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const db = load();

    // Check duplicate email
    if (db.users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create user
    const user = {
      id: nanoid(8),
      email,
      password, // plain for MVP
      emailVerified: false,
      verifyToken: crypto.randomBytes(20).toString("hex"),
      subscriptionPlan: null,
      planActivatedAt: null,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    save(db);

    // ✅ send verification email
    sendVerificationEmail(email, user.verifyToken);

    return res.json({
      success: true,
      message: "Signup successful, please check your email to verify.",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------------------------------------------------------------------
// RESEND VERIFICATION EMAIL
// ---------------------------------------------------------------------------
app.post("/api/auth/resend-verification", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const db = load();
    const user = db.users.find((u) => u.email === email);

    if (!user) {
      // For security, don't reveal if email exists
      return res.json({
        success: true,
        message: "If this email is registered, a verification link has been resent.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email already verified." });
    }

    // Generate a new verify token
    user.verifyToken = crypto.randomBytes(20).toString("hex");
    save(db);

    await sendVerificationEmail(user.email, user.verifyToken);

    return res.json({
      success: true,
      message: "Verification email resent. Please check your inbox.",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Server error while resending verification." });
  }
});

// Optional alias to match old frontend calls like /api/resend-verification
app.post("/api/resend-verification", (req, res) => {
  req.url = "/api/auth/resend-verification";
  app._router.handle(req, res);
});

// ---------------------------------------------------------------------------
// FORGOT PASSWORD - send temporary password via email
// ---------------------------------------------------------------------------
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const db = load();
    const user = db.users.find((u) => u.email === email);

    if (!user) {
      // don't reveal that email is not registered
      return res.json({
        success: true,
        message: "If this email is registered, a reset email has been sent.",
      });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(4).toString("hex"); // 8 chars

    user.password = tempPassword; // still plain for MVP
    save(db);

    if (transporter) {
      await transporter.sendMail({
        from: `"Trusted Links" <${GMAIL_USER}>`,
        to: email,
        subject: "Your new temporary password – Trusted Links",
        html: `
          <div style="font-family:sans-serif">
            <h2>Password reset</h2>
            <p>Your new temporary password is:</p>
            <p style="font-size:18px;font-weight:bold">${tempPassword}</p>
            <p>Please log in and change it from your account as soon as possible.</p>
          </div>
        `,
      });
    }

    return res.json({
      success: true,
      message: "If this email is registered, a reset email has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error while resetting password." });
  }
});


// ---------------------------------------------------------------------------
// Validate WhatsApp number (check duplication + send OTP)
// ---------------------------------------------------------------------------
import fetch from "node-fetch";


app.post("/api/whatsapp/verify", async (req, res) => {
  try {
    const { whatsapp } = req.body;
    if (!whatsapp) {
      return res.status(400).json({ error: "WhatsApp number required" });
    }

    // 1️⃣ Check duplication (MongoDB)
    const exists = await User.findOne({ whatsapp });
    if (exists) {
      return res
        .status(409)
        .json({ error: "This WhatsApp number is already registered." });
    }

    // 2️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Save OTP in MongoDB (overwrite old if exists)
    await Otp.deleteMany({ whatsapp });

    await Otp.create({
      whatsapp,
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // 4️⃣ Send OTP via WhatsApp API
    const messageData = {
      messaging_product: "whatsapp",
      to: whatsapp,
      type: "text",
      text: {
        body: `🔐 Trusted Links Verification Code: ${otp}\nPlease enter this code to verify your WhatsApp number.`,
      },
    };

    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("WhatsApp API error:", err);
      return res.status(500).json({ error: "Failed to send OTP message." });
    }

    res.json({ success: true, message: "OTP sent successfully." });
  } catch (err) {
    console.error("❌ WhatsApp verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/whatsapp/resend-otp", async (req, res) => {
  try {
    const { whatsapp } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ error: "WhatsApp number required" });
    }

    const existing = await Otp.findOne({ whatsapp });

    if (!existing) {
      return res
        .status(400)
        .json({ error: "No OTP request found. Please request OTP first." });
    }

    // Generate new OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.updateOne(
      { whatsapp },
      {
        code: newOTP,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }
    );

    // Send OTP via WhatsApp
    const messageData = {
      messaging_product: "whatsapp",
      to: whatsapp,
      type: "text",
      text: { body: `🔐 Trusted Links Verification Code (Resent): ${newOTP}` },
    };

    const waRes = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    if (!waRes.ok) {
      const errText = await waRes.text();
      console.error("WhatsApp resend error:", errText);
      return res
        .status(500)
        .json({ error: "Failed to resend OTP via WhatsApp" });
    }

    res.json({ success: true, message: "OTP resent successfully" });
  } catch (err) {
    console.error("❌ Resend OTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ---------------------------------------------------------------------------
// 🔍 Check if WhatsApp number is verified by Meta
// ---------------------------------------------------------------------------
async function checkMetaVerification(whatsapp) {
  try {
    const clean = whatsapp.replace(/\D/g, "");

    // 🌟 Auto-verify Meta Sandbox test numbers
    const META_TEST_NUMBERS = ["97455831598"];
    if (META_TEST_NUMBERS.includes(clean)) {
      console.log("🟢 META TEST NUMBER → Auto Verified");
      return true;
    }

    const token = process.env.META_ACCESS_TOKEN;
    const phoneId = process.env.META_PHONE_ID;

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}?fields=verified_name,code_verification_status,account_mode`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();
    console.log("Meta API check:", data);

    const isVerified =
      data.code_verification_status === "VERIFIED" ||
      data.account_mode === "LIVE" ||
      !!data.verified_name;

    return isVerified;
  } catch (err) {
    console.error("Meta verification check failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// ✅ Check Meta Verification Status for WhatsApp Business Number
//     + auto-update business status
//     + email admin if number is not verified
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ✅ Check Meta Verification Status for WhatsApp Business Number
// ---------------------------------------------------------------------------
app.post("/api/whatsapp/check-meta", async (req, res) => {
  try {
    const { whatsapp, phone_number_id, business_name } = req.body;

    if (!whatsapp) {
      return res.status(400).json({ success: false, error: "Missing WhatsApp number." });
    }

    // Normalize input
    const clean = whatsapp.replace(/\D/g, "");

    // 🌟 Auto-verify SANDBOX numbers
    const META_TEST_NUMBERS = ["97455831598"]; 
    if (META_TEST_NUMBERS.includes(clean)) {
      return res.json({
        success: true,
        verified: true,
        verified_name: "SANDBOX TEST NUMBER",
        meta_status: "SANDBOX",
        raw: {}
      });
    }

    // Validation
    if (!phone_number_id || !process.env.WHATSAPP_TOKEN) {
      return res.status(400).json({
        success: false,
        error: "Missing phone_number_id or WhatsApp token.",
      });
    }

    // Call Meta API
    const url = `https://graph.facebook.com/v19.0/${phone_number_id}?fields=id,verified_name,code_verification_status,quality_rating,account_mode&access_token=${process.env.WHATSAPP_TOKEN}`;

    const response = await fetch(url);
    const metaData = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        success: false,
        error: "Meta API request failed.",
        details: metaData,
      });
    }

    // Determine verification
    const verifiedName = metaData.verified_name || null;
    const metaStatus =
      metaData.code_verification_status ||
      metaData.account_mode ||
      "UNKNOWN";

    const isVerified =
      (metaData.code_verification_status === "VERIFIED" ||
        metaData.account_mode === "LIVE") &&
      !!verifiedName;

    // -----------------------------------------------------------------------
    // 🔍 Fix: Support BOTH business.whatsapp AND business.whatsappLink
    // -----------------------------------------------------------------------
    const db = load();

    const biz = db.businesses.find((b) => {
      const stored = (b.whatsapp || "").replace(/\D/g, "");
      const match = (b.whatsappLink || "").match(/wa\.me\/(\d+)/);
      const linkNum = match ? match[1] : "";
      return stored === clean || linkNum === clean;
    });

    if (biz) {
      biz.metaVerified = isVerified;
      biz.verified = isVerified;
      biz.verified_name = verifiedName;
      biz.meta_status = metaStatus;
      biz.status = isVerified ? "Active" : "PendingMeta";
      save(db);
    }

    return res.json({
      success: true,
      verified: isVerified,
      verified_name: verifiedName,
      meta_status: metaStatus,
      raw: metaData,
    });

  } catch (err) {
    console.error("❌ Meta verification error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error while checking Meta verification.",
    });
  }
});

// ---------------------------------------------------------------------------
// EMAIL VERIFICATION
// ---------------------------------------------------------------------------
app.get("/api/auth/verify/:token", (req, res) => {
  const db = load();
  const user = db.users.find((u) => u.verifyToken === req.params.token);
  if (!user) return res.status(400).send("Invalid or expired verification link.");

  user.emailVerified = true;
  user.verifyToken = null;
  save(db);

  res.send("<h2>Email verified ✅</h2><p>You can now log in.</p>");
});


// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const db = load();

  const user = db.users.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.emailVerified) {
    return res
      .status(403)
      .json({ error: "Please verify your email before logging in." });
  }


  // ✅ Generate JWT
  const token = createToken(user.id);

  res.json({
    ok: true,
    token,
    subscriptionPlan: user.subscriptionPlan,
    planActivatedAt: user.planActivatedAt,
  });
});


// ---------------------------------------------------------------------------
// GET CURRENT USER (used by Dashboard)
// ---------------------------------------------------------------------------
app.get("/api/me", (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = load();
    const user = db.users.find((u) => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
      planActivatedAt: user.planActivatedAt,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("❌ /api/me error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});


// ---------------------------------------------------------------------------
// Business performance summary (Enhanced for Reports.jsx)
// ---------------------------------------------------------------------------
// 🔹 Business performance summary (real-time)
app.get("/api/business/reports", (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    if (!token) return res.status(401).json({ error: "Missing Authorization header" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = load();

    const user = db.users.find((u) => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const business =
  db.businesses.find((b) => b.ownerUserId === user.id) ||
  db.businesses.find((b) => b.owner === user.id);

    if (!business) return res.status(404).json({ error: "Business not found" });

    // Ensure fields exist
    const b = { ...business };
    b.clicks ||= [];
    b.recentInteractions ||= [];
    b.mediaViews ||= 0;
    b.views ||= 0;

    const totalClicks = b.clicks.length;
    const totalMessages = b.recentInteractions.filter((r) => r.type === "message").length;
    const mediaViews = b.mediaViews;
    const totalViews = b.views;

    // Build last 7 days buckets
    const days = 7;
    const today = new Date();
    const fmt = (d) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);

    const bucket = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      bucket[fmt(d)] = { date: fmt(d), total: 0, whatsapp: 0, media: 0, messages: 0 };
    }

    for (const c of b.clicks) {
      const d = (c.at || c.date || "").slice(0, 10);
      if (bucket[d]) {
        bucket[d].total += 1;
        if (c.type === "whatsapp") bucket[d].whatsapp += 1;
        if (c.type === "media") bucket[d].media += 1;
      }
    }
    for (const m of b.recentInteractions) {
      const d = (m.at || m.date || "").slice(0, 10);
      if (bucket[d]) bucket[d].messages += 1;
    }

    const activity = Object.values(bucket);

    // A simple weekly growth heuristic (compare last 3 days vs prev 3)
    const vals = activity.map((a) => a.total + a.messages + a.media);
    const recent = vals.slice(-3).reduce((a, b) => a + b, 0);
    const prev = vals.slice(-6, -3).reduce((a, b) => a + b, 0);
    const weeklyGrowth = prev === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prev) / prev) * 100);

    // Sources pie
    const whatsappClicks = b.clicks.filter((c) => c.type === "whatsapp").length;
    const mediaClicks = b.clicks.filter((c) => c.type === "media").length;
    const mapClicks = b.clicks.filter((c) => c.type === "map").length;
    const detailsClicks = b.clicks.filter((c) => c.type === "details").length;

    const sources = [
      { name: "WhatsApp", value: whatsappClicks },
      { name: "Instagram/Media", value: mediaClicks || mediaViews }, // count whichever you use
      { name: "Google Maps", value: mapClicks },
      { name: "Details Page", value: detailsClicks },
    ].filter((s) => s.value > 0); // (keeps pie clean if zeros)

    res.json({
      business: b.name,
      category: Array.isArray(b.category) ? b.category.join(", ") : b.category,
      totalClicks,
      totalMessages,
      mediaViews,
      views: totalViews,
      weeklyGrowth,
      activity,
      sources,
    });
  } catch (err) {
    console.error("❌ /api/business/reports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🧭 Get Current User’s Business (used by Dashboard.jsx)                     */
/* -------------------------------------------------------------------------- */
app.get("/api/business/me", (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = load();

    const user = db.users.find((u) => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const business = db.businesses.find((b) => b.owner === user.id);
    if (!business)
      return res.status(404).json({ error: "No business registered yet" });

    res.json(business);
  } catch (err) {
    console.error("❌ /api/business/me error:", err.message);
    res.status(500).json({ error: "Failed to fetch business info" });
  }
});

// ✅ Put this *after*
app.get("/api/business/:id", (req, res) => {
  try {
    const id = req.params.id;
    const dataPath = path.join(__dirname, "data.json");
    const db = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    const business = db.businesses.find((b) => b.id === id);

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    res.json(business);
  } catch (err) {
    console.error("❌ Error reading business:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------------------------------------------------------
// JWT Authentication Middleware
// ---------------------------------------------------------------------------

function authenticateToken(req, res, next) {
  try {
    let token = req.headers.authorization;

    if (!token)
      return res.status(401).json({ error: "Missing Authorization header" });

    if (token.startsWith("Bearer ")) token = token.slice(7);

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ error: "Invalid or expired token" });
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("AUTH ERROR:", err);
    res.status(500).json({ error: "Server auth error" });
  }
}

// ✅ Update Business Info (name, category, WhatsApp, media link, map link)
// ✅ Update Business Info (name, category, WhatsApp, media link, map link)
app.put("/api/business/update", authenticateToken, async (req, res) => {
  try {
    const { whatsapp, name, category, mediaLink, mapLink } = req.body;
    const db = load();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const business = db.businesses.find((b) => b.owner === user.id);
    if (!business) return res.status(404).json({ error: "Business not found" });

    if (whatsapp) {
      business.whatsapp = whatsapp;
      business.whatsappLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

      // 🟢 Check Meta verification
      const verified = await checkMetaVerification(whatsapp);
      business.verified = verified;
      business.verification = verified ? "verified" : "pending";
    }

    if (name) business.name = name;
    if (category) business.category = category;
    if (mediaLink) business.mediaLink = mediaLink;
    if (mapLink) business.mapLink = mapLink;

    save(db);
    res.json(business);
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: "Server error while updating business" });
  }
});

// ============================================================================
// SECTION 5: PUBLIC BUSINESS SEARCH & LISTING (used by Search.jsx)
// ============================================================================


// 🔹 List all active businesses
app.get("/api/businesses", (req, res) => {
  try {
    const db = load();
    const active = db.businesses.filter((b) => b.status === "Active");
    res.json(active);
  } catch (err) {
    console.error("❌ /api/businesses error:", err);
    res.status(500).json({ error: "Failed to load businesses" });
  }
});

// 🔹 Smart search: supports query, category, and geolocation
app.get("/api/search", (req, res) => {
  try {
    const db = load();
    const { query = "", category = "all", lat, lng } = req.query;
   let results = db.businesses.filter(
  (b) => b.status === "Active" && b.metaVerified === true
);

    // 🔍 Keyword search across multiple fields
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((b) => {
        return (
          (b.name && b.name.toLowerCase().includes(q)) ||
          (b.name_ar && b.name_ar.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (Array.isArray(b.category) &&
            b.category.some((c) => c.toLowerCase().includes(q)))
        );
      });
    }

    // 🏷️ Category filter
    if (category && category !== "all") {
      results = results.filter((b) =>
        Array.isArray(b.category)
          ? b.category.some((c) =>
              c.toLowerCase().includes(category.toLowerCase())
            )
          : (b.category || "").toLowerCase().includes(category.toLowerCase())
      );
    }

    // 📍 Location sorting (optional)
    if (lat && lng) {
      const userLocation = { latitude: parseFloat(lat), longitude: parseFloat(lng) };

      results = results
        .map((b) => {
          // Try to extract coordinates if available in object
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

    res.json(results);
  } catch (err) {
    console.error("❌ /api/search error:", err);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

// 🔹 Fallback route for Instagram profile (to prevent 404)
app.get("/api/instagram-profile/:username", (req, res) => {
  res.json({
    username: req.params.username,
    profilePic: null, // Later integrate with Instagram Graph API
  });
});

// ============================================================================
// SECTION 6: REAL-TIME ANALYTICS (Clicks / Messages / Media Views)
// ============================================================================

// Helper: make sure a business has the analytics fields
function initBizAnalytics(biz) {
  biz.clicks ||= [];                // [{ type:'whatsapp'|'media'|'details'|'map', at:'ISO' }]
  biz.recentInteractions ||= [];    // [{ type:'message'|'whatsapp', at:'ISO' }]
  biz.mediaViews ||= 0;             // number
  biz.views ||= 0;                  // number (list/card views if you want to use it)
}

// 🔹 Track a generic click (WhatsApp / details / map)
// body: { businessId, kind? = 'whatsapp' | 'details' | 'map' }
app.post("/api/track-click", (req, res) => {
  try {
    const { businessId, kind = "whatsapp" } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });

    const db = load();
    const biz = db.businesses.find((b) => b.id === businessId);
    if (!biz) return res.status(404).json({ error: "Business not found" });

    initBizAnalytics(biz);
    biz.clicks.push({ type: kind, at: new Date().toISOString() });
    save(db);

    return res.json({ ok: true });
  } catch (e) {
    console.error("track-click error:", e);
    return res.status(500).json({ error: "Failed to track click" });
  }
});

// 🔹 Track a media view (video/image/IG click)
// body: { businessId }
app.post("/api/track-media", (req, res) => {
  try {
    const { businessId } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });

    const db = load();
    const biz = db.businesses.find((b) => b.id === businessId);
    if (!biz) return res.status(404).json({ error: "Business not found" });

    initBizAnalytics(biz);
    biz.mediaViews = (biz.mediaViews || 0) + 1;
    // Optional: also log it as a click kind
    biz.clicks.push({ type: "media", at: new Date().toISOString() });
    save(db);

    return res.json({ ok: true });
  } catch (e) {
    console.error("track-media error:", e);
    return res.status(500).json({ error: "Failed to track media view" });
  }
});

// 🔹 Track a message start (e.g., WhatsApp “Chat Now”)
// body: { businessId }
app.post("/api/track-message", (req, res) => {
  try {
    const { businessId } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });

    const db = load();
    const biz = db.businesses.find((b) => b.id === businessId);
    if (!biz) return res.status(404).json({ error: "Business not found" });

    initBizAnalytics(biz);
    biz.recentInteractions.push({ type: "message", at: new Date().toISOString() });
    // Optional: also count it as a click kind
    biz.clicks.push({ type: "whatsapp", at: new Date().toISOString() });
    save(db);

    return res.json({ ok: true });
  } catch (e) {
    console.error("track-message error:", e);
    return res.status(500).json({ error: "Failed to track message" });
  }
});

// (Optional) Track a plain view of the business card/details
// body: { businessId }
app.post("/api/track-view", (req, res) => {
  try {
    const { businessId } = req.body || {};
    if (!businessId) return res.status(400).json({ error: "businessId required" });

    const db = load();
    const biz = db.businesses.find((b) => b.id === businessId);
    if (!biz) return res.status(404).json({ error: "Business not found" });

    initBizAnalytics(biz);
    biz.views = (biz.views || 0) + 1;
    save(db);

    return res.json({ ok: true });
  } catch (e) {
    console.error("track-view error:", e);
    return res.status(500).json({ error: "Failed to track view" });
  }
});



// ============================================================================
// SECTION 3: USER SUBSCRIPTIONS
// ============================================================================

// 🔹 Existing subscription update route
app.post("/api/subscribe", userAuth, (req, res) => {
  const db = load();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { plan } = req.body || {};
  if (!plan) return res.status(400).json({ error: "Plan is required" });

  user.subscriptionPlan = plan;
  user.planActivatedAt = new Date().toISOString();
  save(db);
  res.json({ ok: true, plan: user.subscriptionPlan, planActivatedAt: user.planActivatedAt });
});

/* -------------------------------------------------------------------------- */
/* 💳 SELECT PLAN + CREATE BUSINESS (FINAL CLEAN VERSION)                      */
/* -------------------------------------------------------------------------- */
app.post("/api/select-plan", (req, res) => {
  try {
    const { token, plan, ...bizData } = req.body || {};
    console.log("🧩 select-plan received", { hasToken: !!token, plan });

    if (!token || !plan) {
      return res.status(400).json({ error: "Missing token or plan" });
    }

    // Decode JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = load();
    const user = db.users.find((u) => u.id === decoded.id);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Auto-verify email
    user.emailVerified = true;

    // Apply subscription
    user.subscriptionPlan = plan;
    user.planActivatedAt = new Date().toISOString();

    /* ---------------------------------------------------------------------- */
    /* 🏗️ CLEAN BUSINESS DATA FROM FRONTEND                                   */
    /* ---------------------------------------------------------------------- */

    const nameAr = (bizData.nameAr || "").trim();
    const nameEn = (bizData.nameEn || "").trim();

    /* ---- WhatsApp Extraction ---- */
    let whatsapp = (bizData.whatsapp || "").trim();

    // Extract from wa.me link if needed
    if ((!whatsapp || whatsapp.length < 6) && bizData.whatsappLink) {
      const match = bizData.whatsappLink.match(/wa\.me\/(\d+)/);
      if (match) whatsapp = match[1];
    }

    // Keep digits only
    whatsapp = whatsapp.replace(/\D/g, "");

    const whatsappLink = whatsapp ? `https://wa.me/${whatsapp}` : "";

    /* ---- Category ---- */
    const rawCategory = bizData.category || "General";
    const category = Array.isArray(rawCategory)
      ? rawCategory
      : [rawCategory];

    /* ---- Map + Media ---- */
    const mapLink =
      (bizData.mapLink || "").trim().startsWith("http")
        ? (bizData.mapLink || "").trim()
        : "";

    const mediaLink = (bizData.mediaLink || "").trim();

    /* ---- Verification Flags ---- */
    const otpVerified = bizData.otpVerified ?? true;
    const metaVerified = bizData.metaVerified ?? false;
    const finalStatus = metaVerified ? "Active" : "PendingMeta";

    /* ---------------------------------------------------------------------- */
    /* 🏢 CREATE OR UPDATE BUSINESS                                           */
    /* ---------------------------------------------------------------------- */

    let business = db.businesses.find((b) => b.ownerUserId === user.id);

    if (!business) {
      // CREATE
      business = {
        id: nanoid(8),
        ownerUserId: user.id,
        owner: user.id,

        name: nameEn || nameAr || "My Business",
        nameAr,
        nameEn,

        category,
        whatsapp,
        whatsappLink,

        mapLink,
        mediaLink,

        otpVerified,
        metaVerified,
        meta_status: metaVerified ? "VERIFIED" : "PENDING",
        status: finalStatus,
        verified: metaVerified,

        clicks: [],
        recentInteractions: [],
        views: 0,
        createdAt: new Date().toISOString(),
      };

      db.businesses.push(business);
      console.log(`🏪 Created business for ${user.email}: ${business.name}`);

    } else {
      // UPDATE
      business.nameAr = nameAr || business.nameAr;
      business.nameEn = nameEn || business.nameEn;
      business.name = nameEn || nameAr || business.name;

      business.category = category;

      business.whatsapp = whatsapp;
      business.whatsappLink = whatsappLink;

      business.mapLink = mapLink || business.mapLink;
      business.mediaLink = mediaLink || business.mediaLink;

      business.otpVerified = otpVerified;
      business.metaVerified = metaVerified;
      business.meta_status = metaVerified ? "VERIFIED" : "PENDING";
      business.status = finalStatus;
      business.verified = metaVerified;

      console.log(`🔄 Updated business for ${user.email}: ${business.name}`);
    }

    save(db);

    return res.json({
      success: true,
      plan,
      business,
      message: `Plan '${plan}' activated for '${business.name}'.`,
    });

  } catch (err) {
    console.error("❌ select-plan error:", err.message);
    return res.status(500).json({ error: "Failed to activate plan" });
  }
});

// ---------------------------------------------------------------------------
// Public Plans Route (for Subscribe.jsx)
// ---------------------------------------------------------------------------
app.get("/api/plans", (_req, res) => {
  res.json([
    { id: "p1", name: "Free", price: 0, period: "mo" },
    { id: "p2", name: "Pro", price: 15, period: "mo" },
    { id: "p3", name: "Enterprise", price: 49, period: "mo" },
  ]);
});
// ===========================================================================
// ADMIN
// ===========================================================================
app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (email !== ADMIN_EMAIL) return res.status(401).json({ error: "Invalid credentials" });

  const ok = ADMIN_PASSWORD.startsWith("$2")
    ? await bcrypt.compare(password, ADMIN_PASSWORD)
    : password === ADMIN_PASSWORD;
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
  res.json({ token });
});

app.get("/api/admin/me", adminAuth, (req, res) => {
  res.json({ name: "Admin", email: req.admin.email });
});

app.get("/api/admin/stats", adminAuth, (_req, res) => {
  const db = load();
  res.json({
    users: db.users.length,
    businesses: db.businesses.length,
    clicks: db.businesses.reduce((a, b) => a + (b.clicks?.length || 0), 0),
  });
});

app.get("/api/admin/businesses", adminAuth, (_req, res) => {
  const db = load();
  res.json(
    db.businesses.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status || "inactive",
      category: b.category || [],
      views: b.views || 0,
      clicks: b.clicks?.length || 0,
      whatsapp: b.whatsapp || "",
    }))
  );
});

app.get("/api/admin/plans", adminAuth, (_req, res) => {
  res.json([
    { id: "p1", name: "Free", price: 0, period: "mo" },
    { id: "p2", name: "Pro", price: 15, period: "mo" },
    { id: "p3", name: "Enterprise", price: 49, period: "mo" },
  ]);
});

app.get("/api/admin/subscriptions", adminAuth, (_req, res) => {
  const db = load();
  res.json(
    db.users.map((u) => ({
      id: u.id,
      business: db.businesses.find((b) => b.owner === u.id)?.name || "—",
      plan: u.plan || "Free",
      renews: u.renews || "—",
    }))
  );
});

app.get("/api/admin/notifications", adminAuth, (_req, res) => {
  const db = load();
  res.json(db.notifications || []);
});

app.post("/api/admin/notifications", adminAuth, (req, res) => {
  const { title, message } = req.body || {};
  if (!title || !message) return res.status(400).json({ error: "Title and message required" });
  const db = load();
  const note = { id: nanoid(6), title, message, date: new Date().toISOString() };
  db.notifications.push(note);
  save(db);
  res.json({ ok: true, note });
});

app.post("/api/admin/ai-summary", adminAuth, async (_req, res) => {
  try {
    const db = load();
    const totalUsers = db.users.length;
    const totalBusinesses = db.businesses.length;
    const totalClicks = db.businesses.reduce((sum, b) => sum + (b.clicks?.length || 0), 0);

    if (openai) {
      try {
        const prompt = `Generate a short, clear admin summary for the Trusted Links platform.
Stats:
- Users: ${totalUsers}
- Businesses: ${totalBusinesses}
- Total Clicks: ${totalClicks}
Keep it under 100 words, professional tone.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an insightful business analyst." },
            { role: "user", content: prompt },
          ],
        });
        const text = completion.choices?.[0]?.message?.content?.trim() || "No AI summary generated.";
        return res.json({ summary: text, ai: true });
      } catch (err) {
        console.warn("⚠️ AI generation failed:", err.message);
      }
    }

    const fallback = `Current Stats:
- ${totalUsers} users registered
- ${totalBusinesses} active businesses
- ${totalClicks} recorded clicks

Overall platform performance remains healthy with consistent growth this month.`;
    res.json({ summary: fallback, ai: false });
  } catch (err) {
    console.error("❌ AI Summary Error:", err.message);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// ===========================================================================

// ============================================================================
// SECTION 5: TEST & DEBUG
// ============================================================================
app.get("/api/test", (_req, res) => res.json({ ok: true, message: "✅ Backend is reachable" }));

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================
app.use((err, _req, res, _next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

connectDB();

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log(
    `✅ Trusted Links API running on http://localhost:${PORT}\n` +
      `ADMIN_EMAIL=${ADMIN_EMAIL}\n` +
      `ADMIN_PASSWORD=${ADMIN_PASSWORD.startsWith("$2") ? "(bcrypt)" : "(plain)"}\n` +
      `JWT_SECRET=${JWT_SECRET}\n` +
      `OPENAI: ${OPENAI_API_KEY ? "enabled" : "disabled"}`
  );
});
