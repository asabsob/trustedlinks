import express from "express";
import { requireUser } from "../middleware/auth.js";

import { getUserById } from "../services/pg/users.js";
import { getBusinessById } from "../services/pg/businesses.js";
import {
  createTopupOrder,
  getPendingTopupOrders,
} from "../services/pg/topupOrders.js";

import { logEvent } from "../services/pg/auditLogs.js";

const router = express.Router();

router.post("/create-topup-order", requireUser, async (req, res) => {
  try {
    const FREE_TOPUP_ENABLED =
      process.env.FREE_TOPUP_ENABLED === "true";

    if (!FREE_TOPUP_ENABLED) {
      return res.status(403).json({
        ok: false,
        error: "Free top-up is currently disabled",
        reason: "FREE_TOPUP_DISABLED",
      });
    }

    const amount = Number(req.body?.amount || 0);
    const businessId = String(req.body?.businessId || "").trim();

    if (!businessId) {
      return res.status(400).json({
        ok: false,
        error: "businessId required",
      });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Invalid amount",
      });
    }

    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        ok: false,
        error: "User not found",
      });
    }

    const business = await getBusinessById(businessId);

    if (!business) {
      return res.status(404).json({
        ok: false,
        error: "Business not found",
      });
    }

    if (
      business.ownerUserId &&
      String(business.ownerUserId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized business",
      });
    }

    const MAX_TOPUP_LIMIT = 20;

    const requestedAmount = Number(amount);

    const currentBalance = Number(
      business?.wallet?.balance || 0
    );

    const pendingOrders = await getPendingTopupOrders(
      businessId
    );

    const pendingTotal = pendingOrders.reduce(
      (sum, order) => sum + Number(order.amount || 0),
      0
    );

    const remainingAllowed = Math.max(
      0,
      MAX_TOPUP_LIMIT - currentBalance - pendingTotal
    );

    if (requestedAmount > remainingAllowed) {
      await logEvent({
        event: "topup_limit_blocked",
        level: "warn",
        userId: user.id,
        businessId: business.id,
        meta: {
          requestedAmount,
          currentBalance,
          pendingTotal,
          limit: MAX_TOPUP_LIMIT,
          remainingAllowed,
        },
      });

      return res.status(400).json({
        ok: false,
        error: "Top-up limit exceeded for trial mode.",
        reason: "TOPUP_LIMIT_EXCEEDED",
        limit: MAX_TOPUP_LIMIT,
        currentBalance,
        pendingTotal,
        requestedAmount,
        remainingAllowed,
      });
    }

    const order = await createTopupOrder({
      businessId: business.id,
      userId: user.id,
      amount: requestedAmount,
      currency: business.wallet?.currency || "USD",
      reference: `topup_order_${Date.now()}`,
    });

    await logEvent({
      event: "topup_order_created",
      level: "info",
      userId: user.id,
      businessId: business.id,
      meta: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        currentBalance,
        pendingTotal,
        remainingAllowedAfterCreate: Math.max(
          0,
          MAX_TOPUP_LIMIT -
            currentBalance -
            pendingTotal -
            requestedAmount
        ),
      },
    });

    return res.json({
      ok: true,
      orderId: order.id,
      businessId: order.businessId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      reference: order.reference,
      trialLimit: MAX_TOPUP_LIMIT,
      remainingAllowed: Math.max(
        0,
        MAX_TOPUP_LIMIT -
          currentBalance -
          pendingTotal -
          requestedAmount
      ),
    });

  } catch (e) {
    console.error("create-topup-order error:", e);

    await logEvent({
      event: "topup_order_create_failed",
      level: "error",
      userId: req.user?.id,
      businessId:
        String(req.body?.businessId || "").trim() || null,
      meta: {
        amount: Number(req.body?.amount || 0),
        error: e.message,
      },
    });

    return res.status(500).json({
      ok: false,
      error: "Failed to create topup order",
    });
  }
});

export default router;
