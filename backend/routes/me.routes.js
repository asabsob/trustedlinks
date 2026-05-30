import express from "express";
import { requireUser } from "../middleware/auth.js";
import { getUserById } from "../services/pg/users.js";

const router = express.Router();

router.get("/", requireUser, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      ok: true,
      id: user.id,
      email: user.email,
      walletBalance: user.walletBalance ?? 0,
      currency: user.currency || "USD",
      subscriptionPlan: user.subscriptionPlan || null,
    });
  } catch (e) {
    console.error("/api/me error:", e);
    return res.status(500).json({ error: "Failed" });
  }
});

export default router;
