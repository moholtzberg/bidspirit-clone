import { redirect } from '@sveltejs/kit';

/**
 * Server-side authentication check for all seller portal routes
 * This ensures users cannot access seller routes after session expiration
 */
export async function load({ locals, url }) {
  const session = await locals.auth?.();
  
  // If no session, redirect to login
  if (!session?.user) {
    throw redirect(302, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
  }
  
  // Return session data for use in child routes
  return {
    session: session ? {
      user: session.user
    } : null
  };
}

