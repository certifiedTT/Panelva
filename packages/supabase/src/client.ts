import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

let cachedClient: SupabaseClient<Database> | null = null;

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

/**
 * Creates or retrieves the singleton Supabase client.
 * Compatible with Next.js (browser/SSR) and React Native (Expo).
 */
export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient<Database> {
  if (cachedClient) {
    return cachedClient;
  }

  // Attempt to read from config or environment variables
  const url =
    config?.supabaseUrl ||
    (typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL
      : '') ||
    'https://rlzhlsrhtiffuigedkum.supabase.co';

  const anonKey =
    config?.supabaseAnonKey ||
    (typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY
      : '') ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummyKey';

  cachedClient = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: typeof window !== 'undefined',
    },
  });

  return cachedClient;
}

/**
 * Default global supabase client instance
 */
export const supabase = getSupabaseClient();
