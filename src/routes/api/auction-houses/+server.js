import { json, error } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { auctionHouseSignupSchema } from '$lib/zod.js';
import { User } from '$lib/models/index.js';
import prisma from '$lib/prisma.js';

export async function GET({ url }) {
  const slug = url.searchParams.get('slug');
  const id = url.searchParams.get('id');
  
  if (id) {
    const auctionHouse = await db.auctionHouses.getById(id);
    if (!auctionHouse) {
      throw error(404, 'Auction house not found');
    }
    return json(auctionHouse);
  }
  
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

export async function POST({ request, locals }) {
  try {
    // Get session (if user is logged in)
    const session = await locals.auth?.();
    const loggedInUser = session?.user;
    
    const data = await request.json();
    
    // Validate the data
    const validated = await auctionHouseSignupSchema.parseAsync(data);
    
    // Determine if we need to create a user
    let userId;
    
    if (loggedInUser) {
      // User is logged in - check if they exist in our database
      let user = await db.users.getByEmail(loggedInUser.email);
      
      if (!user) {
        // Create user in our database from session data
        user = await User.create({
          email: loggedInUser.email,
          name: loggedInUser.name || `${loggedInUser.first_name || ''} ${loggedInUser.last_name || ''}`.trim(),
          firstName: loggedInUser.first_name || null,
          lastName: loggedInUser.last_name || null,
          role: 'SELLER' // Default role for auction house owners
        });
      }
      
      userId = user.id;
    } else {
      // User is not logged in - require user creation fields
      if (!validated.userEmail || !validated.userName) {
        throw error(400, 'User information is required. Please provide email and name, or log in first.');
      }
      
      // Check if user with this email already exists
      const existingUser = await db.users.getByEmail(validated.userEmail);
      if (existingUser) {
        throw error(400, 'A user with this email already exists. Please log in instead.');
      }
      
      // Create new user (password is handled by external auth system)
      const newUser = await User.create({
        email: validated.userEmail,
        name: validated.userName,
        firstName: validated.userFirstName || null,
        lastName: validated.userLastName || null,
        role: 'SELLER' // Default role for auction house owners
      });
      
      userId = newUser.id;
    }
    
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
    
    // Link the user to the auction house
    await prisma.user.update({
      where: { id: userId },
      data: { auctionHouseId: auctionHouse.id }
    });
    
    return json({ 
      auctionHouse,
      userId,
      message: loggedInUser 
        ? 'Auction house created successfully' 
        : 'Auction house and user account created successfully. Please log in to continue.'
    }, { status: 201 });
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
      if (target === 'email') {
        throw error(400, 'A user with this email already exists');
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

