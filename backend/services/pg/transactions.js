import supabase from "../../db/postgres.js";

function mapTransaction(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    businessId: row.business_id,
    type: row.type,
    amount: Number(row.amount ?? 0),
    currency: row.currency || "USD",
    reason: row.reason || "",
    eventType: row.event_type || "",
    reference: row.reference || "",
    status: row.status || "completed",
    balanceBefore: Number(row.balance_before ?? 0),
    balanceAfter: Number(row.balance_after ?? 0),
    notes: row.notes || "",
    meta: row.meta || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTransaction(payload) {
  const insertData = {
    user_id: String(payload.userId || ""),
    business_id: payload.businessId || null,
    type: payload.type,
    amount: Number(payload.amount || 0),
    currency: payload.currency || "USD",
    reason: payload.reason || "",
    event_type: payload.eventType || "",
    reference: payload.reference || "",
    status: payload.status || "completed",
    balance_before: Number(payload.balanceBefore || 0),
    balance_after: Number(payload.balanceAfter || 0),
    notes: payload.notes || "",
    meta: payload.meta || {},
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(insertData)
    .select("*")
    .single();

  if (error) throw error;
  return mapTransaction(data);
}

export async function listBusinessTransactions(businessId, limit = 10) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapTransaction);
}
