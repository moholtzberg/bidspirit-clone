// Use createRequire to import CommonJS Prisma Client in ES module context
import { createRequire } from 'module';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '$env/dynamic/private';

const require = createRequire(import.meta.url);

// Get DATABASE_URL from environment
const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// CRITICAL: Set DATABASE_URL before importing Prisma
// Prisma reads this from process.env at module load time
process.env.DATABASE_URL = databaseUrl;

// Import Prisma Client using require (handles CommonJS)
const { PrismaClient } = require('@prisma/client');

// Create PrismaPg adapter for PostgreSQL
const adapter = new PrismaPg({ connectionString: databaseUrl });

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;