import express from "express";
import { requireUser } from "../middleware/auth.js";
import {
  getBusinessByOwnerUserId,
  getBusinessById,
  updateBusinessByOwnerUserId,
} from "../services/pg/businesses.js";

import {
  getCurrentBusiness,
  getBusinessReports,
} from "../controllers/business.controller.js";

import { translateBusinessContent } from "../services/ai/translateBusiness.js";
import { listBusinessTransactions } from "../services/pg/businessWallet.js";
import supabase from "../db/postgres.js";

const router = express.Router();

router.options("*", (_req, res) => {
  res.sendStatus(204);
});

function toSafeCategoryValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "").trim();
}

function getBusinessPricing(business = {}) {
  const countryCode = String(
    business.countryCode ||
      business.country_code ||
      ""
  ).toUpperCase();

  const phone = String(
    business.whatsapp ||
      ""
  ).replace(/\D/g, "");

  if (countryCode === "JO" || phone.startsWith("962")) {
    return {
      currency: "JOD",
      direct: 0.2,
      category: 0.25,
      nearby: 0.3,
    };
  }

  if (countryCode === "QA" || phone.startsWith("974")) {
    return {
      currency: "QAR",
      direct: 1,
      category: 1.25,
      nearby: 1.5,
    };
  }

  if (countryCode === "SA" || phone.startsWith("966")) {
    return {
      currency: "SAR",
      direct: 1,
      category: 1.25,
      nearby: 1.5,
    };
  }

  if (countryCode === "AE" || phone.startsWith("971")) {
    return {
      currency: "AED",
      direct: 1,
      category: 1.25,
      nearby: 1.5,
    };
  }

  return {
    currency: "USD",
    direct: 0.25,
    category: 0.3,
    nearby: 0.4,
  };
}

router.get("/me", requireUser, getCurrentBusiness);

router.get("/reports", requireUser, getBusinessReports);

router.get("/transactions/:businessId", requireUser, async (req, res) => {
  try {
    const { businessId } = req.params;
    const limit = Math.min(Number(req.query.limit || 10), 100);

    const business = await getBusinessById(businessId);

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (
      business.ownerUserId &&
      String(business.ownerUserId) !== String(req.user.id)
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const transactions = await listBusinessTransactions(business.id, limit);

    return res.json({
      ok: true,
      transactions: transactions.map((tx) => ({
        id: String(tx.id),
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency || "USD",
        reason: tx.reason || "",
        eventType: tx.eventType || "",
        reference: tx.reference || "",
        status: tx.status || "completed",
        balanceBefore: Number(tx.balanceBefore || 0),
        balanceAfter: Number(tx.balanceAfter || 0),
        date: tx.createdAt,
      })),
    });
  } catch (e) {
    console.error("business transactions error:", e?.message, e);

    return res.status(500).json({
      error: "Failed to load business transactions",
    });
  }
});

router.put("/update", requireUser, async (req, res) => {
  try {
    const existing = await getBusinessByOwnerUserId(String(req.user.id));

    if (!existing) {
      return res.status(404).json({ error: "Business not found" });
    }

    const payload = {
      name: req.body.name,
      name_ar: req.body.name_ar,
      description: req.body.description,
      description_ar: req.body.description_ar,
      keywords: Array.isArray(req.body.keywords) ? req.body.keywords : [],
      keywords_ar: Array.isArray(req.body.keywords_ar)
        ? req.body.keywords_ar
        : [],
      category: Array.isArray(req.body.category) ? req.body.category : [],
      whatsapp: req.body.whatsapp,
      mediaLink: req.body.mediaLink || "",
      logo: req.body.logo || "",
      locationText: req.body.locationText || "",
      countryCode: req.body.countryCode || "",
      countryName: req.body.countryName || "",
    };

    const lang = String(req.body?.lang || "en").toLowerCase();

    if (lang === "ar") {
      const sourceDescription = String(payload.description_ar || "").trim();

      const sourceKeywords = Array.isArray(payload.keywords_ar)
        ? payload.keywords_ar.map((k) => String(k).trim()).filter(Boolean)
        : [];

      if (sourceDescription || sourceKeywords.length) {
        const translated = await translateBusinessContent({
          description: sourceDescription,
          keywords: sourceKeywords,
          sourceLang: "ar",
        });

        if (translated) {
          payload.description_ar =
            translated.description_ar || sourceDescription;

          payload.description =
            translated.description_en || payload.description || "";

          payload.keywords_ar = Array.isArray(translated.keywords_ar)
            ? translated.keywords_ar
            : sourceKeywords;

          payload.keywords = Array.isArray(translated.keywords_en)
            ? translated.keywords_en
            : payload.keywords || [];
        }
      }
    } else {
      const sourceDescription = String(payload.description || "").trim();

      const sourceKeywords = Array.isArray(payload.keywords)
        ? payload.keywords.map((k) => String(k).trim()).filter(Boolean)
        : [];

      if (sourceDescription || sourceKeywords.length) {
        const translated = await translateBusinessContent({
          description: sourceDescription,
          keywords: sourceKeywords,
          sourceLang: "en",
        });

        if (translated) {
          payload.description =
            translated.description_en || sourceDescription;

          payload.description_ar =
            translated.description_ar || payload.description_ar || "";

          payload.keywords = Array.isArray(translated.keywords_en)
            ? translated.keywords_en
            : sourceKeywords;

          payload.keywords_ar = Array.isArray(translated.keywords_ar)
            ? translated.keywords_ar
            : payload.keywords_ar || [];
        }
      }
    }

    const updated = await updateBusinessByOwnerUserId(
      String(req.user.id),
      payload
    );

    const formatted = {
      ...updated,

      logo:
        updated.logo ||
        (updated.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(
          String(updated.mediaLink)
        )
          ? updated.mediaLink
          : ""),

      whatsappLink: updated.whatsapp
        ? `https://wa.me/${String(updated.whatsapp).replace(/\D/g, "")}`
        : "",
    };

    return res.json({
      ok: true,
      business: formatted,
    });
  } catch (e) {
    console.error("update business error:", e);

    return res.status(500).json({
      error: "Update failed",
    });
  }
});

export default router;
