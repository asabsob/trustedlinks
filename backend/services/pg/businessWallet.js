import supabase from "../../db/postgres.js";
import { createTransaction } from "./transactions.js";
import { getBusinessById } from "./businesses.js";

function generateReference(prefix = "TXN") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export async function topupBusinessWallet({
  businessId,
  amount,
  note = "",
  meta = {},
}) {
  if (!businessId) throw new Error("businessId required");
  if (!amount || Number(amount) <= 0) throw new Error("invalid amount");

  const business = await getBusinessById(businessId);
  if (!business) throw new Error("Business not found");

  const balanceBefore = Number(business.wallet?.balance || 0);
  const balanceAfter = Number((balanceBefore + Number(amount)).toFixed(2));

  const { error } = await supabase
    .from("businesses")
    .update({
      wallet_balance: balanceAfter,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) throw error;

  const transaction = await createTransaction({
    userId: business.ownerUserId || null,
    businessId: business.id,
    type: "credit",
    amount: Number(amount),
    currency: business.wallet?.currency || "USD",
    reason: "wallet_topup",
    eventType: "topup",
    reference: generateReference("TOP"),
    status: "completed",
    balanceBefore,
    balanceAfter,
    notes: note,
    meta,
  });

  return {
    success: true,
    balanceBefore,
    balanceAfter,
    transaction,
    currency: business.wallet?.currency || "USD",
  };
}

export async function deductBusinessWallet({
  businessId,
  amount,
  eventType,
  note = "",
  meta = {},
}) {
  if (!businessId) throw new Error("businessId required");
  if (!amount || Number(amount) <= 0) throw new Error("invalid amount");

  const business = await getBusinessById(businessId);
  if (!business) throw new Error("Business not found");

  const balanceBefore = Number(business.wallet?.balance || 0);
  const allowNegative = business.wallet?.allowNegative === true;
  const negativeLimit = Number(business.wallet?.negativeLimit ?? -5);
  const balanceAfter = Number((balanceBefore - Number(amount)).toFixed(2));

  if (!allowNegative && balanceBefore < Number(amount)) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  if (allowNegative && balanceAfter < negativeLimit) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  const nextStatus =
    balanceAfter <= 0
      ? "out"
      : balanceAfter < Number(business.wallet?.lowBalanceThreshold ?? 5)
      ? "low"
      : "active";

  const { error } = await supabase
    .from("businesses")
    .update({
      wallet_balance: balanceAfter,
      wallet_status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) throw error;

  const transaction = await createTransaction({
    userId: business.ownerUserId || null,
    businessId: business.id,
    type: "debit",
    amount: Number(amount),
    currency: business.wallet?.currency || "USD",
    reason: "wallet_deduction",
    eventType,
    reference: generateReference("DED"),
    status: "completed",
    balanceBefore,
    balanceAfter,
    notes: note,
    meta,
  });

  return {
    success: true,
    balanceBefore,
    balanceAfter,
    transaction,
    currency: business.wallet?.currency || "USD",
  };
}
