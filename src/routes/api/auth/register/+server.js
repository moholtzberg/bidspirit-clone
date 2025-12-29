import { json, error } from '@sveltejs/kit';

// This endpoint is no longer needed - registration is handled directly by /api/users/register
// Keeping for backwards compatibility but it just returns success
export async function POST({ request }) {
  return json({
    message: 'Registration should be handled by /api/users/register',
    requiresExternalRegistration: false
  });
}

