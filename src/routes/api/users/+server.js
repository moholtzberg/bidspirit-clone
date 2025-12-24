import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { User } from '$lib/models/index.js';

export async function GET({ url, locals }) {
  const email = url.searchParams.get('email');
  const auctionHouseId = url.searchParams.get('auctionHouseId');
  
  if (email) {
    const user = await db.users.getByEmail(email);
    if (!user) {
      throw error(404, 'User not found');
    }
    return json(user);
  }
  
  if (auctionHouseId) {
    const users = await db.users.getByAuctionHouse(auctionHouseId);
    return json(users);
  }
  
  // Get current user if logged in
  const session = await locals.auth?.();
  if (session?.user) {
    const user = await db.users.getByEmail(session.user.email);
    if (user) {
      return json(user);
    }
  }
  
  throw error(400, 'Please provide email or auctionHouseId parameter, or be logged in');
}

export async function POST({ request }) {
  try {
    const data = await request.json();
    const user = await User.create(data);
    return json(user, { status: 201 });
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, err.message || 'Failed to create user');
  }
}


