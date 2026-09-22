import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServiceClient } from './service';

/**
 * Resolves the currently authenticated Supabase user from a Next.js API route request,
 * via an Authorization: Bearer header or the auth cookies. Returns null if not authenticated.
 */
export async function getAuthUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const serviceClient = getServiceClient();
    const { data: { user }, error } = await serviceClient.auth.getUser(token);
    if (!error && user) return user;
  }

  try {
    const cookieStore = await cookies();
    const serverClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can happen in Server Components
          }
        },
      },
    });
    const { data: { user } } = await serverClient.auth.getUser();
    return user || null;
  } catch (err) {
    console.error('Error reading auth cookies:', err);
    return null;
  }
}
