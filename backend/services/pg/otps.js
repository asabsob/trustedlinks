import supabase from "../../db/postgres.js";

function mapOtp(row) {
  if (!row) return null;

  return {
    id: row.id,
    whatsapp: row.whatsapp,
    code: row.code,
    purpose: row.purpose,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    usedAt: row.used_at ? new Date(row.used_at) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function deleteOtpByWhatsappPurpose(whatsapp, purpose) {
  const { error } = await supabase
    .from("otps")
    .delete()
    .eq("whatsapp", String(whatsapp || "").trim())
    .eq("purpose", String(purpose || "").trim());

  if (error) throw error;
}

export async function createOtp(payload) {
  const insertData = {
    whatsapp: String(payload.whatsapp || "").trim(),
    code: String(payload.code || "").trim(),
    purpose: payload.purpose || "business_signup",
    expires_at: payload.expiresAt instanceof Date ? payload.expiresAt.toISOString() : payload.expiresAt,
    used_at: null,
  };

  const { data, error } = await supabase.from("otps").insert(insertData).select("*").single();
  if (error) throw error;
  return mapOtp(data);
}

export async function getOtp(whatsapp, purpose) {
  const { data, error } = await supabase
    .from("otps")
    .select("*")
    .eq("whatsapp", String(whatsapp || "").trim())
    .eq("purpose", String(purpose || "").trim())
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return mapOtp(data);
}

export async function consumeOtp(id) {
  const { data, error } = await supabase
    .from("otps")
    .update({
      used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("used_at", null)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return mapOtp(data);
}
