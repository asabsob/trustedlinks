import supabase from "../../db/postgres.js";

const SESSION_TTL_MINUTES = 10;

export async function getConversationSession(userPhone) {
  const phone = String(userPhone || "").trim();
  if (!phone) return null;

  const { data, error } = await supabase
    .from("conversation_sessions")
    .select("*")
    .eq("user_phone", phone)
    .maybeSingle();

  if (error) {
    console.error("getConversationSession error:", error);
    return null;
  }

  if (!data) return null;

  const expired =
    data.expires_at && new Date(data.expires_at).getTime() < Date.now();

  if (expired) {
    await clearConversationSession(phone);
    return null;
  }

  return data;
}

export async function upsertConversationSession(userPhone, updates = {}) {
  const phone = String(userPhone || "").trim();
  if (!phone) return null;

  const expiresAt = new Date(
    Date.now() + SESSION_TTL_MINUTES * 60 * 1000
  ).toISOString();

  const payload = {
    user_phone: phone,
    state: updates.state || "idle",
    last_intent: updates.lastIntent ?? updates.last_intent ?? null,
    last_query: updates.lastQuery ?? updates.last_query ?? null,
    pending_action: updates.pendingAction ?? updates.pending_action ?? null,
    pending_question:
      updates.pendingQuestion ?? updates.pending_question ?? null,
    last_results: updates.lastResults ?? updates.last_results ?? [],
    context: updates.context ?? {},
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("conversation_sessions")
    .upsert(payload, { onConflict: "user_phone" })
    .select()
    .single();

  if (error) {
    console.error("upsertConversationSession error:", error);
    return null;
  }

  return data;
}

export async function clearConversationSession(userPhone) {
  const phone = String(userPhone || "").trim();
  if (!phone) return false;

  const { error } = await supabase
    .from("conversation_sessions")
    .delete()
    .eq("user_phone", phone);

  if (error) {
    console.error("clearConversationSession error:", error);
    return false;
  }

  return true;
}
