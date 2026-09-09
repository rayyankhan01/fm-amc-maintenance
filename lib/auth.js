import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

/**
 * @typedef {'admin' | 'manager' | 'engineer' | 'technician'} EmpRole
 */

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string} name
 * @property {string} emp_id
 * @property {EmpRole} emp_role
 */

/**
 * Returns the logged-in user's profile, or null if there is no session.
 * @returns {Promise<Profile | null>}
 */
export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, emp_id, emp_role')
    .eq('id', user.id)
    .single();

  return profile ?? null;
}

/**
 * Server Component / layout guard. Redirects to /login if there's no
 * session, or /unauthorized if the profile's emp_role isn't allowed.
 * Returns the profile on success so callers can use it (e.g. technician_id).
 * @param {EmpRole[]} allowedRoles
 * @returns {Promise<Profile>}
 */
export async function requireRole(allowedRoles) {
  const profile = await getCurrentProfile();

  if (!profile) redirect('/login');
  if (!allowedRoles.includes(profile.emp_role)) redirect('/unauthorized');

  return profile;
}
