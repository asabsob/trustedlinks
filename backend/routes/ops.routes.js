import express from "express";
import supabase from "../db/postgres.js";

const router = express.Router();

router.get("/", (_req, res) => {
  return res.status(200).send("OK");
});

router.get("/healthz", (_req, res) => {
  return res.status(200).json({ ok: true });
});

router.get("/api/test", (_req, res) => {
  return res.json({
    ok: true,
    message: "✅ Backend is reachable",
  });
});

router.get("/api/health", (_req, res) => {
  return res.json({
    ok: true,
    javnaKeyLoaded: Boolean(process.env.JAVNA_API_KEY),
    resendKeyLoaded: Boolean(process.env.RESEND_API_KEY),
    mailFrom: process.env.MAIL_FROM || null,
  });
});

router.get("/api/ops/health", async (_req, res) => {
  try {
    const startedAt = process.uptime();

    const { error } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .limit(1);

    const dbOk = !error;

    return res.status(dbOk ? 200 : 503).json({
      ok: dbOk,
      service: "trustedlinks-backend",
      status: dbOk ? "healthy" : "degraded",
      uptimeSeconds: Math.round(startedAt),
      database: dbOk ? "connected" : "error",
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return res.status(503).json({
      ok: false,
      service: "trustedlinks-backend",
      status: "down",
      error: "health_check_failed",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
