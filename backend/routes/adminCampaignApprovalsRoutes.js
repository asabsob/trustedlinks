import express from "express";
import supabase from "../db/postgres.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/campaigns/pending", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ ok: true, campaigns: data || [] });
  } catch (err) {
    console.error("ADMIN PENDING CAMPAIGNS ERROR:", err);
    return res.status(500).json({ error: "Failed to load pending campaigns" });
  }
});

router.patch("/campaigns/:id/approve", requireAdmin, async (req, res) => {
  try {
    const adminId = req.admin?.id || null;

    const { data, error } = await supabase
      .from("campaigns")
      .update({
        status: "active",
        approval_status: "approved",
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ ok: true, campaign: data });
  } catch (err) {
    console.error("APPROVE CAMPAIGN ERROR:", err);
    return res.status(500).json({ error: "Failed to approve campaign" });
  }
});

router.patch("/campaigns/:id/reject", requireAdmin, async (req, res) => {
  try {
    const adminId = req.admin?.id || null;
    const { reason = "" } = req.body || {};

    const { data, error } = await supabase
      .from("campaigns")
      .update({
        status: "rejected",
        approval_status: "rejected",
        rejected_by: adminId,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;

    return res.json({ ok: true, campaign: data });
  } catch (err) {
    console.error("REJECT CAMPAIGN ERROR:", err);
    return res.status(500).json({ error: "Failed to reject campaign" });
  }
});

export default router;
