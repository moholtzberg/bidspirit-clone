import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

// Get all unique tags for an auction house
export async function GET({ url }) {
  try {
    const auctionHouseId = url.searchParams.get('auctionHouseId');
    
    if (!auctionHouseId) {
      return json([]);
    }

    // Get all lots for this auction house and extract unique tags
    const lots = await prisma.lot.findMany({
      where: {
        auction: {
          auctionHouseId
        },
        tags: {
          not: null
        }
      },
      select: {
        tags: true
      }
    });

    // Extract and deduplicate tags from JSON arrays
    const allTags = new Set();
    lots.forEach(lot => {
      if (lot.tags) {
        try {
          const tags = typeof lot.tags === 'string' ? JSON.parse(lot.tags) : lot.tags;
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (tag && typeof tag === 'string') {
                allTags.add(tag.trim());
              }
            });
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    });

    return json(Array.from(allTags).sort());
  } catch (error) {
    console.error('Error fetching tags:', error);
    return json([], { status: 500 });
  }
}

