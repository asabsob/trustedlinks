// ============================================================================
// TrustedLinks AI Gateway - Audit Logger
// ============================================================================

export async function logAIEvent({
  type = "unknown",
  role = "unknown",
  action = "",
  status = "success",
  meta = {},
}) {
  try {
    console.log("AI_AUDIT_EVENT", {
      timestamp: new Date().toISOString(),
      type,
      role,
      action,
      status,
      meta,
    });

    // Later:
    // save into ai_audit_logs table
  } catch (err) {
    console.error("AI_AUDIT_LOG_ERROR", err);
  }
}
