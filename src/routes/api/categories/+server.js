import { json } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

// Get all unique categories for an auction house
export async function GET({ url }) {
  try {
    const auctionHouseId = url.searchParams.get('auctionHouseId');
    
    if (!auctionHouseId) {
      return json([]);
    }

    // Get all lots for this auction house and extract unique categories
    const lots = await prisma.lot.findMany({
      where: {
        auction: {
          auctionHouseId
        },
        category: {
          not: null
        }
      },
      select: {
        category: true
      },
      distinct: ['category']
    });

    const categories = lots
      .map(lot => lot.category)
      .filter(Boolean)
      .sort();

    return json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return json([], { status: 500 });
  }
}

