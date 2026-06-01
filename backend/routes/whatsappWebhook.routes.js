import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  res.status(200).json({ ok: true });

  // سننقل الكود هنا بعد تجهيز الاستيرادات
});

export default router;
