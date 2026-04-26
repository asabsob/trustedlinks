import crypto from "crypto";

const HASH_SECRET =
  process.env.HASH_SECRET ||
  process.env.JWT_SECRET ||
  "dev_secret_change_me";

export function maskPhone(phone = "") {
  const clean = String(phone || "").replace(/\D/g, "");
  if (!clean) return "";
  if (clean.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

export function hashValue(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  return crypto
    .createHmac("sha256", HASH_SECRET)
    .update(raw)
    .digest("hex");
}

export function hashPhone(phone = "") {
  const clean = String(phone || "").replace(/\D/g, "");
  if (!clean) return "";
  return hashValue(clean);
}

export function normalizeQueryForStorage(text = "") {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .slice(0, 160);
}

export function redactIp(ip = "") {
  const value = String(ip || "").trim();
  if (!value) return "";

  if (value.includes(".")) {
    const parts = value.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`;
    }
  }

  if (value.includes(":")) {
    const parts = value.split(":");
    return `${parts.slice(0, 3).join(":")}:x:x:x`;
  }

  return "redacted";
}

export function hashIp(ip = "") {
  const value = String(ip || "").trim();
  if (!value) return "";
  return hashValue(value);
}

export function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    ""
  );
}

export function getSessionId(req) {
  return (
    req.headers["x-session-id"] ||
    req.cookies?.tl_session_id ||
    req.body?.sessionId ||
    req.query?.sessionId ||
    ""
  );
}

export function sanitizeTextForLogs(text = "", maxLength = 80) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function buildSafeSearchLog({
  from = "",
  incomingText = "",
  intent = "",
  query = "",
  lang = "",
  messageType = "",
}) {
  return {
    userHash: hashPhone(from),
    maskedPhone: maskPhone(from),
    intent: String(intent || ""),
    queryNormalized: normalizeQueryForStorage(query || incomingText || ""),
    lang: String(lang || ""),
    messageType: String(messageType || ""),
  };
}

export function buildConsentProof(req, extra = {}) {
  return {
    ipHash: hashIp(getClientIp(req)),
    ipRedacted: redactIp(getClientIp(req)),
    userAgent: sanitizeTextForLogs(req.headers["user-agent"] || "", 180),
    sessionId: getSessionId(req),
    acceptedAt: new Date().toISOString(),
    ...extra,
  };
}
