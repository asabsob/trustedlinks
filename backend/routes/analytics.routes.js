import express from "express";

import { getBusinessById } from "../services/pg/businesses.js";
import { createBusinessEvent } from "../services/pg/businessEvents.js";
import { incrementBusinessEventField } from "../services/pg/businesses.js";

const router = express.Router();

async function getBusinessOwnerInfo(businessId) {
  const business = await getBusinessById(businessId);

  if (!business) return null;

  return {
    businessId: business.id,
    ownerUserId: String(business.ownerUserId || ""),
    business,
  };
}

async function pushEvent(businessId, field) {
  const fieldMap = {
    views: "views",
    clicks: "clicks",
    mediaViews: "media",
    mapClicks: "clicks",
    whatsappClicks: "whatsapp",
    messages: "whatsapp",
  };

  const mappedField = fieldMap[field];

  if (!mappedField) {
    throw new Error(`Unsupported event field: ${field}`);
  }

  return incrementBusinessEventField(businessId, mappedField);
}

async function logBusinessEvent({
  businessId,
  ownerUserId,
  type,
  source = "",
  meta = {},
}) {
  try {
    await createBusinessEvent({
      businessId,
      ownerUserId: String(ownerUserId || ""),
      type,
      source,
      meta,
    });
  } catch (e) {
    console.error("logBusinessEvent error:", e);
  }
}

router.post("/track-view", async (req, res) => {
  try {
    const { businessId } = req.body || {};

    if (!businessId) {
      return res.status(400).json({
        error: "businessId required",
      });
    }

    const info = await getBusinessOwnerInfo(businessId);

    if (!info) {
      return res.status(404).json({
        error: "Business not found",
      });
    }

    await pushEvent(businessId, "views");

    await logBusinessEvent({
      businessId: info.businessId,
      ownerUserId: info.ownerUserId,
      type: "view",
      source: "business_details_page",
    });

    return res.json({
      ok: true,
      charged: false,
    });
  } catch (e) {
    console.error("track-view error:", e);

    return res.status(500).json({
      error: "Failed",
    });
  }
});

export default router;
