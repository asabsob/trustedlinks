import express from "express";
import supabase from "../db/postgres.js";

import { requireAdmin } from "./admin.routes.js";

import { createTransaction } from "../services/pg/transactions.js";

import {
  deductBusinessWallet,
  topupBusinessWallet,
} from "../services/pg/businessWallet.js";

import { createNotification } from "../services/notifications.js";

const router = express.Router();

function getAutoApprovalDecision(pendingCharge) {
  const score = Number(pendingCharge?.risk_score || 0);

  if (score >= 80) {
    return {
      autoApprove: false,
      autoReject: false,
      reason: "high_risk_manual_review",
    };
  }

  if (score <= 25) {
    return {
      autoApprove: true,
      autoReject: false,
      reason: "low_risk_auto_approve",
    };
  }

  return {
    autoApprove: false,
    autoReject: false,
    reason: "medium_risk_manual_review",
  };
}

async function mapBusinessNames(rows = []) {
  const businessIds = [
    ...new Set(
      rows
        .map((r) => String(r.business_id || "").trim())
        .filter(Boolean)
    ),
  ];

  if (businessIds.length === 0) return new Map();

  const { data } = await supabase
    .from("businesses")
    .select("id, name, name_ar")
    .in("id", businessIds);

  return new Map(
    (data || []).map((b) => [
      String(b.id),
      b.name || b.name_ar || String(b.id),
    ])
  );
}

router.get("/overview", requireAdmin, async (_req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const today = startOfDay.toISOString();

    const [events, pending] = await Promise.all([
      supabase
        .from("anti_fraud_events")
        .select("risk_level, action_taken, business_id, created_at")
        .gte("created_at", today),

      supabase
        .from("pending_charges")
        .select("id", { count: "exact" })
        .eq("status", "pending"),
    ]);

    const rows = events.data || [];

    const suspiciousToday = rows.filter((e) =>
      ["medium", "high", "critical"].includes(e.risk_level)
    ).length;

    const blockedToday = rows.filter(
      (e) => e.action_taken === "block"
    ).length;

    const heldToday = rows.filter((e) =>
      ["hold", "billing_hold"].includes(e.action_taken)
    ).length;

    const duplicateNoChargeToday = rows.filter(
      (e) => e.action_taken === "allow_duplicate_no_charge"
    ).length;

    const businessMap = new Map();

    rows.forEach((r) => {
      const id = String(r.business_id || "");
      if (!id) return;
      businessMap.set(id, (businessMap.get(id) || 0) + 1);
    });

    const topTargetedBusinesses = [...businessMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5).length;

    return res.json({
      ok: true,
      data: {
        suspiciousToday,
        blockedToday,
        heldToday,
        duplicateNoChargeToday,
        pendingCharges: pending.count || 0,
        topTargetedBusinesses,
      },
    });
  } catch (e) {
    console.error("fraud overview error:", e);
    return res.status(500).json({ ok: false });
  }
});

router.get("/events", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);

    let query = supabase
      .from("anti_fraud_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (req.query.riskLevel) {
      query = query.eq("risk_level", req.query.riskLevel);
    }

    if (req.query.action) {
      query = query.eq("action_taken", req.query.action);
    }

    if (req.query.businessId) {
      query = query.eq("business_id", req.query.businessId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const nameMap = await mapBusinessNames(data);

    const results = (data || []).map((e) => ({
      ...e,
      business_name: nameMap.get(String(e.business_id)) || null,
    }));

    return res.json({
      ok: true,
      data: results,
    });
  } catch (e) {
    console.error("fraud events error:", e);
    return res.status(500).json({ ok: false });
  }
});

router.post("/auto-process", requireAdmin, async (_req, res) => {
  try {
    const { data: pending, error } = await supabase
      .from("pending_charges")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      return res.status(500).json({
        error: "Failed to load pending charges",
      });
    }

    let approved = 0;
    let skipped = 0;

    for (const charge of pending || []) {
      const decision = getAutoApprovalDecision(charge);

      if (!decision.autoApprove) {
        skipped++;
        continue;
      }

      await createTransaction({
        userId: charge.business_id,
        businessId: charge.business_id,
        type: "debit",
        amount: Number(charge.amount || 0),
        currency: charge.currency || "USD",
        reason: "Auto-approved pending charge",
        eventType: "pending_charge_auto_approved",
        reference: charge.id,
        status: "completed",
        balanceBefore: 0,
        balanceAfter: 0,
        notes: decision.reason,
        meta: {
          pendingChargeId: charge.id,
          riskScore: charge.risk_score,
        },
      });

      await supabase
        .from("pending_charges")
        .update({
          status: "approved",
          charged_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", charge.id);

      approved++;
    }

    return res.json({
      ok: true,
      approved,
      skipped,
    });
  } catch (e) {
    console.error("auto process pending charges error:", e);
    return res.status(500).json({
      error: "Failed to auto process charges",
    });
  }
});

router.get("/pending-charges", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);

    const { data, error } = await supabase
      .from("pending_charges")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const nameMap = await mapBusinessNames(data);

    return res.json({
      ok: true,
      data: (data || []).map((row) => ({
        ...row,
        business_name: nameMap.get(String(row.business_id)) || null,
      })),
    });
  } catch (e) {
    console.error("pending charges error:", e);
    return res.status(500).json({ ok: false });
  }
});

router.post("/pending-charges/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    const { data: charge, error } = await supabase
      .from("pending_charges")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !charge) {
      return res.status(404).json({
        error: "Charge not found",
      });
    }

    if (charge.status !== "pending") {
      return res.status(400).json({
        error: "Already processed",
      });
    }

    const walletResult = await deductBusinessWallet({
      businessId: charge.business_id,
      amount: Number(charge.amount || 0),
      eventType: "pending_charge_approved",
      note: "Approved pending charge",
      meta: {
        pendingChargeId: charge.id,
        approvedBy: req.admin?.email || "admin",
      },
    });

    if (Number(walletResult?.balanceAfter) < 0) {
      await createNotification({
        audienceType: "admin",
        type: "billing",
        priority: "critical",
        title: "Negative balance detected",
        message: `Business ${charge.business_id} is now in negative balance after approving a pending charge.`,
        actionLabel: "Review revenue",
        actionUrl: "/admin/revenue",
        meta: {
          businessId: charge.business_id,
          pendingChargeId: charge.id,
          balanceAfter: Number(walletResult?.balanceAfter || 0),
          approvedBy: req.admin?.email || "admin",
        },
      });
    } else if (
      Number(walletResult?.balanceAfter) > 0 &&
      Number(walletResult?.balanceAfter) < 5
    ) {
      await createNotification({
        audienceType: "admin",
        type: "billing",
        priority: "high",
        title: "Low balance alert",
        message: `Business ${charge.business_id} wallet is low after approving a pending charge.`,
        actionLabel: "Review revenue",
        actionUrl: "/admin/revenue",
        meta: {
          businessId: charge.business_id,
          pendingChargeId: charge.id,
          balanceAfter: Number(walletResult?.balanceAfter || 0),
          approvedBy: req.admin?.email || "admin",
        },
      });
    }

    await supabase
      .from("pending_charges")
      .update({
        status: "approved",
        charged_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    return res.json({
      ok: true,
      balance: walletResult.balanceAfter,
      currency: walletResult.currency || "USD",
    });
  } catch (e) {
    console.error("approve pending charge error:", e);
    return res.status(500).json({
      error: "Failed to approve",
    });
  }
});

router.post("/pending-charges/:id/cancel", requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    const { data: charge, error } = await supabase
      .from("pending_charges")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !charge) {
      return res.status(404).json({
        error: "Charge not found",
      });
    }

    if (charge.status !== "pending") {
      return res.status(400).json({
        error: "Already processed",
      });
    }

    await supabase
      .from("pending_charges")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    return res.json({ ok: true });
  } catch (e) {
    console.error("cancel pending charge error:", e);
    return res.status(500).json({
      error: "Failed to cancel",
    });
  }
});

router.post("/refund/:businessId", requireAdmin, async (req, res) => {
  try {
    const businessId = String(req.params.businessId || "").trim();
    const amount = Number(req.body?.amount || 0);
    const reference = String(req.body?.reference || "").trim();
    const reason = String(req.body?.reason || "Fraud refund").trim();

    if (!businessId) {
      return res.status(400).json({
        error: "businessId required",
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount",
      });
    }

    const result = await topupBusinessWallet({
      businessId,
      amount,
      note: reason,
      meta: {
        reference,
        refundedBy: req.admin?.email || "admin",
      },
    });

    await createTransaction({
      userId: businessId,
      businessId,
      type: "credit",
      amount,
      currency: result.currency || "USD",
      reason,
      eventType: "fraud_refund",
      reference,
      status: "completed",
      balanceBefore: Number(result.balanceBefore || 0),
      balanceAfter: Number(result.balanceAfter || 0),
      notes: "Manual fraud refund by admin",
      meta: {
        refundedBy: req.admin?.email || "admin",
      },
    });

    await createNotification({
      audienceType: "admin",
      type: "billing",
      priority: "normal",
      title: "Refund completed",
      message: `A fraud refund of ${amount} USD was completed for business ${businessId}.`,
      actionLabel: "Open revenue page",
      actionUrl: "/admin/revenue",
      meta: {
        businessId,
        amount,
        reference,
        refundedBy: req.admin?.email || "admin",
      },
    });

    return res.json({
      ok: true,
      balance: result.balanceAfter,
      currency: result.currency || "USD",
    });
  } catch (e) {
    console.error("refund charge error:", e);
    return res.status(500).json({
      error: "Failed to refund",
    });
  }
});

router.get("/business-scores", requireAdmin, async (_req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("anti_fraud_events")
      .select("business_id, risk_score, action_taken, risk_level")
      .not("business_id", "is", null);

    if (error) {
      return res.status(500).json({
        error: "Failed to load fraud scores",
      });
    }

    const scoreMap = new Map();

    for (const e of events || []) {
      const businessId = String(e.business_id || "").trim();
      if (!businessId) continue;

      const current = scoreMap.get(businessId) || {
        businessId,
        suspiciousEvents: 0,
        blockedEvents: 0,
        totalRiskScore: 0,
        averageRiskScore: 0,
      };

      current.suspiciousEvents += 1;
      current.totalRiskScore += Number(e.risk_score || 0);

      if (String(e.action_taken || "") === "block") {
        current.blockedEvents += 1;
      }

      scoreMap.set(businessId, current);
    }

    const scores = [...scoreMap.values()].map((row) => ({
      ...row,
      averageRiskScore:
        row.suspiciousEvents > 0
          ? Math.round(
              (row.totalRiskScore / row.suspiciousEvents) * 10
            ) / 10
          : 0,
    }));

    return res.json({
      ok: true,
      scores,
    });
  } catch (e) {
    console.error("business fraud scores error:", e);
    return res.status(500).json({
      error: "Failed to load business fraud scores",
    });
  }
});

export default router;
