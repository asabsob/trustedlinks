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

router.get("/balance/:businessId", requireUser, getBusinessBalance);

router.post("/topup", requireUser, directBusinessTopup);

export default router;
