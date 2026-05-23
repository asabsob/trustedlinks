import express from "express";
import jwt from "jsonwebtoken";

import {
  deleteOtpByWhatsappPurpose,
  createOtp,
  getOtp,
  consumeOtp,
  incrementOtpAttempts,
  blockOtp,
} from "../services/pg/otps.js";

import { getBusinessByWhatsapp } from "../services/pg/businesses.js";
import { logEvent } from "../services/pg/auditLogs.js";
import { javnaSendOtpTemplate } from "../services/whatsapp/javnaClient.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

const OTP_EXPIRES_SECONDS = 5 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_VERIFY_ATTEMPTS = 5;

function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
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

// REQUEST OTP
router.post("/request-otp", async (req, res) => {
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

    if (!process.env.JAVNA_API_KEY || !process.env.JAVNA_FROM) {
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

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
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

export default router;
