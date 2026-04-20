import supabase from "../../db/postgres.js";

export async function analyzeLeadSignals({
  businessId = "",
  tokenId = "",
  ip = "",
  fingerprint = "",
  userPhoneHash = "",
  userAgent = "",
}) {
  const signals = [];
  const now = new Date();
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  if (!userAgent || userAgent.length < 12) {
    signals.push({ code: "BOT_UA", weight: 20 });
  }

  if (tokenId) {
    const { count } = await supabase
      .from("anti_fraud_events")
      .select("*", { count: "exact", head: true })
      .eq("token_id", tokenId)
      .eq("event_type", "lead_click");

    if ((count || 0) > 0) {
      signals.push({ code: "TOKEN_REUSE", weight: 40 });
    }
  }

  if (ip) {
    const { count } = await supabase
      .from("anti_fraud_events")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", lastHour);

    if ((count || 0) >= 10) {
      signals.push({ code: "HIGH_VELOCITY_IP", weight: 25 });
    }
  }

  if (fingerprint) {
    const { data } = await supabase
      .from("anti_fraud_events")
      .select("user_phone_hash")
      .eq("fingerprint", fingerprint)
      .gte("created_at", lastDay);

    const uniquePhones = new Set(
      (data || []).map((x) => x.user_phone_hash).filter(Boolean)
    );

    if (uniquePhones.size >= 3) {
      signals.push({ code: "MULTI_PHONE_SAME_FINGERPRINT", weight: 35 });
    }
  }

  if (businessId && ip) {
    const { count } = await supabase
      .from("anti_fraud_events")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("ip_address", ip)
      .gte("created_at", lastHour);

    if ((count || 0) >= 5) {
      signals.push({ code: "TARGETED_BUSINESS_ATTACK", weight: 30 });
    }
  }

  if (userPhoneHash && businessId) {
    const { count } = await supabase
      .from("anti_fraud_events")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("user_phone_hash", userPhoneHash)
      .gte("created_at", lastDay);

    if ((count || 0) >= 2) {
      signals.push({ code: "REPEAT_USER_TO_SAME_BUSINESS", weight: 20 });
    }
  }

  return signals;
}
