import { createClient } from '@supabase/supabase-js';

/**
 * Creates a service-role client. This module must only be imported by server
 * actions or server components; never expose the service key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase service-role configuration is missing. Add SUPABASE_SERVICE_ROLE_KEY to .env and restart the Next.js server.'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
