import supabase from "../../db/postgres.js";

export async function logAIEvent({
  type = "system",
  level = "info",

  source = "",
  action = "",

  status = "success",

  message = "",

  meta = {},
}) {
  try {
    await supabase
      .from("ai_operation_logs")
      .insert({
        type,
        level,

        source,
        action,

        status,

        message,

        meta,
      });
  } catch (e) {
    console.error("AI_LOG_EVENT_ERROR", e);
  }
}
