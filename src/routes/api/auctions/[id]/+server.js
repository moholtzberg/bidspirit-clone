import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';

export async function GET({ params }) {
  const auction = await db.auctions.getById(params.id);
  if (!auction) {
    throw error(404, 'Auction not found');
  }
  return json(auction);
}

export async function PATCH({ params, request }) {
  const updates = await request.json();
  const auction = await db.auctions.update(params.id, updates);
  if (!auction) {
    throw error(404, 'Auction not found');
  }
  return json(auction);
}

