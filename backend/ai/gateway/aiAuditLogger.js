// ============================================================================
// TrustedLinks AI Gateway - Audit Logger
// ============================================================================

export async function logAIEvent({
  type = "unknown",
  role = "unknown",
  action = "",
  status = "success",
  success = true,
  meta = {},
}) {
  try {
    const timestamp = new Date().toISOString();
    const isProd = process.env.NODE_ENV === "production";

    // In production, sanitize meta to exclude full result text
    let logMeta = meta;
    if (isProd) {
      logMeta = sanitizeMetaForProduction(meta);
    }

    console.log("AI_AUDIT_EVENT", {
      timestamp,
      type,
      role,
      action,
      status,
      success,
      ...logMeta,
    });

    // Later:
    // save into ai_audit_logs table
  } catch (err) {
    console.error("AI_AUDIT_LOG_ERROR", err);
  }
}

/**
 * Sanitizes meta object for production logging
 * Excludes full result text but includes resultLength
 */
function sanitizeMetaForProduction(meta) {
  const sanitized = {};

  // Include businessId if available
  if (meta.businessId) {
    sanitized.businessId = meta.businessId;
  }

  // Replace full result with resultLength
  if (meta.result) {
    sanitized.resultLength = String(meta.result).length;
  }

  // Include error message if present
  if (meta.error) {
    sanitized.error = meta.error;
  }

  // Include other safe metadata fields
  const safeFields = ["pageContext", "source", "action"];
  for (const field of safeFields) {
    if (meta[field]) {
      sanitized[field] = meta[field];
    }
  }

  return sanitized;
}
