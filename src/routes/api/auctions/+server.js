import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';

export async function GET({ url }) {
  const status = url.searchParams.get('status');
  const sellerId = url.searchParams.get('sellerId');
  const auctionHouseId = url.searchParams.get('auctionHouseId');
  
  const options = {};
  if (auctionHouseId) {
    options.auctionHouseId = auctionHouseId;
  }
  
  let auctions = await db.auctions.getAll(options);
  
  if (status) {
    auctions = auctions.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }
  
  if (sellerId) {
    auctions = auctions.filter(a => a.sellerId === sellerId);
  }
  
  return json(auctions);
}

export async function POST({ request }) {
  const data = await request.json();
  const auction = await db.auctions.create(data);
  return json(auction, { status: 201 });
}

