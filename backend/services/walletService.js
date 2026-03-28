import Business from "../models/Business.js";
import Transaction from "../models/Transaction.js";

// =========================
// Helpers
// =========================
function generateReference(prefix = "TXN") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// =========================
// Deduct Wallet
// =========================
export async function deductWallet({
  businessId,
  amount,
  eventType,
  note = "",
  meta = {},
}) {
  if (!businessId) throw new Error("businessId required");
  if (!amount || amount <= 0) throw new Error("invalid amount");

  const business = await Business.findById(businessId);
  if (!business) throw new Error("Business not found");

  if (!business.wallet) {
    business.wallet = {
      balance: 0,
      currency: "USD",
      status: "active",
      allowNegative: true,
      negativeLimit: -5,
      lowBalanceThreshold: 5,
    };
  }

  if (business.wallet.status !== "active") {
    throw new Error("Wallet not active");
  }

  const balanceBefore = Number(business.wallet.balance || 0);
  const allowNegative = business.wallet.allowNegative === true;
  const negativeLimit = Number(business.wallet.negativeLimit ?? -5);
  const balanceAfter = Number((balanceBefore - amount).toFixed(2));

  if (!allowNegative && balanceBefore < amount) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  if (allowNegative && balanceAfter < negativeLimit) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  business.wallet.balance = balanceAfter;
  await business.save();

  const transaction = await Transaction.create({
    userId: business.ownerUserId || null,
    businessId: business._id,
    type: "debit",
    amount,
    currency: business.wallet.currency || "USD",
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
  };
}

// =========================
// Topup Wallet
// =========================
export async function topupWallet({
  businessId,
  amount,
  note = "",
  meta = {},
}) {
  if (!businessId) throw new Error("businessId required");
  if (!amount || amount <= 0) throw new Error("invalid amount");

  const business = await Business.findById(businessId);
  if (!business) throw new Error("Business not found");

  const balanceBefore = business.wallet.balance || 0;
  const balanceAfter = balanceBefore + amount;

  business.wallet.balance = balanceAfter;
  await business.save();

  const transaction = await Transaction.create({
    userId: business.ownerUserId || null,
    businessId: business._id,
    type: "credit",
    amount,
    currency: business.wallet.currency,
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
  };
}
