import supabase from "../../db/postgres.js";
import { createTransaction } from "./transactions.js";
import { getBusinessById } from "./businesses.js";

function generateReference(prefix = "TXN") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getWalletCurrency(business) {
  return (
    business?.wallet?.currency ||
    business?.walletCurrency ||
    business?.wallet_currency ||
    "JOD"
  );
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

  const currency = getWalletCurrency(business);

  const balanceBefore = Number(business.wallet?.balance || 0);
  const balanceAfter = Number((balanceBefore + Number(amount)).toFixed(2));

  const { error } = await supabase
    .from("businesses")
    .update({
      wallet_balance: balanceAfter,
      wallet_currency: currency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) throw error;

  const transaction = await createTransaction({
    userId: business.ownerUserId || null,
    businessId: business.id,
    type: "credit",
    amount: Number(amount),
    currency,
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
    currency,
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

  const currency = getWalletCurrency(business);
  const chargeAmount = Number(Number(amount).toFixed(2));

  const walletBefore = Number(business.wallet?.balance || 0);

  const sponsoredBefore = Number(
    business.sponsoredBalance ??
      business.sponsored_balance ??
      0
  );

  const totalBefore = Number((walletBefore + sponsoredBefore).toFixed(2));

  const allowNegative = business.wallet?.allowNegative === true;
  const negativeLimit = Number(business.wallet?.negativeLimit ?? -5);

  let remainingCharge = chargeAmount;
  let sponsoredAfter = sponsoredBefore;
  let walletAfter = walletBefore;

  const sponsoredDeducted = Math.min(sponsoredAfter, remainingCharge);

  sponsoredAfter = Number((sponsoredAfter - sponsoredDeducted).toFixed(2));
  remainingCharge = Number((remainingCharge - sponsoredDeducted).toFixed(2));

  let walletDeducted = 0;

  if (remainingCharge > 0) {
    walletDeducted = remainingCharge;
    walletAfter = Number((walletAfter - walletDeducted).toFixed(2));
  }

  if (!allowNegative && walletAfter < 0) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  if (allowNegative && walletAfter < negativeLimit) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  const totalAfter = Number((walletAfter + sponsoredAfter).toFixed(2));

  const nextStatus =
    totalAfter <= 0
      ? "out"
      : totalAfter < Number(business.wallet?.lowBalanceThreshold ?? 5)
      ? "low"
      : "active";

  const { error } = await supabase
    .from("businesses")
    .update({
      sponsored_balance: sponsoredAfter,
      wallet_balance: walletAfter,
      wallet_currency: currency,
      wallet_status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId);

  if (error) throw error;

  const transaction = await createTransaction({
    userId: business.ownerUserId || null,
    businessId: business.id,
    type: "debit",
    amount: chargeAmount,
    currency,
    reason:
      sponsoredDeducted > 0 && walletDeducted > 0
        ? "mixed_wallet_deduction"
        : sponsoredDeducted > 0
        ? "sponsored_wallet_deduction"
        : "wallet_deduction",
    eventType,
    reference: generateReference("DED"),
    status: "completed",
    balanceBefore: totalBefore,
    balanceAfter: totalAfter,
    notes: note,
    meta: {
      ...meta,
      sponsoredDeducted,
      walletDeducted,
      sponsoredBefore,
      sponsoredAfter,
      walletBefore,
      walletAfter,
      currency,
    },
  });

  return {
    success: true,
    balanceBefore: totalBefore,
    balanceAfter: totalAfter,
    sponsoredBefore,
    sponsoredAfter,
    walletBefore,
    walletAfter,
    sponsoredDeducted,
    walletDeducted,
    transaction,
    currency,
  };
}
