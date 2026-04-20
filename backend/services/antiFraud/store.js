import supabase from "../../db/postgres.js";

export async function logFraudEvent(payload) {
  const { data, error } = await supabase
    .from("anti_fraud_events")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("logFraudEvent error:", error);
    return null;
  }

  return data;
}

export async function findActiveChargeLock(chargeKey) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("lead_charge_locks")
    .select("*")
    .eq("charge_key", chargeKey)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    console.error("findActiveChargeLock error:", error);
    return null;
  }

  return data;
}

export async function createChargeLock(payload) {
  const { data, error } = await supabase
    .from("lead_charge_locks")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("createChargeLock error:", error);
    return null;
  }

  return data;
}

export async function createPendingCharge(payload) {
  const { data, error } = await supabase
    .from("pending_charges")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("createPendingCharge error:", error);
    return null;
  }

  return data;
}
