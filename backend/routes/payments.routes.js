import express from "express";
import { requireUser } from "../middleware/auth.js";

import { getUserById } from "../services/pg/users.js";
import { getBusinessById } from "../services/pg/businesses.js";
import {
  createTopupOrder,
  getPendingTopupOrders,
} from "../services/pg/topupOrders.js";

import { logEvent } from "../services/pg/auditLogs.js";

import {
  getTopupOrderById,
  markTopupOrderPaid,
} from "../services/pg/topupOrders.js";

import { topupBusinessWallet } from "../services/pg/businessWallet.js";

import {
  beginIdempotentRequest,
  completeIdempotencyRecord,
} from "../services/antiFraud/idempotency.js";

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

// =========================
// GET BUSINESS TOPUP ORDER
// =========================
router.get("/topup-orders/:id", requireUser, async (req, res) => {
  try {
    const order = await getTopupOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: "Order not found",
      });
    }

    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    return res.json({
      ok: true,
      order,
    });
  } catch (e) {
    console.error("get-topup-order error:", e);
    return res.status(500).json({
      ok: false,
      error: "Failed to load order",
    });
  }
});

// =========================
// CONFIRM BUSINESS TOPUP ORDER
// =========================
router.post("/confirm-topup-order", requireUser, async (req, res) => {
  try {
    const orderId = String(req.body?.orderId || "").trim();

    if (!orderId) {
      return res.status(400).json({
        ok: false,
        error: "orderId required",
      });
    }

    const idem = await beginIdempotentRequest({
      req,
      scope: "confirm_topup_order",
      payload: {
        orderId,
        userId: req.user.id,
      },
    });

    if (!idem.ok) {
      await logEvent({
        event: "topup_confirm_idempotency_blocked",
        level: "warn",
        userId: req.user.id,
        meta: {
          orderId,
          type: idem.type,
          status: idem.response?.status,
          reason: idem.response?.body?.reason || null,
        },
      });

      return res.status(idem.response.status).json(idem.response.body);
    }

    const order = await getTopupOrderById(orderId);

    if (!order) {
      await logEvent({
        event: "topup_confirm_order_not_found",
        level: "warn",
        userId: req.user.id,
        meta: {
          orderId,
        },
      });

      return res.status(404).json({
        ok: false,
        error: "Order not found",
      });
    }

    if (String(order.userId) !== String(req.user.id)) {
      await logEvent({
        event: "topup_confirm_unauthorized",
        level: "warn",
        userId: req.user.id,
        businessId: order.businessId,
        meta: {
          orderId: order.id,
          ownerUserId: order.userId,
        },
      });

      return res.status(403).json({
        ok: false,
        error: "Unauthorized",
      });
    }

    if (order.status === "paid") {
      const business = await getBusinessById(order.businessId);

      const responseBody = {
        ok: true,
        alreadyPaid: true,
        balance: business?.wallet?.balance || 0,
        currency: business?.wallet?.currency || "USD",
        orderId: order.id,
      };

      await logEvent({
        event: "topup_already_paid",
        level: "info",
        userId: req.user.id,
        businessId: order.businessId,
        meta: {
          orderId: order.id,
        },
      });

      await completeIdempotencyRecord({
        scope: "confirm_topup_order",
        idempotencyKey: idem.idempotencyKey,
        responseCode: 200,
        responseBody,
      });

      return res.json(responseBody);
    }

    if (order.status !== "pending") {
      await logEvent({
        event: "topup_confirm_not_payable",
        level: "warn",
        userId: req.user.id,
        businessId: order.businessId,
        meta: {
          orderId: order.id,
          status: order.status,
        },
      });

      return res.status(400).json({
        ok: false,
        error: "Order is not payable",
      });
    }

    await logEvent({
      event: "topup_confirm_started",
      level: "info",
      userId: req.user.id,
      businessId: order.businessId,
      meta: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency || "USD",
        paymentMethod: order.paymentMethod || null,
      },
    });

    const result = await topupBusinessWallet({
      businessId: order.businessId,
      amount: order.amount,
      note: "Topup via order",
      meta: {
        orderId: order.id,
        paymentMethod: order.paymentMethod,
      },
    });

    await markTopupOrderPaid(order.id);

    const responseBody = {
      ok: true,
      balance: result.balanceAfter,
      currency: result.currency || "USD",
      orderId: order.id,
    };

    await logEvent({
      event: "topup_confirmed",
      level: "info",
      userId: req.user.id,
      businessId: order.businessId,
      meta: {
        orderId: order.id,
        amount: order.amount,
        balanceAfter: result.balanceAfter,
        currency: result.currency || "USD",
      },
    });

    await completeIdempotencyRecord({
      scope: "confirm_topup_order",
      idempotencyKey: idem.idempotencyKey,
      responseCode: 200,
      responseBody,
    });

    return res.json(responseBody);
  } catch (e) {
    console.error("confirm-topup-order error:", e);

    await logEvent({
      event: "topup_confirm_failed",
      level: "error",
      userId: req.user?.id,
      meta: {
        orderId: String(req.body?.orderId || "").trim() || null,
        error: e.message,
      },
    });

    return res.status(500).json({
      ok: false,
      error: "Failed to confirm payment",
    });
  }
});


export default router;
