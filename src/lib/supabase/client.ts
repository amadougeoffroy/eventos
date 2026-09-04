import { createBrowserClient } from '@supabase/ssr';

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  if (typeof window !== 'undefined' && clientInstance) {
    return clientInstance;
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  if (typeof window !== 'undefined') {
    clientInstance = client;
  }
  return client;
}
