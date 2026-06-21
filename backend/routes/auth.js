import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

import { sendEmail } from "../services/email.js";

import {
  getUserByEmail,
  createUser,
  verifyUserEmail,
  setVerifyToken,
  setResetToken,
  updateUserPassword,
  getUserById,
} from "../services/pg/users.js";

import {
  getBusinessByWhatsapp,
  createBusiness,
} from "../services/pg/businesses.js";

import {
  deleteOtpByWhatsappPurpose,
  createOtp,
  getOtp,
  consumeOtp,
} from "../services/pg/otps.js";

import { requireAuth } from "../middleware/auth.js";

import { getBusinessPricing } from "../utils/getBusinessPricing.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "https://trustedlinks.net";

const API_BASE_URL =
  process.env.API_BASE_URL ||
  "https://trustedlinks-backend-production.up.railway.app";

// =========================
// Helpers
// =========================
function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

function signUserToken(userId) {
  return jwt.sign({ id: userId, role: "user" }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

// =========================
// SIGNUP
// =========================
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


router.post("/signup", async (req, res) => {
  try {
    const { email, password, business } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    if (!business) {
      return res.status(400).json({
        error: "Business data is required",
      });
    }

    const emailNorm = String(email).trim().toLowerCase();

    const existingUser = await getUserByEmail(emailNorm);

    if (existingUser) {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    const existingBusiness = await getBusinessByWhatsapp(
      business.whatsapp
    );

    if (existingBusiness) {
      return res.status(409).json({
        error: "This WhatsApp number is already registered",
      });
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

    const pricing = getBusinessPricing({
      countryCode: business.countryCode,
      whatsapp: business.whatsapp,
    });

    const createdBusiness = await createBusiness({
      ownerUserId: user.id,
      name: business.name || "",
      name_ar: business.name_ar || "",
      description: business.description || "",
      description_ar: business.description_ar || "",
      category: Array.isArray(business.category)
        ? business.category
        : [],
      keywords: Array.isArray(business.keywords)
        ? business.keywords
        : [],
      keywords_ar: Array.isArray(business.keywords_ar)
        ? business.keywords_ar
        : [],
      whatsapp: business.whatsapp || "",
      status: "Active",
      latitude:
        typeof business.latitude === "number"
          ? business.latitude
          : null,
      longitude:
        typeof business.longitude === "number"
          ? business.longitude
          : null,
      mapLink: business.mapLink || "",
      mediaLink: business.mediaLink || "",
      logo: business.logo || "",
      locationText: business.locationText || "",
      countryCode: business.countryCode || "",
      countryName: business.countryName || "",
      customId: business.customId || "",

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
      billingDirectIntentCost: pricing.direct,
      billingCategoryIntentCost: pricing.category,
      billingNearbyIntentCost: pricing.nearby,
    });

    const verifyUrl =
      `${API_BASE_URL}/api/auth/verify-email` +
      `?email=${encodeURIComponent(emailNorm)}` +
      `&token=${encodeURIComponent(verifyToken)}`;

    try {
      await sendEmail({
        to: emailNorm,
       subject: "Welcome to TrustedLinks – Verify Your Email",
html: `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:40px 24px;background:#ffffff;">
    <h1 style="color:#16a34a;font-size:34px;margin-bottom:28px;">
      Welcome to TrustedLinks
    </h1>

    <p style="font-size:20px;color:#111827;line-height:1.7;margin-bottom:20px;">
      Please verify your email address to activate your business account.
    </p>

    <div style="margin:36px 0;">
      <a href="${verifyUrl}"
         style="background:#16a34a;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:20px;font-weight:bold;display:inline-block;">
        Verify Email
      </a>
    </div>

    <p style="color:#6b7280;font-size:17px;">
      This link expires in 24 hours.
    </p>

    <p style="color:#6b7280;font-size:15px;margin-top:28px;">
      If you did not create this account, please ignore this email.
    </p>
  </div>
`,
text: `Verify your email: ${verifyUrl}`,
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

    return res.status(500).json({
      error: "Signup failed",
    });
  }
});

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
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

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

// =========================
// VERIFY EMAIL
// =========================
router.get("/verify-email", async (req, res) => {
  try {
    const { email, token } = req.query || {};

    if (!email || !token) {
      return res.status(400).send("Missing email/token");
    }

    const emailNorm = String(email).toLowerCase().trim();

    const existingUser = await getUserByEmail(emailNorm);

    if (!existingUser) {
      return res.status(404).send("User not found");
    }

    if (existingUser.emailVerified) {
      return res.redirect(
        `${FRONTEND_BASE_URL}/login?verified=1`
      );
    }

    const verifiedUser = await verifyUserEmail(
      emailNorm,
      token
    );

    if (!verifiedUser) {
      return res.status(401).send("Invalid token");
    }

    return res.redirect(
      `${FRONTEND_BASE_URL}/login?verified=1`
    );

  } catch (e) {
    console.error("verify-email error", e);

    return res.status(500).send(
      "Verification failed"
    );
  }
});

// =========================
// RESEND VERIFICATION
// =========================
router.post("/resend-verification", async (req, res) => {
  try {
    const emailNorm = String(req.body?.email || "")
      .toLowerCase()
      .trim();

    const user = await getUserByEmail(emailNorm);

    if (!user) {
      return res.status(404).json({
        error: "Email not found",
      });
    }

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
     subject: "Welcome to TrustedLinks – Verify Your Email",
html: `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:40px 24px;background:#ffffff;">
    <h1 style="color:#16a34a;font-size:34px;margin-bottom:28px;">
      Welcome to TrustedLinks
    </h1>

    <p style="font-size:20px;color:#111827;line-height:1.7;margin-bottom:20px;">
      Please verify your email address to activate your business account.
    </p>

    <div style="margin:36px 0;">
      <a href="${verifyUrl}"
         style="background:#16a34a;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:20px;font-weight:bold;display:inline-block;">
        Verify Email
      </a>
    </div>

    <p style="color:#6b7280;font-size:17px;">
      This link expires in 24 hours.
    </p>

    <p style="color:#6b7280;font-size:15px;margin-top:28px;">
      If you did not create this account, please ignore this email.
    </p>
  </div>
`,
text: `Verify your email: ${verifyUrl}`,

    return res.json({ ok: true });
  } catch (e) {
    console.error("resend-verification error:", e);

    return res.status(500).json({
      error: "Failed",
    });
  }
});

// =========================
// FORGOT PASSWORD
// =========================
router.post("/forgot-password", async (req, res) => {
  try {
    const emailNorm = String(req.body?.email || "")
      .toLowerCase()
      .trim();

    if (!emailNorm) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await getUserByEmail(emailNorm);

    // لا نكشف إذا الإيميل موجود أو لا
    if (!user) {
      return res.json({ ok: true });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await setResetToken(user.id, resetToken, expiresAt);

    const resetUrl = `${FRONTEND_BASE_URL}/reset-password?email=${encodeURIComponent(
      emailNorm
    )}&token=${encodeURIComponent(resetToken)}`;

    await sendEmail({
      to: emailNorm,
      subject: "Reset your Trusted Links password",
      html: `
        <p>You requested to reset your password.</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link expires in 30 minutes.</p>
      `,
      text: `Reset your password: ${resetUrl}`,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("forgot-password error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});
// =========================
// RESET PASSWORD
// =========================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};

    const user = await getUserByEmail(
      String(email).toLowerCase().trim()
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (!user.resetToken || !user.resetTokenExpiresAt) {
      return res.status(400).json({
        error: "Invalid token",
      });
    }

    if (user.resetToken !== token) {
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    if (new Date(user.resetTokenExpiresAt) < new Date()) {
      return res.status(410).json({
        error: "Expired token",
      });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await updateUserPassword(user.id, hash);

    return res.json({
      ok: true,
    });

  } catch (e) {
    console.error("reset-password error", e);

    return res.status(500).json({
      error: "Failed",
    });
  }
});
// =========================
// GET CURRENT USER
// =========================
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.userId);

    res.json({
      id: user.id,
      email: user.email,
      walletBalance: user.walletBalance,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

// =========================
// WHATSAPP OTP
// =========================
router.post("/whatsapp/request-otp", async (req, res) => {
  try {
    const clean = cleanDigits(req.body.whatsapp);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await deleteOtpByWhatsappPurpose(clean, "business_signup");

    await createOtp({
      whatsapp: clean,
      code: otp,
      purpose: "business_signup",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "OTP failed" });
  }
});

router.post("/whatsapp/verify-otp", async (req, res) => {
  try {
    const { whatsapp, code } = req.body;
    const clean = cleanDigits(whatsapp);

    const rec = await getOtp(clean, "business_signup");

    if (!rec || rec.code !== code) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await consumeOtp(rec.id);

    const token = jwt.sign(
      { whatsapp: clean, verified: true },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ ok: true, token });
  } catch (e) {
    res.status(500).json({ error: "OTP verify failed" });
  }
});

export default router;
