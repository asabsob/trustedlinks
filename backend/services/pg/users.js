import supabase from "../../db/postgres.js";

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerified: row.email_verified,
    verifyToken: row.verify_token,
    subscriptionPlan: row.subscription_plan,
    planActivatedAt: row.plan_activated_at,
    walletBalance: Number(row.wallet_balance ?? 0),
    currency: row.currency || "USD",
    freeCreditGranted: Boolean(row.free_credit_granted),
    resetToken: row.reset_token,
    resetTokenExpiresAt: row.reset_token_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserById(id) {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return mapUser(data);
}

export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", String(email || "").trim().toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return mapUser(data);
}

export async function createUser(payload) {
  const insertData = {
    email: String(payload.email || "").trim().toLowerCase(),
    password_hash: payload.passwordHash,
    email_verified: Boolean(payload.emailVerified ?? false),
    verify_token: payload.verifyToken ?? null,
    subscription_plan: payload.subscriptionPlan ?? null,
    plan_activated_at: payload.planActivatedAt ?? null,
    wallet_balance: Number(payload.walletBalance ?? 5),
    currency: payload.currency || "USD",
    free_credit_granted: Boolean(payload.freeCreditGranted ?? true),
    reset_token: payload.resetToken ?? null,
    reset_token_expires_at: payload.resetTokenExpiresAt ?? null,
  };

  const { data, error } = await supabase.from("users").insert(insertData).select("*").single();
  if (error) throw error;
  return mapUser(data);
}

export async function verifyUserEmail(email, token) {
  const emailNorm = String(email || "").trim().toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .update({
      email_verified: true,
      verify_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq("email", emailNorm)
    .eq("verify_token", String(token || ""))
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return mapUser(data);
}

export async function setVerifyToken(userId, verifyToken) {
  const { data, error } = await supabase
    .from("users")
    .update({
      verify_token: verifyToken,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapUser(data);
}

export async function setResetToken(userId, resetToken, resetTokenExpiresAt) {
  const { data, error } = await supabase
    .from("users")
    .update({
      reset_token: resetToken,
      reset_token_expires_at: resetTokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapUser(data);
}

export async function updateUserPassword(userId, passwordHash) {
  const { data, error } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapUser(data);
}

export async function updateUserWalletBalance(userId, walletBalance) {
  const { data, error } = await supabase
    .from("users")
    .update({
      wallet_balance: Number(walletBalance),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapUser(data);
}

export async function updateUserSubscription(
  userId,
  subscriptionPlan,
  planActivatedAt = new Date().toISOString()
) {
  const { data, error } = await supabase
    .from("users")
    .update({
      subscription_plan: subscriptionPlan,
      plan_activated_at: planActivatedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return mapUser(data);
}
