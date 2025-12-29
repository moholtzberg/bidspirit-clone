import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';

export async function GET({ url }) {
  const lotId = url.searchParams.get('lotId');
  const userId = url.searchParams.get('userId');
  
  if (lotId) {
    const bids = await db.bids.getByLotId(lotId);
    return json(bids);
  }
  
  if (userId) {
    const bids = await db.bids.getByUserId(userId);
    return json(bids);
  }
  
  return json([]);
}

export async function POST({ request, locals }) {
  // Check authentication
  const session = await locals.auth?.();
  if (!session?.user) {
    throw error(401, 'You must be logged in to place a bid');
  }
  
  // Get or create user in database
  let user = await db.users.getByEmail(session.user.email);
  if (!user) {
    // Create user if they don't exist
    user = await db.users.create({
      email: session.user.email,
      name: session.user.name || `${session.user.first_name || ''} ${session.user.last_name || ''}`.trim() || session.user.email,
      firstName: session.user.first_name || null,
      lastName: session.user.last_name || null,
      role: 'BUYER'
    });
  }
  
  const data = await request.json();
  const { lotId, amount } = data;
  
  // Validate required fields
  if (!lotId || !amount) {
    throw error(400, 'Lot ID and bid amount are required');
  }
  
  // Get the lot to validate bid
  const lot = await db.lots.getById(lotId);
  if (!lot) {
    throw error(404, 'Lot not found');
  }
  
  // Validate bid amount
  if (amount < lot.currentBid + lot.bidIncrement) {
    throw error(400, `Bid must be at least $${lot.currentBid + lot.bidIncrement}`);
  }
  
  // Use authenticated user's ID and name
  const userId = user.id;
  const userName = user.name || user.email;
  
  // Create the bid
  const bid = await db.bids.create({ lotId, userId, userName, amount });
  
  // Update lot with new current bid
  await db.lots.update(lotId, {
    currentBid: amount,
    highestBidderId: userId,
    highestBidderName: userName
  });
  
  return json(bid, { status: 201 });
}

