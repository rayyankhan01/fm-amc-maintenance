import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use in Client Components. Stores the session in
 * cookies (not localStorage) so lib/supabase/server.js can read the same
 * session on the server.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
