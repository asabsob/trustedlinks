import crypto from "crypto";

export function maskPhone(phone = "") {
  const clean = String(phone || "").replace(/\D/g, "");
  if (!clean) return "";
  if (clean.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

export function hashValue(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function hashPhone(phone = "") {
  const clean = String(phone || "").replace(/\D/g, "");
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
