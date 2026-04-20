import { hashText } from "./fingerprint.js";

export function buildChargeKey({
  businessId = "",
  userPhoneHash = "",
  fingerprint = "",
  ip = "",
  userAgent = "",
}) {
  const safeBusinessId = String(businessId || "").trim();

  if (safeBusinessId && userPhoneHash) {
    return `biz:${safeBusinessId}:phone:${userPhoneHash}`;
  }

  if (safeBusinessId && fingerprint) {
    return `biz:${safeBusinessId}:fp:${fingerprint}`;
  }

  const fallback = hashText(`${ip}|${userAgent}`);
  return `biz:${safeBusinessId}:fallback:${fallback}`;
}
