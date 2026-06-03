import supabase from "../db/postgres.js";

const NOTIF_TTL_MIN = 10;

export async function shouldSendNotification({ key }) {
  const since = new Date(Date.now() - NOTIF_TTL_MIN * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("meta->>dedupKey", key)
    .gte("created_at", since);

  if (error) {
    console.error("notif dedup check error:", error);
    return true;
  }

  return (count || 0) === 0;
}

export async function createNotification({
  audienceType = "admin",
  audienceId = null,
  type = "system",
  priority = "normal",
  title = "",
  message = "",
  actionLabel = null,
  actionUrl = null,
  channel = "dashboard",
  meta = {},
}) {
  const payload = {
    audience_type: audienceType,
    audience_id: audienceId,
    type,
    priority,
    title: String(title || "").trim() || "Notification",
    message: String(message || "").trim(),
    action_label: actionLabel || null,
    action_url: actionUrl || null,
    channel,
    meta: meta || {},
  };

  if (!payload.message) {
    throw new Error("Notification message is required");
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function emitNotification({
  audienceType = "admin",
  audienceId = null,
  type = "system",
  priority = "normal",
  title,
  message,
  actionLabel = null,
  actionUrl = null,
  meta = {},
  dedupKey = null,
}) {
  if (!message) return;

  const finalKey = dedupKey || `${type}:${meta.businessId || "global"}`;
  const okToSend = await shouldSendNotification({ key: finalKey });

  if (!okToSend) return;

  await createNotification({
    audienceType,
    audienceId,
    type,
    priority,
    title,
    message,
    actionLabel,
    actionUrl,
    meta: {
      ...meta,
      dedupKey: finalKey,
    },
  });
}

export async function notifyFraudBlocked({
  businessId,
  tokenId,
  intentType,
  risk,
}) {
  const score = Number(risk.score || 0);
  const level = String(risk.riskLevel || "").toLowerCase();

  if (score < 80 && !["high", "critical"].includes(level)) return;

  await emitNotification({
    type: "fraud",
    priority: level === "critical" ? "critical" : "high",
    title: "Fraud attempt blocked",
    message: `Blocked ${intentType} lead (risk ${score}).`,
    actionLabel: "Open fraud center",
    actionUrl: "/admin/fraud",
    meta: {
      businessId,
      tokenId,
      intentType,
      riskScore: score,
      riskLevel: level,
      reasonCodes: risk.reasonCodes || [],
    },
    dedupKey: `block:${businessId}:${tokenId}`,
  });
}

export async function notifyPendingCharge({
  businessId,
  tokenId,
  risk,
}) {
  await emitNotification({
    type: "fraud",
    priority: "high",
    title: "Pending charge created",
    message: `Charge held for review (risk ${risk.score}).`,
    actionLabel: "Open fraud queue",
    actionUrl: "/admin/fraud",
    meta: {
      businessId,
      tokenId,
      riskScore: Number(risk.score || 0),
      riskLevel: risk.riskLevel,
      reasonCodes: risk.reasonCodes || [],
    },
    dedupKey: `hold:${businessId}:${tokenId}`,
  });
}
