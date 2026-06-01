import express from "express";
import supabase from "../db/postgres.js";

import { requireAdmin } from "../middleware/auth.js";

import {
  listAllUsers,
} from "../services/pg/users.js";

import {
  listAllBusinesses,
} from "../services/pg/businesses.js";

const router = express.Router();


// =========================
// ADMIN REVENUE
// =========================
router.get("/revenue", requireAdmin, async (_req, res) => {
  try {
    const [
      businessesRes,
      transactionsRes,
      pendingChargesRes,
      topupOrdersRes,
      fraudEventsRes,
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, name_ar, wallet_balance"),

      supabase
        .from("transactions")
        .select("amount, type, status, event_type, business_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),

      supabase
        .from("pending_charges")
        .select("amount, status, business_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),

      supabase
        .from("topup_orders")
        .select("amount, status, business_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),

      supabase
        .from("anti_fraud_events")
        .select("business_id, action_taken, risk_level, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
    ]);

    const businesses = businessesRes?.data || [];
    const transactions = transactionsRes?.data || [];
    const pendingCharges = pendingChargesRes?.data || [];
    const topupOrders = topupOrdersRes?.data || [];
    const fraudEvents = fraudEventsRes?.data || [];

    const safeNumber = (value) => Number(value || 0);

    const totalWalletExposure = businesses.reduce(
      (sum, b) => sum + safeNumber(b.wallet_balance),
      0
    );

    const lowBalanceBusinesses = businesses.filter((b) => {
      const bal = safeNumber(b.wallet_balance);
      return bal > 0 && bal < 5;
    }).length;

    const negativeBalanceBusinesses = businesses.filter(
      (b) => safeNumber(b.wallet_balance) < 0
    ).length;

    // ✅ Revenue should only count billed conversation-start debits
    const completedDebits = transactions.filter((t) => {
      const type = String(t.type || "").toLowerCase();
      const status = String(t.status || "completed").toLowerCase();
      const eventType = String(t.event_type || "").toLowerCase();

      return (
        type === "debit" &&
        status === "completed" &&
        eventType.startsWith("conversation_start")
      );
    });

    const completedCredits = transactions.filter((t) => {
      const type = String(t.type || "").toLowerCase();
      const status = String(t.status || "completed").toLowerCase();
      return type === "credit" && status === "completed";
    });

    const totalRevenue = completedDebits.reduce(
      (sum, t) => sum + safeNumber(t.amount),
      0
    );

    const totalRefunds = completedCredits
      .filter((t) => String(t.event_type || "").toLowerCase() === "fraud_refund")
      .reduce((sum, t) => sum + safeNumber(t.amount), 0);

    const approvedPendingAmount = pendingCharges
      .filter((p) => String(p.status || "").toLowerCase() === "approved")
      .reduce((sum, p) => sum + safeNumber(p.amount), 0);

    const openPendingAmount = pendingCharges
      .filter((p) => String(p.status || "").toLowerCase() === "pending")
      .reduce((sum, p) => sum + safeNumber(p.amount), 0);

    const totalTopups = topupOrders
      .filter((o) => String(o.status || "").toLowerCase() === "paid")
      .reduce((sum, o) => sum + safeNumber(o.amount), 0);

    const totalCharges = completedDebits.length;
    const avgRevenuePerLead = totalCharges > 0 ? totalRevenue / totalCharges : 0;

    const blockedFraudCount = fraudEvents.filter(
      (e) => String(e.action_taken || "").toLowerCase() === "block"
    ).length;

    const holdFraudCount = fraudEvents.filter((e) => {
      const action = String(e.action_taken || "").toLowerCase();
      return action === "hold" || action === "billing_hold";
    }).length;

    const suspiciousFraudCount = fraudEvents.filter((e) =>
      ["medium", "high", "critical"].includes(
        String(e.risk_level || "").toLowerCase()
      )
    ).length;

    const businessMap = new Map();

    businesses.forEach((b) => {
      businessMap.set(String(b.id), {
        id: b.id,
        name: b.name || b.name_ar || String(b.id),
        walletBalance: safeNumber(b.wallet_balance),
        suspiciousEvents: 0,
        blockedEvents: 0,
        holdEvents: 0,
        totalRevenue: 0,
        totalCharges: 0,
        totalRefunds: 0,
        roi: 0,
      });
    });

    completedDebits.forEach((t) => {
      const id = String(t.business_id || "");
      if (!businessMap.has(id)) return;

      const row = businessMap.get(id);
      row.totalRevenue += safeNumber(t.amount);
      row.totalCharges += 1;
    });

    completedCredits.forEach((t) => {
      if (String(t.event_type || "").toLowerCase() !== "fraud_refund") return;

      const id = String(t.business_id || "");
      if (!businessMap.has(id)) return;

      const row = businessMap.get(id);
      row.totalRefunds += safeNumber(t.amount);
    });

    fraudEvents.forEach((e) => {
      const id = String(e.business_id || "");
      if (!businessMap.has(id)) return;

      const row = businessMap.get(id);
      row.suspiciousEvents += 1;

      const action = String(e.action_taken || "").toLowerCase();
      if (action === "block") row.blockedEvents += 1;
      if (action === "hold" || action === "billing_hold") row.holdEvents += 1;
    });

    businessMap.forEach((row) => {
      row.roi = row.totalRevenue - row.totalRefunds;
    });

    const topRevenueBusinesses = [...businessMap.values()]
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10);

    const revenueByDayMap = new Map();
    completedDebits.forEach((t) => {
      const date = String(t.created_at || "").slice(0, 10);
      if (!date) return;

      revenueByDayMap.set(
        date,
        (revenueByDayMap.get(date) || 0) + safeNumber(t.amount)
      );
    });

    const revenueTrend = [...revenueByDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(2)),
      }));

    const refundsByDayMap = new Map();
    completedCredits
      .filter((t) => String(t.event_type || "").toLowerCase() === "fraud_refund")
      .forEach((t) => {
        const date = String(t.created_at || "").slice(0, 10);
        if (!date) return;

        refundsByDayMap.set(
          date,
          (refundsByDayMap.get(date) || 0) + safeNumber(t.amount)
        );
      });

    const refundTrend = [...refundsByDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, amount]) => ({
        date,
        amount: Number(amount.toFixed(2)),
      }));

    const netRevenue = totalRevenue - totalRefunds;

    return res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      data: {
        totalWalletExposure: Number(totalWalletExposure.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalRefunds: Number(totalRefunds.toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        totalTopups: Number(totalTopups.toFixed(2)),
        approvedPendingAmount: Number(approvedPendingAmount.toFixed(2)),
        openPendingAmount: Number(openPendingAmount.toFixed(2)),
        lowBalanceBusinesses,
        negativeBalanceBusinesses,
        businessCount: businesses.length,
        transactionCount: transactions.length,
        totalCharges,
        avgRevenuePerLead: Number(avgRevenuePerLead.toFixed(2)),
        blockedFraudCount,
        holdFraudCount,
        suspiciousFraudCount,
        topRevenueBusinesses,
        revenueTrend,
        refundTrend,
      },
    });
  } catch (e) {
    console.error("admin revenue error:", e);
    return res.status(500).json({
      ok: false,
      error: "Failed to load revenue data",
    });
  }
});
// =========================
// ADMIN INSIGHTS
// =========================
router.get("/insights", requireAdmin, async (_req, res) => {
  try {
    const [
      statsRes,
      fraudOverviewRes,
      revenueRes,
    ] = await Promise.all([
      Promise.all([listAllUsers(), listAllBusinesses()]),
      (async () => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const today = startOfDay.toISOString();

        const { data: fraudRows } = await supabase
          .from("anti_fraud_events")
          .select("risk_level, action_taken, business_id, created_at")
          .gte("created_at", today);

        const { count: pendingCount } = await supabase
          .from("pending_charges")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        const rows = fraudRows || [];

        return {
          suspiciousToday: rows.filter((e) =>
            ["medium", "high", "critical"].includes(String(e.risk_level || ""))
          ).length,
          blockedToday: rows.filter((e) => String(e.action_taken || "") === "block").length,
          heldToday: rows.filter((e) =>
            ["hold", "billing_hold"].includes(String(e.action_taken || ""))
          ).length,
          duplicateNoChargeToday: rows.filter(
            (e) => String(e.action_taken || "") === "allow_duplicate_no_charge"
          ).length,
          pendingCharges: pendingCount || 0,
        };
      })(),
      (async () => {
        const { data: businesses } = await supabase.from("businesses").select("*");
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);

        const biz = businesses || [];
        const tx = transactions || [];

        const totalRevenue = tx
          .filter(
            (t) =>
              String(t.type || "").toLowerCase() === "debit" &&
              String(t.status || "completed").toLowerCase() === "completed"
          )
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const lowBalanceBusinesses = biz.filter((b) => {
          const bal = Number(b.wallet_balance || 0);
          return bal > 0 && bal < 5;
        }).length;

        const negativeBalanceBusinesses = biz.filter(
          (b) => Number(b.wallet_balance || 0) < 0
        ).length;

        return {
          totalRevenue,
          lowBalanceBusinesses,
          negativeBalanceBusinesses,
        };
      })(),
    ]);

    const users = statsRes[0] || [];
    const businesses = statsRes[1] || [];
    const fraud = fraudOverviewRes;
    const revenue = revenueRes;

    const lines = [];

    lines.push(
      `Platform snapshot: ${businesses.length} businesses and ${users.length} users are currently registered.`
    );

    if (revenue.totalRevenue > 0) {
      lines.push(
        `Revenue signal: completed billed activity has generated ${revenue.totalRevenue.toFixed(
          2
        )} USD so far.`
      );
    } else {
      lines.push(`Revenue signal: no meaningful billed revenue has been recorded yet.`);
    }

    if (fraud.suspiciousToday > 0 || fraud.blockedToday > 0 || fraud.heldToday > 0) {
      lines.push(
        `Risk signal: today recorded ${fraud.suspiciousToday} suspicious events, ${fraud.blockedToday} blocked events, and ${fraud.heldToday} held events.`
      );
    } else {
      lines.push(`Risk signal: fraud activity is currently stable with no major escalation today.`);
    }

    if (fraud.pendingCharges > 0) {
      lines.push(
        `Operations signal: ${fraud.pendingCharges} pending charges need review to prevent revenue leakage or delayed decisions.`
      );
    }

    if (revenue.lowBalanceBusinesses > 0) {
      lines.push(
        `Billing readiness: ${revenue.lowBalanceBusinesses} businesses are running on low wallet balance and may require top-up soon.`
      );
    }

    if (revenue.negativeBalanceBusinesses > 0) {
      lines.push(
        `Account health: ${revenue.negativeBalanceBusinesses} businesses are already in negative balance and should be reviewed immediately.`
      );
    }

    if (fraud.duplicateNoChargeToday > 0) {
      lines.push(
        `Protection signal: ${fraud.duplicateNoChargeToday} duplicate no-charge events were prevented by the anti-fraud engine today.`
      );
    }

    lines.push(
      `Recommended focus: monitor pending charges, low-balance businesses, and unusual fraud spikes while maintaining revenue continuity.`
    );

    return res.json({
      ok: true,
      insight: lines.join("\n\n"),
    });
  } catch (e) {
    console.error("admin insights error:", e);
    return res.status(500).json({ ok: false, error: "Failed to load admin insights" });
  }
});

// =========================
// ADMIN AI SUMMARY
// =========================
router.post("/ai-summary", requireAdmin, async (_req, res) => {
  try {
    const [
      { data: businesses },
      { data: transactions },
      { data: fraudEvents },
      { count: pendingCount },
    ] = await Promise.all([
      supabase.from("businesses").select("*"),
      supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("anti_fraud_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("pending_charges")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const biz = businesses || [];
    const tx = transactions || [];
    const fraud = fraudEvents || [];

    const totalRevenue = tx
      .filter(
        (t) =>
          String(t.type || "").toLowerCase() === "debit" &&
          String(t.status || "completed").toLowerCase() === "completed"
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const refunds = tx
      .filter((t) => String(t.event_type || "").toLowerCase() === "fraud_refund")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const blocked = fraud.filter((e) => String(e.action_taken || "") === "block").length;
    const held = fraud.filter((e) =>
      ["hold", "billing_hold"].includes(String(e.action_taken || ""))
    ).length;
    const suspicious = fraud.filter((e) =>
      ["medium", "high", "critical"].includes(String(e.risk_level || ""))
    ).length;
    const duplicateSaved = fraud.filter(
      (e) => String(e.action_taken || "") === "allow_duplicate_no_charge"
    ).length;

    const lowBalance = biz.filter((b) => {
      const bal = Number(b.wallet_balance || 0);
      return bal > 0 && bal < 5;
    }).length;

    const negativeBalance = biz.filter((b) => Number(b.wallet_balance || 0) < 0).length;

    const summary = [
      `Trusted Links executive summary: ${biz.length} businesses are active in the current operating dataset.`,
      `Revenue status: billed transaction value stands at ${totalRevenue.toFixed(2)} USD, while recorded fraud refunds total ${refunds.toFixed(2)} USD.`,
      `Fraud status: ${suspicious} suspicious events were detected, with ${blocked} blocked and ${held} held for manual or delayed review.`,
      `Protection impact: the platform prevented ${duplicateSaved} duplicate no-charge events through its anti-fraud protection layer.`,
      `Operational pressure: ${pendingCount || 0} pending charges remain open, ${lowBalance} businesses are on low balance, and ${negativeBalance} are in negative balance.`,
      `Recommended action: review pending charges first, push top-up actions for low-balance businesses, and continue monitoring fraud patterns around repeated device or fingerprint activity.`,
    ].join("\n\n");

    return res.json({
      ok: true,
      summary,
    });
  } catch (e) {
    console.error("admin ai summary error:", e);
    return res.status(500).json({ ok: false, error: "Failed to generate AI summary" });
  }
});

// =========================
// SETTINGS
// =========================
let ADMIN_SETTINGS = {
  theme: "light",
 email: process.env.ADMIN_EMAIL || "",
};

router.get("/settings", requireAdmin, async (_req, res) => {
  return res.json({ ok: true, settings: ADMIN_SETTINGS });
});

router.post("/settings", requireAdmin, async (req, res) => {
  ADMIN_SETTINGS = { ...ADMIN_SETTINGS, ...(req.body || {}) };
  return res.json({ ok: true, settings: ADMIN_SETTINGS });
});

export default router;
