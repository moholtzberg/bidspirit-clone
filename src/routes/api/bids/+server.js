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

export async function POST({ request }) {
  const data = await request.json();
  const { lotId, userId, userName, amount } = data;
  
  // Get the lot to validate bid
  const lot = await db.lots.getById(lotId);
  if (!lot) {
    throw error(404, 'Lot not found');
  }
  
  // Validate bid amount
  if (amount < lot.currentBid + lot.bidIncrement) {
    throw error(400, `Bid must be at least $${lot.currentBid + lot.bidIncrement}`);
  }
  
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

