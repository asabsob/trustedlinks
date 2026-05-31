import express from "express";
import supabase from "../db/postgres.js";
import { createLeadToken } from "../services/pg/leadTokens.js";

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

export default router;
