import express from "express";
import supabase from "../db/postgres.js";

import {
  createLeadToken,
  getLeadTokenById,
} from "../services/pg/leadTokens.js";

import { getBusinessById } from "../services/pg/businesses.js";
import { deductBusinessWallet } from "../services/pg/businessWallet.js";

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

const router = express.Router();

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

function getBusinessPricing(business = {}) {
  const countryCode = String(
    business.countryCode || business.country_code || ""
  ).toUpperCase();

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
    const campaign = claim?.funding_codes?.campaigns;

    if (!campaign || campaign.status !== "active") {
      return {
        ok: false,
        skipped: true,
        reason: "No active campaign",
      };
    }

    const campaignRemaining = Number(campaign.remaining_budget || 0);

    if (campaignRemaining < amount) {
      return {
        ok: false,
        skipped: true,
        reason: "Campaign budget insufficient",
      };
    }

    const newSponsoredBalance = Number((sponsoredBalance - amount).toFixed(2));
    const newCampaignRemaining = Number((campaignRemaining - amount).toFixed(2));

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
      return {
        ok: true,
        skipped: true,
        reason: "No charge for this event",
      };
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
      await emitNotification({
        type: "billing",
        priority: "high",
        title: "Low balance alert",
        message: `Business ${businessId} wallet balance is low (${result.balanceAfter}).`,
        actionLabel: "Review revenue",
        actionUrl: "/admin/revenue",
        meta: {
          businessId,
          balanceAfter: Number(result.balanceAfter),
        },
        dedupKey: `low:${businessId}`,
      });
    }

    if (Number(result.balanceAfter) < 0) {
      await emitNotification({
        type: "billing",
        priority: "critical",
        title: "Negative balance detected",
        message: `Business ${businessId} is in negative balance (${result.balanceAfter}).`,
        actionLabel: "Review account",
        actionUrl: "/admin/revenue",
        meta: {
          businessId,
          balanceAfter: Number(result.balanceAfter),
        },
        dedupKey: `neg:${businessId}`,
      });
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

    return {
      ok: false,
      error: "Deduction failed",
    };
  }
}

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

      const looksEnglish =
        /[a-zA-Z]/.test(rawQuery) &&
        !/[\u0600-\u06FF]/.test(rawQuery);

      const pageLang = rawLang || (looksEnglish ? "en" : "ar");
      const isAr = pageLang === "ar";

      if (!accepted) {
        const title = isAr ? "المتابعة إلى واتساب" : "Continue to WhatsApp";

        const consentMessage = isAr
          ? "سيقوم TrustedLinks بتحويلك بأمان إلى النشاط التجاري المختار عبر واتساب."
          : "TrustedLinks will safely redirect you to the selected business on WhatsApp.";

        const buttonText = isAr
          ? "أوافق وأكمل إلى واتساب"
          : "Agree and continue to WhatsApp";

        const loadingText = isAr
          ? "جاري فتح واتساب..."
          : "Opening WhatsApp...";

        const note = isAr
          ? "سيتم فتح واتساب بعد التأكيد."
          : "WhatsApp will open after confirmation.";

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
    <p>${consentMessage}</p>

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
