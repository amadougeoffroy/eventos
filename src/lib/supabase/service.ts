import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses RLS. Server-only (never import from client code).
 * Used by the public API routes so guest-facing data access is scoped in application code
 * instead of relying on permissive RLS policies.
 */
export function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service configuration missing');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
