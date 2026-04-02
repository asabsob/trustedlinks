import supabase from "../../db/postgres.js";

function mapBusiness(row) {
  if (!row) return null;

  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    name_ar: row.name_ar,
    description: row.description,
    description_ar: row.description_ar,
    category: row.category || [],
    keywords: row.keywords || [],
    keywords_ar: row.keywords_ar || [],
    whatsapp: row.whatsapp,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    mapLink: row.map_link,
    mediaLink: row.media_link,
    logo: row.logo,
    locationText: row.location_text,
    countryCode: row.country_code,
    countryName: row.country_name,
    customId: row.custom_id,
    wallet: {
      balance: Number(row.wallet_balance ?? 0),
      currency: row.wallet_currency || "USD",
      status: row.wallet_status || "active",
      allowNegative: Boolean(row.wallet_allow_negative),
      negativeLimit: Number(row.wallet_negative_limit ?? -5),
      lowBalanceThreshold: Number(row.wallet_low_balance_threshold ?? 5),
    },
    billing: {
      clickCost: Number(row.billing_click_cost ?? 0.05),
      whatsappCost: Number(row.billing_whatsapp_cost ?? 0.1),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getBusinessByWhatsapp(whatsapp) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("whatsapp", String(whatsapp || "").trim())
    .maybeSingle();

  if (error) throw error;
  return mapBusiness(data);
}

export async function createBusiness(payload) {
  const insertData = {
    owner_user_id: payload.ownerUserId ?? null,
    name: payload.name || "",
    name_ar: payload.name_ar || "",
    description: payload.description || "",
    description_ar: payload.description_ar || "",
    category: Array.isArray(payload.category) ? payload.category : [],
    keywords: Array.isArray(payload.keywords) ? payload.keywords : [],
    keywords_ar: Array.isArray(payload.keywords_ar) ? payload.keywords_ar : [],
    whatsapp: String(payload.whatsapp || "").trim(),
    status: payload.status || "Active",
    latitude: typeof payload.latitude === "number" ? payload.latitude : null,
    longitude: typeof payload.longitude === "number" ? payload.longitude : null,
    map_link: payload.mapLink || "",
    media_link: payload.mediaLink || "",
    logo: payload.logo || "",
    location_text: payload.locationText || "",
    country_code: payload.countryCode || "",
    country_name: payload.countryName || "",
    custom_id: payload.customId || "",
  };

  const { data, error } = await supabase.from("businesses").insert(insertData).select("*").single();
  if (error) throw error;
  return mapBusiness(data);
}
export async function getBusinessByOwnerUserId(ownerUserId) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (error) throw error;
  return mapBusiness(data);
}
