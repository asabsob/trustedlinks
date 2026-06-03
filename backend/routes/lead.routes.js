import express from "express";
import supabase from "../db/postgres.js";

import {
  createLeadToken,
  getLeadTokenById,
} from "../services/pg/leadTokens.js";

import {
  buildFingerprint,
  hashPhone as hashFraudPhone,
} from "../services/antiFraud/fingerprint.js";

import { buildChargeKey } from "../services/antiFraud/dedupe.js";
import { analyzeLeadSignals } from "../services/antiFraud/analyzeSignals.js";
import { calculateRiskScore } from "../services/antiFraud/scoring.js";

import {
  logFraudEvent,
  findActiveChargeLock,
  createChargeLock,
  createPendingCharge,
} from "../services/antiFraud/store.js";

import { hashValue } from "../utils/privacy.js";
import { deductWalletBalance } from "../services/billing.service.js";

import {
  notifyFraudBlocked,
  notifyPendingCharge,
} from "../services/notifications.service.js";

import { renderLeadConsentPage } from "../services/leadConsent.service.js";

import { renderWhatsAppRedirectPage } from "../services/leadRedirect.service.js";

const router = express.Router();

router.post("/api/create-lead", async (req, res) => {
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

router.get("/l/:token", async (req, res) => {
  try {
    const tokenId = String(req.params.token || "").trim();

    if (!tokenId) {
      return res.status(400).send("Invalid lead token");
    }

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
      console.error("Lead token missing businessId", {
        tokenId,
        tokenRow,
      });

      return res.status(400).send("Invalid lead token business");
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return res.status(410).send("Lead link expired");
    }

    const intentType =
      String(tokenRow.intent_type || tokenRow.intentType || "category").trim() ||
      "category";

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

  const redirectHtml = renderWhatsAppRedirectPage({
  waUrl,
  fallbackUrl,
});

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

      const looksEnglish =
        /[a-zA-Z]/.test(rawQuery) &&
        !/[\u0600-\u06FF]/.test(rawQuery);

      const pageLang = rawLang || (looksEnglish ? "en" : "ar");
      const isAr = pageLang === "ar";

    if (!accepted) {
  return res.send(
    renderLeadConsentPage({
      tokenId,
      isAr,
    })
  );
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
          language: pageLang,
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
        meta: {
          ip,
          fingerprint,
        },
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
        return res.send(redirectHtml);
      }

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

      await createChargeLock({
        business_id: businessId,
        user_phone_hash: userPhoneHash || null,
        fingerprint: fingerprint || null,
        ip_address: ip || null,
        charge_key: chargeKey,
        first_token_id: tokenId,
        expires_at: expiresAt,
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
      action_taken: existingLock
        ? "allow_duplicate_no_charge"
        : actionTaken,
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

    return res.send(redirectHtml);
  } catch (error) {
    console.error("Lead redirect anti-fraud error:", error);
    return res.status(500).send("Internal server error");
  }
});

export default router;
