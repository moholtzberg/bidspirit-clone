import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { Lot } from '$lib/models/index.js';

export async function GET({ url }) {
  const auctionId = url.searchParams.get('auctionId');
  
  if (auctionId) {
    const lots = await db.lots.getByAuctionId(auctionId);
    
    // Load bids for each lot
    const lotsWithBids = await Promise.all(
      lots.map(async (lot) => {
        const bids = await db.bids.getByLotId(lot.id);
        return { ...lot, bids };
      })
    );
    
    return json(lotsWithBids);
  }
  
  return json([]);
}

export async function POST({ request }) {
  try {
    const data = await request.json();
    
    // Transform data to match Lot model expectations
    const lotData = {
      ...data,
      // Convert status to uppercase if it's lowercase
      status: data.status ? data.status.toUpperCase() : 'ACTIVE',
      // Keep endTime as string - let the schema handle conversion
      // (empty strings will be converted to null by the schema)
      endTime: data.endTime && data.endTime.trim() !== '' ? data.endTime : null,
      // Ensure imageUrl is null if empty string
      imageUrl: data.imageUrl && data.imageUrl.trim() !== '' ? data.imageUrl : null,
      // Ensure currentBid is set if not provided
      currentBid: data.currentBid !== undefined ? data.currentBid : (data.startingBid || 0)
    };
    
    // Use Lot model for validation and creation
    const lot = await Lot.create(lotData);
    return json(lot, { status: 201 });
  } catch (error) {
    console.error('Error creating lot:', error);
    return json(
      { 
        error: error.message || 'Failed to create lot',
        details: error.fieldErrors || error.errors || null
      }, 
      { status: 400 }
    );
  }
}

