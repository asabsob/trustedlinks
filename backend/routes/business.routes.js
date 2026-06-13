import express from "express";
import { requireUser } from "../middleware/auth.js";
import {
  getBusinessByOwnerUserId,
  getBusinessByWhatsapp,
} from "../services/pg/businesses.js";

import {
  getCurrentBusiness,
  getBusinessReports,
  getBusinessTransactions,
  updateCurrentBusiness,
  applyBusinessAIOptimization,
  getBusinessBalance,
  directBusinessTopup,
} from "../controllers/business.controller.js";

import { translateBusinessContent } from "../services/ai/translateBusiness.js";
import { listBusinessTransactions } from "../services/pg/businessWallet.js";
import supabase from "../db/postgres.js";

import { getBusinessPricing } from "../utils/getBusinessPricing.js";

const router = express.Router();

router.options("*", (_req, res) => {
  res.sendStatus(204);
});

function toSafeCategoryValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "").trim();
}


router.get("/me", requireUser, getCurrentBusiness);

router.get("/reports", requireUser, getBusinessReports);

router.get("/transactions/:businessId", requireUser, getBusinessTransactions);

router.put("/update", requireUser, updateCurrentBusiness);

router.post("/apply-ai-optimization", requireUser, applyBusinessAIOptimization);
router.post("/ai-optimize", requireUser, applyBusinessAIOptimization);

router.get("/balance/:businessId", requireUser, getBusinessBalance);

router.post("/topup", requireUser, directBusinessTopup);

function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

router.put("/whatsapp", requireUser, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId || req.user?.userId;
    const whatsapp = cleanDigits(req.body?.whatsapp || "");

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    if (!/^\d{10,15}$/.test(whatsapp)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid WhatsApp number",
      });
    }

    const currentBusiness = await getBusinessByOwnerUserId(userId);

    if (!currentBusiness?.id) {
      return res.status(404).json({
        ok: false,
        error: "Business not found",
      });
    }

    const existingBusiness = await getBusinessByWhatsapp(whatsapp);

    if (
      existingBusiness?.id &&
      String(existingBusiness.id) !== String(currentBusiness.id)
    ) {
      return res.status(409).json({
        ok: false,
        error: "This WhatsApp number is already registered.",
        reason: "WHATSAPP_ALREADY_REGISTERED",
      });
    }

    const oldWhatsapp = currentBusiness.whatsapp || "";

    const { data, error } = await supabase
      .from("businesses")
    .update({
  whatsapp,
  updated_at: new Date().toISOString(),
})
      .eq("id", currentBusiness.id)
      .select("*")
      .maybeSingle();

    if (error) throw error;

   try {
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert({
      event: "business_whatsapp_updated",
      level: "info",
      user_id: userId,
      business_id: currentBusiness.id,
      metadata: {
        oldWhatsapp,
        newWhatsapp: whatsapp,
      },
      created_at: new Date().toISOString(),
    });

  if (auditError) {
    console.error("business whatsapp audit log error:", auditError);
  }
} catch (auditErr) {
  console.error("business whatsapp audit log error:", auditErr);
}
    return res.json({
      ok: true,
      business: data,
      whatsapp,
    });
  } catch (err) {
    console.error("business whatsapp update error:", err);

    return res.status(500).json({
      ok: false,
      error: "Failed to update WhatsApp number",
    });
  }
});

export default router;
