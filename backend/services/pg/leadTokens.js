import supabase from "../../db/postgres.js";

function mapLeadToken(row) {
  if (!row) return null;

  return {
    id: row.id,
    businessId: row.business_id,
    businessPhone: row.business_phone,
    userPhone: row.user_phone,
    query: row.query || "",
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export async function createLeadToken(payload) {
  const insertData = {
    business_id: String(payload.businessId || "").trim(),
    business_phone: String(payload.businessPhone || "").trim(),
    user_phone: String(payload.userPhone || "").trim(),
    query: String(payload.query || "").trim(),
  };

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
