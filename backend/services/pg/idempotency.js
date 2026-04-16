import crypto from "crypto";
import supabase from "../../db/postgres.js";

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export function buildRequestHash(payload = {}) {
  return crypto
    .createHash("sha256")
    .update(stableStringify(payload))
    .digest("hex");
}

function mapRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    scope: row.scope,
    requestHash: row.request_hash,
    status: row.status,
    responseCode: row.response_code,
    responseBody: row.response_body,
    lockedAt: row.locked_at ? new Date(row.locked_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  };
}

export async function getIdempotencyRecord(scope, idempotencyKey) {
  const { data, error } = await supabase
    .from("idempotency_keys")
    .select("*")
    .eq("scope", String(scope || "").trim())
    .eq("idempotency_key", String(idempotencyKey || "").trim())
    .maybeSingle();

  if (error) throw error;
  return mapRow(data);
}

export async function createIdempotencyRecord({
  scope,
  idempotencyKey,
  requestHash,
  ttlHours = 24,
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("idempotency_keys")
    .insert({
      scope: String(scope || "").trim(),
      idempotency_key: String(idempotencyKey || "").trim(),
      request_hash: String(requestHash || "").trim(),
      status: "processing",
      locked_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function completeIdempotencyRecord({
  scope,
  idempotencyKey,
  responseCode,
  responseBody,
}) {
  const { data, error } = await supabase
    .from("idempotency_keys")
    .update({
      status: "completed",
      response_code: Number(responseCode || 200),
      response_body: responseBody ?? {},
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("scope", String(scope || "").trim())
    .eq("idempotency_key", String(idempotencyKey || "").trim())
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(data);
}
