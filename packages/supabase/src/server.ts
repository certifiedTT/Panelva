import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

/**
 * Creates a privileged server-side Supabase client using the SERVICE_ROLE_KEY.
 * Used exclusively inside server routes, background jobs, and Next.js Server Components.
 * NEVER expose this client to frontend browsers or mobile apps.
 */
export function createServerClient(): SupabaseClient<Database> {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://rlzhlsrhtiffuigedkum.supabase.co';

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummyKey';

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
