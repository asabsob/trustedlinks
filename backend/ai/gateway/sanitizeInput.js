// ============================================================================
// TrustedLinks AI Gateway - Sanitize Input
// ============================================================================

import { maskSensitiveData } from "./maskSensitiveData.js";

const BLOCKED_KEYS = [
  "password",
  "token",
  "secret",
  "service_key",
  "jwt",
  "otp",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
];

export function sanitizeAIInput(payload = {}) {
  const safePayload = JSON.parse(JSON.stringify(payload));

  function clean(obj) {
    if (typeof obj === "string") {
      return maskSensitiveData(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(clean);
    }

    if (obj && typeof obj === "object") {
      const cleaned = {};

      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = String(key).toLowerCase();

        if (BLOCKED_KEYS.includes(lowerKey)) {
          cleaned[key] = "[REMOVED]";
        } else {
          cleaned[key] = clean(value);
        }
      }

      return cleaned;
    }

    return obj;
  }

  return clean(safePayload);
}
