import supabase from "../../db/postgres.js";

function mapLeadToken(row) {
  if (!row) return null;

  return {
    id: row.id,
    businessId: row.business_id,
    businessPhone: row.business_phone,
    userPhone: row.user_phone,
    query: row.query || "",
    intentType: row.intent_type || "category",
    intent_type: row.intent_type || "category",
    consent_snapshot_id: row.consent_snapshot_id || null,
    consentSnapshotId: row.consent_snapshot_id || null,
    opened_at: row.opened_at || null,
    openedAt: row.opened_at || null,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    expires_at: row.expires_at,
  };
}

export async function createLeadToken(payload) {
  const finalIntentType = payload.intentType || "category";

  const insertData = {
    business_id: String(payload.businessId || "").trim(),
    business_phone: String(payload.businessPhone || "").trim(),
    user_phone: String(payload.userPhone || "").trim(),
    query: String(payload.query || "").trim(),
    intent_type: finalIntentType,
  };

  console.log("CREATE_TOKEN_DEBUG", {
    query: insertData.query,
    intentTypeReceived: payload.intentType,
    intentTypeStored: finalIntentType,
  });

  const { data, error } = await supabase
    .from("lead_tokens")
    .insert(insertData)
    .select("*")
    .single();

  if (error) throw error;
  return mapLeadToken(data);
}

export async function getLeadTokenById(id) {
  const { data, error } = await supabase
    .from("lead_tokens")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return mapLeadToken(data);
}
