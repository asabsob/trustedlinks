// ============================================================================
// TrustedLinks AI Gateway - Mask Sensitive Data
// ============================================================================

export function maskSensitiveData(input = "") {
  if (!input) return "";

  return String(input)

    // Phone numbers
    .replace(/\b\d{10,15}\b/g, "[MASKED_PHONE]")

    // Emails
    .replace(
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
      "[MASKED_EMAIL]"
    )

    // Bearer tokens
    .replace(
      /Bearer\s+[A-Za-z0-9._-]+/gi,
      "Bearer [MASKED_TOKEN]"
    )

    // API keys
    .replace(
      /api[_-]?key\s*[:=]\s*['"]?[^'"\s]+/gi,
      "api_key=[MASKED]"
    )

    // JWT-like strings
    .replace(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+/g,
      "[MASKED_JWT]"
    )

    // Supabase service keys
    .replace(
      /sbp_[A-Za-z0-9]+/g,
      "[MASKED_SUPABASE_KEY]"
    );
}
