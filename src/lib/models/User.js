import { z } from 'zod';
import { BaseModel } from './BaseModel.js';
import prisma from '$lib/prisma.js';

const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Invalid email address'),
  name: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  role: z.enum(['BUYER', 'SELLER', 'AUCTIONEER']).default('BUYER'),
  auctionHouseId: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export class User extends BaseModel {
  static prismaModel = prisma.user;
  static schema = userSchema;

  static getSearchableFields() {
    return ['email', 'name', 'firstName', 'lastName'];
  }

  static getToManyRelations() {
    return ['auctions', 'bids'];
  }

  static getDefaultIncludes() {
    return {
      auctionHouse: true,
      auctions: true,
      bids: {
        include: {
          lot: true
        }
      }
    };
  }

  // Override beforeCreate to skip number generation (User doesn't have a number field)
  async beforeCreate() {
    // Skip number generation - User uses email as identifier
  }
}

