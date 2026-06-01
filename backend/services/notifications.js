import supabase from "../db/postgres.js";

const NOTIF_TTL_MIN = 10;

export async function shouldSendNotification({ key }) {
  const since = new Date(
    Date.now() - NOTIF_TTL_MIN * 60 * 1000
  ).toISOString();

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

  const finalKey =
    dedupKey || `${type}:${meta.businessId || "global"}`;

  const okToSend = await shouldSendNotification({
    key: finalKey,
  });

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

export async function listNotifications({
  audienceType = "admin",
  audienceId = null,
  status = "",
  limit = 50,
}) {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("audience_type", audienceType)
    .order("created_at", { ascending: false })
    .limit(Math.min(Number(limit || 50), 200));

  if (audienceId) {
    query = query.eq("audience_id", audienceId);
  } else {
    query = query.is("audience_id", null);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

export async function markNotificationRead(id) {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

export async function markAllNotificationsRead({
  audienceType = "admin",
  audienceId = null,
}) {
  let query = supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString(),
    })
    .eq("audience_type", audienceType)
    .eq("status", "unread");

  if (audienceId) {
    query = query.eq("audience_id", audienceId);
  } else {
    query = query.is("audience_id", null);
  }

  const { error } = await query;

  if (error) throw error;

  return true;
}

export async function getUnreadNotificationCount({
  audienceType = "admin",
  audienceId = null,
}) {
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("audience_type", audienceType)
    .eq("status", "unread");

  if (audienceId) {
    query = query.eq("audience_id", audienceId);
  } else {
    query = query.is("audience_id", null);
  }

  const { count, error } = await query;

  if (error) throw error;

  return count || 0;
}
