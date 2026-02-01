if (payload.id) {
  // update existing
  supabase.from('company_settings').update(payload).eq('id', payload.id).select().single();
} else {
  // insert and return inserted row
  const { data: inserted } = await supabase.from('company_settings').insert(payload).select().single();
  return inserted;
}