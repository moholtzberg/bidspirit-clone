import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';
import { db } from '$lib/db.js';

export async function POST({ params, locals }) {
  try {
    // Check authentication
    const session = await locals.auth?.();
    if (!session?.user) {
      throw error(401, 'You must be logged in to register for an auction');
    }
    
    // Get user from database
    const user = await db.users.getByEmail(session.user.email);
    if (!user) {
      throw error(404, 'User not found');
    }
    
    // Get auction
    const auction = await prisma.auction.findUnique({
      where: { id: params.id }
    });
    
    if (!auction) {
      throw error(404, 'Auction not found');
    }
    
    // Check if already registered
    const existingRegistration = await prisma.auctionRegistration.findUnique({
      where: {
        auctionId_userId: {
          auctionId: auction.id,
          userId: user.id
        }
      }
    });
    
    if (existingRegistration) {
      return json({
        message: 'You are already registered for this auction',
        registered: true
      });
    }
    
    // Create registration
    const registration = await prisma.auctionRegistration.create({
      data: {
        auctionId: auction.id,
        userId: user.id
      }
    });
    
    return json({
      message: 'Successfully registered for auction',
      registered: true
    }, { status: 201 });
  } catch (err) {
    console.error('Error registering for auction:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, err.message || 'Failed to register for auction');
  }
}

export async function GET({ params, locals }) {
  try {
    // Check authentication
    const session = await locals.auth?.();
    if (!session?.user) {
      throw error(401, 'Unauthorized');
    }
    
    // Get user from database
    const user = await db.users.getByEmail(session.user.email);
    if (!user) {
      throw error(404, 'User not found');
    }
    
    // Check if user is registered
    const registration = await prisma.auctionRegistration.findUnique({
      where: {
        auctionId_userId: {
          auctionId: params.id,
          userId: user.id
        }
      }
    });
    
    return json({
      registered: !!registration
    });
  } catch (err) {
    console.error('Error checking registration:', err);
    if (err.status) {
      throw err;
    }
    throw error(500, 'Failed to check registration status');
  }
}

