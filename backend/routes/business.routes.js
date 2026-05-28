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
  getBusinessTransactions,
  updateCurrentBusiness,
  applyBusinessAIOptimization,
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

router.get("/transactions/:businessId", requireUser, getBusinessTransactions);

router.put("/update", requireUser, updateCurrentBusiness);

router.post("/apply-ai-optimization", requireUser, applyBusinessAIOptimization);


export default router;
