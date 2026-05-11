import express from "express";
import supabase from "../db/postgres.js";
import { requireCampaignManager } from "../middleware/auth.js";

const router = express.Router();

// GET dashboard overview
router.get("/dashboard", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("owner_id", ownerId);

    if (error) throw error;

    const totalBudget = (campaigns || []).reduce(
      (sum, c) => sum + Number(c.total_budget || 0),
      0
    );

    const remainingBudget = (campaigns || []).reduce(
      (sum, c) => sum + Number(c.remaining_budget || 0),
      0
    );

    const usedBudget = totalBudget - remainingBudget;

    return res.json({
      ok: true,
      overview: {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === "active").length,
        totalBudget,
        usedBudget,
        remainingBudget,
      },
      campaigns,
    });
  } catch (err) {
    console.error("CAMPAIGN DASHBOARD ERROR:", err);
    return res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// CREATE campaign
router.post("/campaigns", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const {
      name,
      totalBudget = 0,
      currency = "JOD",
      creditPerBusiness = 20,
      startsAt = null,
      expiresAt = null,
    } = req.body || {};

    if (!name) {
      return res.status(400).json({ error: "Campaign name is required" });
    }

    const budget = Number(totalBudget || 0);

    if (!Number.isFinite(budget) || budget <= 0) {
      return res.status(400).json({ error: "Invalid campaign budget" });
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        owner_id: ownerId,
        name: String(name).trim(),
        total_budget: budget,
        remaining_budget: budget,
        currency,
        credit_per_business: Number(creditPerBusiness || 20),
        starts_at: startsAt,
        expires_at: expiresAt,
        status: "active",
      })
      .select("*")
      .single();

    if (error) throw error;

    return res.status(201).json({
      ok: true,
      campaign,
    });
  } catch (err) {
    console.error("CREATE CAMPAIGN ERROR:", err);
    return res.status(500).json({ error: "Failed to create campaign" });
  }
});

// LIST campaigns
router.get("/campaigns", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      ok: true,
      campaigns: campaigns || [],
    });
  } catch (err) {
    console.error("LIST CAMPAIGNS ERROR:", err);
    return res.status(500).json({ error: "Failed to load campaigns" });
  }
});

// UPDATE campaign status
router.patch("/campaigns/:id/status", requireCampaignManager, async (req, res) => {
  try {
    const ownerId = req.campaignOwner.ownerId;
    const campaignId = req.params.id;
    const { status } = req.body || {};

    const allowed = ["active", "paused", "completed", "cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .update({ status })
      .eq("id", campaignId)
      .eq("owner_id", ownerId)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({
      ok: true,
      campaign,
    });
  } catch (err) {
    console.error("UPDATE CAMPAIGN STATUS ERROR:", err);
    return res.status(500).json({ error: "Failed to update campaign" });
  }
});

export default router;
