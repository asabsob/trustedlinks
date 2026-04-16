import supabase from "../../db/postgres.js";
import { logEvent } from "./auditLogs.js";

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

  if (error) {
    await logEvent({
      event: "transaction_create_failed",
      level: "error",
      meta: {
        userId: insertData.user_id,
        businessId: insertData.business_id,
        type: insertData.type,
        amount: insertData.amount,
        currency: insertData.currency,
        reason: insertData.reason,
        reference: insertData.reference,
        error: error.message,
      },
    });

    throw error;
  }

  const tx = mapTransaction(data);

  await logEvent({
    event: "transaction_created",
    level: "info",
    meta: {
      transactionId: tx.id,
      userId: tx.userId,
      businessId: tx.businessId,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      reason: tx.reason,
      eventType: tx.eventType,
      reference: tx.reference,
      status: tx.status,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
    },
  });

  return tx;
}

export async function listBusinessTransactions(businessId, limit = 10) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    await logEvent({
      event: "transaction_list_failed",
      level: "error",
      meta: {
        businessId,
        limit,
        error: error.message,
      },
    });

    throw error;
  }

  return (data || []).map(mapTransaction);
}
