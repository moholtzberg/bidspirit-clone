import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

export async function POST({ request, locals }) {
  try {
    const session = await locals.auth?.();
    if (!session?.user) {
      throw error(401, 'Unauthorized');
    }

    const { auctionId, lotIds } = await request.json();

    if (!auctionId || !Array.isArray(lotIds)) {
      throw error(400, 'Invalid request: auctionId and lotIds array are required');
    }

    // Verify user has access to this auction
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      throw error(401, 'User not found');
    }

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) {
      throw error(404, 'Auction not found');
    }

    // Check if user has access (seller or same auction house)
    if (user.id !== auction.sellerId && user.auctionHouseId !== auction.auctionHouseId) {
      throw error(403, 'Forbidden');
    }

    // Update positions for all lots
    const updates = lotIds.map((lotId, index) => {
      return prisma.lot.update({
        where: { id: lotId },
        data: { position: index + 1 }
      });
    });

    await Promise.all(updates);

    return json({ success: true, message: 'Lots reordered successfully' });
  } catch (err) {
    console.error('Error reordering lots:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, 'Failed to reorder lots');
  }
}

