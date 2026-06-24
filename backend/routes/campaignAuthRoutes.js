import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import supabase from "../db/postgres.js";
import { requireCampaignManager } from "../middleware/auth.js";
import { sendEmail } from "../services/email.js";
import crypto from "crypto";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL || "https://trustedlinks.net";

function signCampaignToken(owner) {
  return jwt.sign(
    {
      id: owner.id,
      ownerId: owner.id,
      role: "campaign_manager",
      name: owner.name,
      email: owner.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      entityType = "mall",
      email,
      phone,
      username,
      password,
      country,
      city,
      acceptedTerms,
    } = req.body || {};

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        error: "Name, email, username, and password are required",
      });
    }

    if (!acceptedTerms) {
      return res.status(400).json({
        error: "You must accept the Terms and Conditions",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const usernameNorm = String(username).trim().toLowerCase();

    const { data: existing, error: existingError } = await supabase
      .from("campaign_owners")
      .select("id")
      .or(`email.eq.${emailNorm},username.eq.${usernameNorm}`)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return res.status(409).json({
        error: "Email or username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .insert({
        name: String(name).trim(),
        entity_type: entityType,
        email: emailNorm,
        phone: phone || null,
        username: usernameNorm,
        password_hash: passwordHash,
        country: country || null,
        city: city || null,
        status: "active",

        accepted_terms: true,
        accepted_terms_at: new Date().toISOString(),

        email_verified: false,
        email_verified_at: null,
        verification_token: verificationToken,
        verification_expires_at: verificationExpiresAt,
      })
      .select("*")
      .single();

    if (error) throw error;

    const API_BASE_URL =
  process.env.API_BASE_URL ||
  "https://trustedlinks-backend-production.up.railway.app";

const verifyUrl =
  `${API_BASE_URL}/api/campaign/auth/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: owner.email,
      subject: "Verify your TrustedLinks sponsor account",
      html: `
        <div style="font-family:Arial;padding:24px;line-height:1.6;color:#0f172a;">
          <h2 style="color:#16a34a;">Welcome to TrustedLinks</h2>

          <p>
            Please verify your email address to activate your sponsor account.
          </p>

          <a
            href="${verifyUrl}"
            style="
              display:inline-block;
              background:#16a34a;
              color:#fff;
              padding:13px 22px;
              border-radius:10px;
              text-decoration:none;
              font-weight:bold;
              margin:12px 0;
            "
          >
            Verify Email
          </a>

          <p style="color:#64748b;">
            This link expires in 24 hours.
          </p>

          <p style="color:#64748b;font-size:13px;">
            If you did not create this account, please ignore this email.
          </p>
        </div>
      `,
      text: `Verify your TrustedLinks sponsor account: ${verifyUrl}`,
    });

    return res.status(201).json({
      ok: true,
      message: "Account created. Please verify your email address.",
      owner: {
        id: owner.id,
        name: owner.name,
        entityType: owner.entity_type,
        email: owner.email,
        username: owner.username,
        country: owner.country,
        city: owner.city,
        status: owner.status,
        emailVerified: owner.email_verified,
      },
    });
  } catch (err) {
    console.error("CAMPAIGN REGISTER ERROR:", err);
    return res.status(500).json({
      error: "Campaign registration failed",
    });
  }
});

// VERIFY EMAIL
router.head("/verify-email", (req, res) => {
  return res.status(204).end();
});

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.redirect(
        `${FRONTEND_BASE_URL}/campaign/email-verified?status=invalid`
      );
    }

    const tokenNorm = String(token).trim();

    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .select("*")
      .eq("verification_token", tokenNorm)
      .maybeSingle();

    if (error) throw error;

    if (!owner) {
      return res.redirect(
        `${FRONTEND_BASE_URL}/campaign/email-verified?status=invalid`
      );
    }

    // مهم: إذا الحساب مفعل مسبقاً، لا تعرض Failed
    if (owner.email_verified === true) {
      return res.redirect(
        `${FRONTEND_BASE_URL}/campaign/email-verified?status=success`
      );
    }

    if (
      !owner.verification_expires_at ||
      new Date(owner.verification_expires_at) < new Date()
    ) {
      return res.redirect(
        `${FRONTEND_BASE_URL}/campaign/email-verified?status=expired`
      );
    }

    const { error: updateError } = await supabase
      .from("campaign_owners")
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),

        // لا تمسح التوكن فوراً حتى لا يفشل الرابط لو انفتح مرتين
        // verification_token: null,
        // verification_expires_at: null,
      })
      .eq("id", owner.id);

    if (updateError) throw updateError;

    return res.redirect(
      `${FRONTEND_BASE_URL}/campaign/email-verified?status=success`
    );
  } catch (err) {
    console.error("CAMPAIGN VERIFY EMAIL ERROR:", err);
    return res.redirect(
      `${FRONTEND_BASE_URL}/campaign/email-verified?status=error`
    );
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body || {};

    if (!login || !password) {
      return res.status(400).json({
        error: "Login and password are required",
      });
    }

    const loginNorm = String(login).trim().toLowerCase();

    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .select("*")
      .or(`email.eq.${loginNorm},username.eq.${loginNorm}`)
      .maybeSingle();

    if (error) throw error;

    if (!owner) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (owner.status !== "active") {
      return res.status(403).json({ error: "Account is not active" });
    }

    if (!owner.email_verified) {
      return res.status(403).json({
        error: "Please verify your email address before signing in.",
      });
    }

    const ok = await bcrypt.compare(String(password), owner.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signCampaignToken(owner);

    return res.json({
      ok: true,
      token,
      owner: {
        id: owner.id,
        name: owner.name,
        entityType: owner.entity_type,
        email: owner.email,
        username: owner.username,
        country: owner.country,
        city: owner.city,
        status: owner.status,
        emailVerified: owner.email_verified,
      },
    });
  } catch (err) {
    console.error("CAMPAIGN LOGIN ERROR:", err);
    return res.status(500).json({ error: "Campaign login failed" });
  }
});

// ME
router.get("/me", requireCampaignManager, async (req, res) => {
  try {
    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .select(
        "id, name, entity_type, email, username, phone, country, city, status, email_verified, created_at"
      )
      .eq("id", req.campaignOwner.ownerId)
      .maybeSingle();

    if (error) throw error;

    if (!owner) {
      return res.status(404).json({ error: "Campaign owner not found" });
    }

    return res.json({
      ok: true,
      owner,
    });
  } catch (err) {
    console.error("CAMPAIGN ME ERROR:", err);
    return res.status(500).json({ error: "Failed to load campaign owner" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const emailNorm = String(req.body?.email || "")
      .toLowerCase()
      .trim();

    if (!emailNorm) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .select("*")
      .eq("email", emailNorm)
      .maybeSingle();

    if (error) throw error;

    if (!owner) {
      return res.json({ ok: true });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("campaign_owners")
      .update({
        reset_token: resetToken,
        reset_token_expires_at: expiresAt,
        reset_token_used: false,
      })
      .eq("id", owner.id);

    if (updateError) throw updateError;

    const resetUrl = `${FRONTEND_BASE_URL}/campaign/reset-password/${resetToken}`;

    await sendEmail({
      to: owner.email,
      subject: "Reset your campaign password",
      html: `
        <div style="font-family:Arial;padding:20px;">
          <h2>Reset Password</h2>
          <p>Click the button below to reset your password.</p>
          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              background:#16a34a;
              color:#fff;
              padding:12px 22px;
              border-radius:10px;
              text-decoration:none;
              font-weight:bold;
            "
          >
            Reset Password
          </a>
          <p style="margin-top:20px;color:#666;">
            This link expires in 30 minutes.
          </p>
        </div>
      `,
      text: `Reset Password: ${resetUrl}`,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("CAMPAIGN FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({
      error: "Failed to process forgot password request",
    });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Token and new password are required",
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .select("*")
      .eq("reset_token", token)
      .maybeSingle();

    if (error) throw error;

    if (!owner) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (owner.reset_token_used) {
      return res.status(401).json({ error: "Token already used" });
    }

    if (
      !owner.reset_token_expires_at ||
      new Date(owner.reset_token_expires_at) < new Date()
    ) {
      return res.status(410).json({ error: "Expired token" });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    const { error: updateError } = await supabase
      .from("campaign_owners")
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires_at: null,
        reset_token_used: true,
      })
      .eq("id", owner.id);

    if (updateError) throw updateError;

    return res.json({ ok: true });
  } catch (err) {
    console.error("CAMPAIGN RESET PASSWORD ERROR:", err);
    return res.status(500).json({
      error: "Failed to reset password",
    });
  }
});

export default router;
