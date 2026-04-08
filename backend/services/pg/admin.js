export async function listAllUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return data || [];
}

export async function listAllBusinesses() {
  const { data, error } = await supabase.from("businesses").select("*");
  if (error) throw error;
  return data || [];
}

export async function updateBusinessStatus(id, status) {
  const { data, error } = await supabase
    .from("businesses")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
