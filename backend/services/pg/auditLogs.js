import supabase from "../../db/postgres.js";

export async function logEvent({
  event,
  level = "info",
  whatsapp = null,
  ip = null,
  userAgent = null,
  meta = {},
}) {
  try {
    await supabase.from("audit_logs").insert({
      event,
      level,
      whatsapp,
      ip,
      user_agent: userAgent,
      meta,
    });
  } catch (e) {
    // لا نكسر النظام لو فشل logging
    console.error("audit log error:", e.message);
  }
}
