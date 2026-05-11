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

    // ✅ wallet
    wallet: {
      balance: Number(row.wallet_balance ?? 0),
      currency: row.wallet_currency || "USD",
      status: row.wallet_status || "active",
      allowNegative: Boolean(row.wallet_allow_negative),
      negativeLimit: Number(row.wallet_negative_limit ?? -5),
      lowBalanceThreshold: Number(row.wallet_low_balance_threshold ?? 5),
    },

        // ✅ sponsorship
    sponsoredBalance: Number(
      row.sponsored_balance ?? 0
    ),

    sponsoredCampaignName:
      row.sponsored_campaign_name || null,

    sponsoredStatus:
      row.sponsored_status || "none",

    sponsoredCreditExpiresAt:
      row.sponsored_credit_expires_at || null,

    sponsoredDailyLimit: Number(
      row.sponsored_daily_limit ?? 0
    ),

    // ✅ billing
    billing: {
      clickCost: Number(row.billing_click_cost ?? 0.05),
      whatsappCost: Number(row.billing_whatsapp_cost ?? 0.1),
    },

    // ✅ NEW: counters (ضعها هنا داخل return)
    viewsCount: Number(row.views_count ?? 0),
    clicksCount: Number(row.clicks_count ?? 0),
    mediaViewsCount: Number(row.media_views_count ?? 0),
    mapClicksCount: Number(row.map_clicks_count ?? 0),
    whatsappClicksCount: Number(row.whatsapp_clicks_count ?? 0),
    messagesCount: Number(row.messages_count ?? 0),

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
   const customId = String(payload.customId || "").trim() || null;
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

   custom_id: customId,
   
  wallet_balance: Number(payload.walletBalance ?? 5),
  wallet_currency: payload.walletCurrency || "USD",
  wallet_status: payload.walletStatus || "active",
  wallet_allow_negative: Boolean(payload.walletAllowNegative ?? false),
  wallet_negative_limit: Number(payload.walletNegativeLimit ?? -5),
  wallet_low_balance_threshold: Number(payload.walletLowBalanceThreshold ?? 5),

  billing_click_cost: Number(payload.billingClickCost ?? 0.05),
  billing_whatsapp_cost: Number(payload.billingWhatsappCost ?? 0.10),
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

 export async function updateBusinessByOwnerUserId(ownerUserId, payload) {
  const updateData = {};

  if (typeof payload.name === "string") {
    updateData.name = payload.name.trim();
  }

  if (typeof payload.name_ar === "string") {
    updateData.name_ar = payload.name_ar.trim();
  }

  if (typeof payload.description === "string") {
    updateData.description = payload.description.trim();
  }

  if (typeof payload.description_ar === "string") {
    updateData.description_ar = payload.description_ar.trim();
  }

  if (Array.isArray(payload.category)) {
    updateData.category = payload.category.map((x) => String(x).trim()).filter(Boolean);
  }

  if (Array.isArray(payload.keywords)) {
    updateData.keywords = payload.keywords.map((x) => String(x).trim()).filter(Boolean);
  }

  if (Array.isArray(payload.keywords_ar)) {
    updateData.keywords_ar = payload.keywords_ar.map((x) => String(x).trim()).filter(Boolean);
  }

  if (typeof payload.mediaLink === "string") {
    updateData.media_link = payload.mediaLink.trim();
  }

  if (typeof payload.mapLink === "string") {
    updateData.map_link = payload.mapLink.trim();
  }

  if (payload.logo !== undefined) {
    updateData.logo = payload.logo;
  }

  if (typeof payload.locationText === "string") {
    updateData.location_text = payload.locationText.trim();
  }

  if (typeof payload.whatsapp === "string") {
    updateData.whatsapp = payload.whatsapp.trim();
  }

  if (typeof payload.countryCode === "string") {
    updateData.country_code = payload.countryCode.trim();
  }

  if (typeof payload.countryName === "string") {
    updateData.country_name = payload.countryName.trim();
  }

  if (payload.latitude !== undefined) {
    updateData.latitude =
      payload.latitude === null || payload.latitude === ""
        ? null
        : Number(payload.latitude);
  }

  if (payload.longitude !== undefined) {
    updateData.longitude =
      payload.longitude === null || payload.longitude === ""
        ? null
        : Number(payload.longitude);
  }

  if (payload.instagram !== undefined) {
    const cleanInstagram = String(payload.instagram || "").trim().replace(/^@+/, "");
    updateData.media_link = cleanInstagram
      ? `https://instagram.com/${cleanInstagram}`
      : "";
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("businesses")
    .update(updateData)
    .eq("owner_user_id", ownerUserId)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return mapBusiness(data);
}

export async function listAllBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapBusiness);
}
export async function getBusinessByCustomId(customId) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("custom_id", String(customId || "").trim())
    .maybeSingle();

  if (error) throw error;
  return mapBusiness(data);
}
export async function listActiveBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("status", "Active")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(mapBusiness);
}
export async function getBusinessById(id) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return mapBusiness(data);
}

export async function incrementBusinessEventField(businessId, fieldName) {
  const fieldMap = {
    views: "views",
    clicks: "clicks",
    media: "media",
    whatsapp: "whatsapp",
    whatsapp_clicks: "whatsapp",
    messages: "messages",
  };

  const eventTypeMap = {
    views: "view",
    clicks: "click",
    media: "media",
    whatsapp: "whatsapp",
    messages: "message",
  };

  const safeField = fieldMap[fieldName];

  if (!safeField) {
    throw new Error(`Invalid field name: ${fieldName}`);
  }

  const eventType = eventTypeMap[safeField] || safeField;

  const business = await getBusinessById(businessId);
  if (!business) {
    throw new Error("Business not found");
  }

  const eventDate = new Date().toISOString().slice(0, 10);

  const { data: existingRow, error: fetchError } = await supabase
    .from("business_events")
    .select("*")
    .eq("business_id", businessId)
    .eq("event_date", eventDate)
    .eq("type", eventType)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (!existingRow) {
    const newRow = {
      business_id: businessId,
      owner_user_id: business.ownerUserId,
      type: eventType,
      event_date: eventDate,
      views: 0,
      clicks: 0,
      whatsapp: 0,
      media: 0,
      messages: 0,
      total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      [safeField]: 1,
    };

    newRow.total =
      Number(newRow.views || 0) +
      Number(newRow.clicks || 0) +
      Number(newRow.whatsapp || 0) +
      Number(newRow.media || 0);

    const { data: insertedRow, error: insertError } = await supabase
      .from("business_events")
      .insert([newRow])
      .select()
      .single();

    if (insertError) throw insertError;
    return insertedRow;
  }

  const updatePayload = {
    [safeField]: Number(existingRow[safeField] || 0) + 1,
    updated_at: new Date().toISOString(),
  };

  const nextViews =
    safeField === "views"
      ? updatePayload.views
      : Number(existingRow.views || 0);

  const nextClicks =
    safeField === "clicks"
      ? updatePayload.clicks
      : Number(existingRow.clicks || 0);

  const nextWhatsapp =
    safeField === "whatsapp"
      ? updatePayload.whatsapp
      : Number(existingRow.whatsapp || 0);

  const nextMedia =
    safeField === "media"
      ? updatePayload.media
      : Number(existingRow.media || 0);

  updatePayload.total = nextViews + nextClicks + nextWhatsapp + nextMedia;

  const { data: updatedRow, error: updateError } = await supabase
    .from("business_events")
    .update(updatePayload)
    .eq("id", existingRow.id)
    .select()
    .single();

  if (updateError) throw updateError;
  return updatedRow;
}
