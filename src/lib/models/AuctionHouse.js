import { z } from 'zod';
import { BaseModel } from './BaseModel.js';
import prisma from '$lib/prisma.js';

const auctionHouseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  domain: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url().nullable().optional().or(z.literal('')),
  settings: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export class AuctionHouse extends BaseModel {
  static prismaModel = prisma.auctionHouse;
  static schema = auctionHouseSchema;

  static getSearchableFields() {
    return ['name', 'slug', 'description'];
  }

  static getToManyRelations() {
    return ['users', 'auctions'];
  }

  static getDefaultIncludes() {
    return {
      users: true,
      auctions: {
        include: {
          lots: true
        }
      }
    };
  }

  // Override beforeCreate to skip number generation (AuctionHouse doesn't have a number field)
  async beforeCreate() {
    // Skip number generation - AuctionHouse uses slug as identifier
  }
}

