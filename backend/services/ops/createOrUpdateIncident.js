import supabase from "../../db/postgres.js";

export async function createOrUpdateIncident({
  incidentKey,
  title,
  type = "system",
  severity = "warning",
  source = "unknown",
  meta = {},
}) {
  try {
    const { data: existing } = await supabase
      .from("system_incidents")
      .select("*")
      .eq("incident_key", incidentKey)
      .eq("status", "open")
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("system_incidents")
        .update({
          occurrences: Number(existing.occurrences || 0) + 1,
          last_detected_at: new Date().toISOString(),
          meta,
        })
        .eq("id", existing.id);

      if (error) {
        throw error;
      }

      return {
        ok: true,
        updated: true,
        incidentId: existing.id,
      };
    }

    const { data, error } = await supabase
      .from("system_incidents")
      .insert({
        incident_key: incidentKey,
        title,
        type,
        severity,
        source,
        meta,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ok: true,
      created: true,
      incidentId: data.id,
    };
  } catch (error) {
    console.error("INCIDENT_ENGINE_ERROR", error);

    return {
      ok: false,
      error: error.message,
    };
  }
}
