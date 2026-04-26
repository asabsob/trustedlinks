import express from "express";
import { supabase } from "../db/postgres.js";
import {
  hashPhone,
  hashIp,
  getClientIp,
  getSessionId,
  buildConsentProof,
} from "../utils/privacy.js";

const router = express.Router();

const CURRENT_POLICY_VERSION = "v1.0";

function getUserId(req) {
  return req.user?.id || req.userId || null;
}

function getPhoneHash(req) {
  const phone = req.user?.phone || req.body?.phone || req.query?.phone || "";
  return phone ? hashPhone(phone) : "";
}

/**
 * GET /api/privacy/status
 */
router.get("/status", async (req, res) => {
  try {
    const userId = getUserId(req);
    const sessionId = getSessionId(req);
    const phoneHash = getPhoneHash(req);

    let query = supabase
      .from("privacy_consents")
      .select("*")
      .eq("status", "granted")
      .eq("policy_version", CURRENT_POLICY_VERSION)
      .order("created_at", { ascending: false })
      .limit(1);

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (phoneHash) {
      query = query.eq("user_phone_hash", phoneHash);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else {
      return res.json({
        valid: false,
        policyVersion: CURRENT_POLICY_VERSION,
      });
    }

    const { data, error } = await query;

    if (error) throw error;

    const consent = data?.[0] || null;

    return res.json({
      valid: !!consent?.service_consent,
      policyVersion: CURRENT_POLICY_VERSION,
      consent,
    });
  } catch (err) {
    console.error("privacy status error:", err);
    return res.status(500).json({
      error: "Failed to check privacy consent status",
    });
  }
});

/**
 * POST /api/privacy/consents
 */
router.post("/consents", async (req, res) => {
  try {
    const {
      service = true,
      profiling = true,
      marketing = false,
      language = "ar",
      source = "web",
      phone = "",
    } = req.body || {};

    if (!service) {
      return res.status(400).json({
        error: "Service consent is required to continue",
        code: "SERVICE_CONSENT_REQUIRED",
      });
    }

    const userId = getUserId(req);
    const sessionId = getSessionId(req);
    const phoneHash = phone ? hashPhone(phone) : getPhoneHash(req);

    const payload = {
      user_id: userId,
      user_phone_hash: phoneHash || null,
      session_id: sessionId || null,

      service_consent: true,
      profiling_consent: !!profiling,
      marketing_consent: !!marketing,

      status: "granted",
      policy_version: CURRENT_POLICY_VERSION,
      language,
      source,

      ip_hash: hashIp(getClientIp(req)) || null,
      user_agent: req.headers["user-agent"] || null,

      proof_json: buildConsentProof(req, {
        policyVersion: CURRENT_POLICY_VERSION,
        service: true,
        profiling: !!profiling,
        marketing: !!marketing,
        consentText:
          language === "ar"
            ? "سيتم استخدام رقمك وبيانات البحث لبدء محادثة واتساب مع النشاط المختار، وتحسين النتائج، وحماية الخدمة من إساءة الاستخدام."
            : "We will use your phone number and search activity to start a WhatsApp conversation with the selected business, improve results, and protect the service from abuse.",
      }),
    };

    const { data, error } = await supabase
      .from("privacy_consents")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      consent: data,
    });
  } catch (err) {
    console.error("create privacy consent error:", err);
    return res.status(500).json({
      error: "Failed to save privacy consent",
    });
  }
});

/**
 * POST /api/privacy/withdraw
 */
router.post("/withdraw", async (req, res) => {
  try {
    const userId = getUserId(req);
    const sessionId = getSessionId(req);
    const phoneHash = getPhoneHash(req);

    let query = supabase
      .from("privacy_consents")
      .update({
        status: "withdrawn",
        withdrawn_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("status", "granted");

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (phoneHash) {
      query = query.eq("user_phone_hash", phoneHash);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else {
      return res.status(400).json({
        error: "No user, phone, or session identifier found",
      });
    }

    const { error } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      message: "Consent withdrawn successfully",
    });
  } catch (err) {
    console.error("withdraw privacy consent error:", err);
    return res.status(500).json({
      error: "Failed to withdraw privacy consent",
    });
  }
});

export default router;
