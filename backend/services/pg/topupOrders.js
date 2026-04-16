import supabase from "../../db/postgres.js";

function mapTopupOrder(row) {
  if (!row) return null;

  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    amount: Number(row.amount ?? 0),
    currency: row.currency || "USD",
    status: row.status,
    paymentMethod: row.payment_method,
    reference: row.reference,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

export async function createTopupOrder(payload) {
  const insertData = {
    business_id: payload.businessId,
    user_id: payload.userId,
    amount: Number(payload.amount),
    currency: payload.currency || "USD",
    status: "pending",
    payment_method: payload.paymentMethod || "manual_demo",
    reference: payload.reference,
  };

  const { data, error } = await supabase
    .from("topup_orders")
    .insert(insertData)
    .select("*")
    .single();

  if (error) throw error;
  return mapTopupOrder(data);
}

export async function getTopupOrderById(id) {
  const { data, error } = await supabase
    .from("topup_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return mapTopupOrder(data);
}

export async function getPendingTopupOrders(businessId) {
  const { data, error } = await supabase
    .from("topup_orders")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "pending");

  if (error) throw error;
  return (data || []).map(mapTopupOrder);
}

export async function markTopupOrderPaid(id) {
  const { data, error } = await supabase
    .from("topup_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return mapTopupOrder(data);
}
