import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

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

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

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
router.post("/signup", async (req, res) => {
  try {
    const { email, password, business } = req.body;

    if (!email || !password || !business) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailNorm = email.trim().toLowerCase();

    const existingUser = await getUserByEmail(emailNorm);
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const existingBusiness = await getBusinessByWhatsapp(business.whatsapp);
    if (existingBusiness) {
      return res.status(409).json({ error: "WhatsApp already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const user = await createUser({
      email: emailNorm,
      passwordHash,
      verifyToken,
      emailVerified: false,
    });

    const createdBusiness = await createBusiness({
      ownerUserId: user.id,
      ...business,
    });

    return res.status(201).json({
      ok: true,
      userId: user.id,
      businessId: createdBusiness.id,
    });
  } catch (e) {
    console.error("signup error:", e);
    res.status(500).json({ error: "Signup failed" });
  }
});

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const token = signUserToken(user.id);

    res.json({
      ok: true,
      token,
      walletBalance: user.walletBalance,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

// =========================
// VERIFY EMAIL
// =========================
router.get("/verify-email", async (req, res) => {
  try {
    const { email, token } = req.query;

    const user = await verifyUserEmail(email, token);

    if (!user) {
      return res.status(400).send("Invalid token");
    }

    res.send("Email verified ✅");
  } catch (e) {
    console.error(e);
    res.status(500).send("Verification failed");
  }
});

// =========================
// RESEND VERIFICATION
// =========================
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "Not found" });

    const token = nanoid(32);
    await setVerifyToken(user.id, token);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

// =========================
// FORGOT PASSWORD
// =========================
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase();

    const user = await getUserByEmail(email);
    if (!user) {
      return res.json({ ok: true });
    }

    const token = nanoid(40);
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await setResetToken(user.id, token, expires);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

// =========================
// RESET PASSWORD
// =========================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    const user = await getUserByEmail(email);

    if (!user || user.resetToken !== token) {
      return res.status(400).json({ error: "Invalid token" });
    }

    if (new Date(user.resetTokenExpiresAt) < new Date()) {
      return res.status(400).json({ error: "Expired token" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user.id, hash);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed" });
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
