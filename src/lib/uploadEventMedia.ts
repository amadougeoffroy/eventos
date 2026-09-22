/**
 * Uploads a file to the `event-media` Supabase Storage bucket and returns its
 * public URL. Shared by every place that lets an organizer attach hero
 * images/video or background music to an event, so a real file always ends
 * up as a small hosted URL — never as a multi-MB base64 string stored
 * directly in the `events` row.
 */
export async function uploadEventMedia(file: File, path: string): Promise<string> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  const ext = file.name.split('.').pop() || 'bin';
  const filePath = `${path}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('event-media')
    .upload(filePath, file, { cacheControl: '31536000', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('event-media').getPublicUrl(filePath);
  return data.publicUrl;
}
