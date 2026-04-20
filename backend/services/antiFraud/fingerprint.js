import crypto from "crypto";

export function buildFingerprint({
  ip = "",
  userAgent = "",
  acceptLanguage = "",
  platform = "",
}) {
  const raw = [
    String(ip || "").trim(),
    String(userAgent || "").trim(),
    String(acceptLanguage || "").trim(),
    String(platform || "").trim(),
  ].join("|");

  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function hashPhone(phone = "") {
  const clean = String(phone || "").replace(/\D/g, "");
  if (!clean) return "";
  return crypto.createHash("sha256").update(clean).digest("hex");
}

export function hashText(value = "") {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}
