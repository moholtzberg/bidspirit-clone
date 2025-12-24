import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import prisma from '$lib/prisma.js';

export async function GET({ params }) {
  const lot = await db.lots.getById(params.id);
  if (!lot) {
    throw error(404, 'Lot not found');
  }
  return json(lot);
}

export async function PATCH({ params, request }) {
  try {
    const updates = await request.json();
    
    // Handle imageUrls - if it's a string, keep it; if array, stringify it
    if (updates.imageUrls && Array.isArray(updates.imageUrls)) {
      updates.imageUrls = JSON.stringify(updates.imageUrls);
    }
    
    // Handle tags - if it's a string, keep it; if array, stringify it
    if (updates.tags !== undefined) {
      if (Array.isArray(updates.tags)) {
        updates.tags = JSON.stringify(updates.tags);
      } else if (updates.tags === '' || updates.tags === null) {
        updates.tags = null;
      }
    }
    
    // Transform status to uppercase
    if (updates.status) {
      updates.status = updates.status.toUpperCase();
    }
    
    // Handle endTime - convert empty string to null
    if (updates.endTime === '' || updates.endTime === null) {
      updates.endTime = null;
    } else if (updates.endTime) {
      // Ensure it's a valid date string
      updates.endTime = new Date(updates.endTime).toISOString();
    }
    
    const lot = await db.lots.update(params.id, updates);
    if (!lot) {
      throw error(404, 'Lot not found');
    }
    return json(lot);
  } catch (err) {
    console.error('Error updating lot:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, 'Failed to update lot');
  }
}

export async function DELETE({ params }) {
  try {
    const lot = await db.lots.getById(params.id);
    if (!lot) {
      throw error(404, 'Lot not found');
    }
    
    await prisma.lot.delete({
      where: { id: params.id }
    });
    
    return json({ message: 'Lot deleted successfully' });
  } catch (err) {
    console.error('Error deleting lot:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, 'Failed to delete lot');
  }
}

