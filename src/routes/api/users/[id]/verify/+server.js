import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import prisma from '$lib/prisma.js';

export async function PATCH({ params, request, locals }) {
  try {
    // Check authentication
    const session = await locals.auth?.();
    if (!session?.user) {
      throw error(401, 'Unauthorized');
    }
    
    // Check if user is admin or auction house owner
    // For now, we'll allow any authenticated user to verify (you can add admin check later)
    const currentUser = await db.users.getByEmail(session.user.email);
    if (!currentUser) {
      throw error(403, 'Forbidden');
    }
    
    // Only allow SELLER or AUCTIONEER roles to verify users
    // (You can add ADMIN role check here if needed)
    if (currentUser.role !== 'SELLER' && currentUser.role !== 'AUCTIONEER') {
      throw error(403, 'Only sellers and auctioneers can verify users');
    }
    
    const data = await request.json();
    const { isVerifiedBuyer, isVerifiedBidder } = data;
    
    // Get the user to verify
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    });
    
    if (!user) {
      throw error(404, 'User not found');
    }
    
    // Update verification status
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        isVerifiedBuyer: isVerifiedBuyer !== undefined ? isVerifiedBuyer : user.isVerifiedBuyer,
        isVerifiedBidder: isVerifiedBidder !== undefined ? isVerifiedBidder : user.isVerifiedBidder
      }
    });
    
    return json({
      message: 'User verification updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        isVerifiedBuyer: updated.isVerifiedBuyer,
        isVerifiedBidder: updated.isVerifiedBidder
      }
    });
  } catch (err) {
    console.error('Error updating user verification:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, err.message || 'Failed to update user verification');
  }
}

