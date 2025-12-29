import { json, error } from '@sveltejs/kit';
import { auctionSettingsSchema } from '$lib/zod.js';
import prisma from '$lib/prisma.js';

export async function GET({ params, locals }) {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: params.id },
      include: { seller: true }
    });

    if (!auction) {
      throw error(404, 'Auction not found');
    }

    // Parse settings JSON or return empty object
    const settings = auction.settings ? JSON.parse(auction.settings) : {};

    // For public access (non-logged-in users), only return gallery-related settings
    const session = await locals.auth?.();
    if (!session?.user) {
      // Public access - only return gallery template settings
      return json({
        galleryTemplate: settings.galleryTemplate || 'card-grid',
        galleryTemplateSettings: settings.galleryTemplateSettings || {}
      });
    }

    // For authenticated users, check permissions for full settings access
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // If user is seller or belongs to auction house, return full settings
    if (user && (user.id === auction.sellerId || user.auctionHouseId === auction.auctionHouseId)) {
      return json(settings);
    }

    // Otherwise, return only gallery settings (public access)
    return json({
      galleryTemplate: settings.galleryTemplate || 'card-grid',
      galleryTemplateSettings: settings.galleryTemplateSettings || {}
    });
  } catch (err) {
    if (err.status) {
      throw err;
    }
    console.error('Error fetching auction settings:', err);
    throw error(500, 'Failed to fetch auction settings');
  }
}

export async function PATCH({ params, request, locals }) {
  try {
    const session = await locals.auth?.();
    if (!session?.user) {
      throw error(401, 'Unauthorized');
    }

    const auction = await prisma.auction.findUnique({
      where: { id: params.id },
      include: { seller: true }
    });

    if (!auction) {
      throw error(404, 'Auction not found');
    }

    // Check if user has access to this auction
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (user.id !== auction.sellerId && user.auctionHouseId !== auction.auctionHouseId)) {
      throw error(403, 'Forbidden');
    }

    const data = await request.json();

    // Validate the settings data
    const validated = await auctionSettingsSchema.parseAsync(data);

    // Update the auction settings
    const updated = await prisma.auction.update({
      where: { id: params.id },
      data: {
        settings: JSON.stringify(validated)
      }
    });

    return json({ 
      message: 'Auction settings updated successfully',
      settings: validated
    });
  } catch (err) {
    // Handle Zod validation errors
    if (err.name === 'ZodError') {
      const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw error(400, `Validation error: ${messages}`);
    }

    if (err.status) {
      throw err;
    }
    console.error('Error updating auction settings:', err);
    throw error(500, 'Failed to update auction settings');
  }
}

