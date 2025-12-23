import { z } from 'zod';
import { BaseModel } from './BaseModel.js';
import prisma from '$lib/prisma.js';

const lotSchema = z.object({
  id: z.string().optional(),
  auctionId: z.string().min(1, 'Auction ID is required'),
  lotNumber: z.number().int().positive('Lot number must be positive'),
  title: z.string().min(1, 'Title is required'),
  hebrewTitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  hebrewDescription: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  startingBid: z.number().nonnegative('Starting bid must be non-negative'),
  currentBid: z.number().nonnegative('Current bid must be non-negative').default(0),
  bidIncrement: z.number().positive('Bid increment must be positive'),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')),
  imageUrls: z.array(z.string().url()).nullable().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'UNSOLD', 'WITHDRAWN']).default('ACTIVE'),
  endTime: z.date().nullable().optional(),
  highestBidderId: z.string().nullable().optional(),
  highestBidderName: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export class Lot extends BaseModel {
  static prismaModel = prisma.lot;
  static schema = lotSchema;

  static getSearchableFields() {
    return ['title', 'hebrewTitle', 'description', 'hebrewDescription', 'category'];
  }

  static getToManyRelations() {
    return ['bids'];
  }

  static getDefaultIncludes() {
    return {
      auction: {
        include: {
          auctionHouse: true,
          seller: true
        }
      },
      bids: {
        include: {
          user: true
        },
        orderBy: {
          timestamp: 'desc'
        }
      }
    };
  }

  // Custom validation
  runValidations() {
    if (this.data.currentBid !== undefined && this.data.startingBid !== undefined) {
      if (this.data.currentBid < this.data.startingBid) {
        this.addError('currentBid', 'Current bid cannot be less than starting bid');
      }
    }

    if (this.data.imageUrls && Array.isArray(this.data.imageUrls)) {
      // Convert array to JSON string for storage
      this.data.imageUrls = JSON.stringify(this.data.imageUrls);
    }
  }

  // Override prepareDataForSave to handle imageUrls
  prepareDataForSave(isCreate = false) {
    const data = super.prepareDataForSave(isCreate);
    
    // Convert imageUrls array to JSON string if it's an array
    if (data.imageUrls && Array.isArray(data.imageUrls)) {
      data.imageUrls = JSON.stringify(data.imageUrls);
    }
    
    return data;
  }

  // Override beforeCreate to skip number generation (Lot uses lotNumber, not number)
  async beforeCreate() {
    // Skip number generation - Lot uses lotNumber field
  }

  // Override serializeForJson to parse imageUrls back to array
  serializeForJson() {
    const serialized = super.serializeForJson();
    
    // Parse imageUrls JSON string back to array if it exists
    if (serialized.imageUrls && typeof serialized.imageUrls === 'string') {
      try {
        serialized.imageUrls = JSON.parse(serialized.imageUrls);
      } catch (e) {
        // If parsing fails, keep as string
      }
    }
    
    return serialized;
  }
}

