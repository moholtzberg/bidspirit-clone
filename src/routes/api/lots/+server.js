import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';

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
  const data = await request.json();
  const lot = await db.lots.create(data);
  return json(lot, { status: 201 });
}

