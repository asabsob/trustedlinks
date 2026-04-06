import supabase from "../../db/postgres.js";

function mapBusinessEvent(row) {
  if (!row) return null;

  return {
    id: row.id,
    businessId: row.business_id,
    ownerUserId: row.owner_user_id,
    type: row.type,
    source: row.source || "",
    meta: row.meta || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createBusinessEvent(payload) {
  const insertData = {
    business_id: payload.businessId,
    owner_user_id: String(payload.ownerUserId || ""),
    type: payload.type,
    source: payload.source || "",
    meta: payload.meta || {},
  };

  const { data, error } = await supabase
    .from("business_events")
    .insert(insertData)
    .select("*")
    .single();

  if (error) throw error;
  return mapBusinessEvent(data);
}
