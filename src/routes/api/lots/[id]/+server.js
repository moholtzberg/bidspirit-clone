import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';

export async function GET({ params }) {
  const lot = await db.lots.getById(params.id);
  if (!lot) {
    throw error(404, 'Lot not found');
  }
  return json(lot);
}

export async function PATCH({ params, request }) {
  const updates = await request.json();
  const lot = await db.lots.update(params.id, updates);
  if (!lot) {
    throw error(404, 'Lot not found');
  }
  return json(lot);
}

