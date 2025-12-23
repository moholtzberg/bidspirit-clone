import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { auctionHouseSignupSchema } from '$lib/zod.js';

export async function GET({ url }) {
  const slug = url.searchParams.get('slug');
  
  if (slug) {
    const auctionHouse = await db.auctionHouses.getBySlug(slug);
    if (!auctionHouse) {
      throw error(404, 'Auction house not found');
    }
    return json(auctionHouse);
  }
  
  const auctionHouses = await db.auctionHouses.getAll();
  return json(auctionHouses);
}

export async function POST({ request }) {
  try {
    const data = await request.json();
    
    // Validate the data
    const validated = await auctionHouseSignupSchema.parseAsync(data);
    
    // Check if slug already exists
    const existing = await db.auctionHouses.getBySlug(validated.slug);
    if (existing) {
      throw error(400, 'An auction house with this slug already exists');
    }
    
    // Create the auction house
    const auctionHouse = await db.auctionHouses.create({
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
      domain: validated.domain || null,
      logoUrl: validated.logoUrl || null,
      isActive: true
    });
    
    return json(auctionHouse, { status: 201 });
  } catch (err) {
    // Handle Zod validation errors
    if (err.name === 'ZodError') {
      const messages = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw error(400, `Validation error: ${messages}`);
    }
    
    // Handle Prisma unique constraint errors
    if (err.code === 'P2002' || err.meta?.target) {
      const target = err.meta?.target?.[0];
      if (target === 'slug') {
        throw error(400, 'An auction house with this slug already exists');
      }
      if (target === 'domain') {
        throw error(400, 'An auction house with this domain already exists');
      }
    }
    
    // Re-throw SvelteKit errors
    if (err.status) {
      throw err;
    }
    
    console.error('Error creating auction house:', err);
    throw error(500, err.message || 'Failed to create auction house');
  }
}

