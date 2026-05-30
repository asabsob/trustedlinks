import express from "express";
import { requireUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-topup-order", requireUser, async (req, res) => {
  try {
    return res.status(403).json({
      ok: false,
      error: "Free top-up is currently disabled",
      reason: "FREE_TOPUP_DISABLED",
    });
  } catch (e) {
    console.error("create-topup-order error:", e);

    return res.status(500).json({
      ok: false,
      error: "Failed to create topup order",
    });
  }
});

export default router;
