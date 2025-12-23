// Use createRequire to import CommonJS Prisma Client in ES module context
import { createRequire } from 'module';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '$env/dynamic/private';

// #region agent log
fetch('http://127.0.0.1:7242/ingest/3c92fc5f-a28e-4692-89ad-7cb9d7bd10c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.js:7',message:'Module loading started',data:{hasGlobalPrisma:!!globalThis.prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

const require = createRequire(import.meta.url);

// Get DATABASE_URL from environment
const databaseUrl = env.DATABASE_URL;

// #region agent log
fetch('http://127.0.0.1:7242/ingest/3c92fc5f-a28e-4692-89ad-7cb9d7bd10c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.js:15',message:'DATABASE_URL check',data:{hasDatabaseUrl:!!databaseUrl,urlPrefix:databaseUrl?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// CRITICAL: Set DATABASE_URL before importing Prisma
// Prisma reads this from process.env at module load time
process.env.DATABASE_URL = databaseUrl;

// #region agent log
fetch('http://127.0.0.1:7242/ingest/3c92fc5f-a28e-4692-89ad-7cb9d7bd10c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.js:25',message:'Before PrismaClient require',data:{processEnvUrl:process.env.DATABASE_URL?.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Import Prisma Client using require (handles CommonJS)
const { PrismaClient } = require('@prisma/client');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/3c92fc5f-a28e-4692-89ad-7cb9d7bd10c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.js:30',message:'PrismaClient imported',data:{hasPrismaClient:!!PrismaClient},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// Create PrismaPg adapter for PostgreSQL
const adapter = new PrismaPg({ connectionString: databaseUrl });

// #region agent log
fetch('http://127.0.0.1:7242/ingest/3c92fc5f-a28e-4692-89ad-7cb9d7bd10c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.js:35',message:'Adapter created',data:{hasAdapter:!!adapter},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis;

// #region agent log
fetch('http://127.0.0.1:7242/ingest/3c92fc5f-a28e-4692-89ad-7cb9d7bd10c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.js:42',message:'Before PrismaClient instantiation',data:{hasGlobalPrisma:!!globalForPrisma.prisma,willCreateNew:!globalForPrisma.prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
// #endregion

let prisma;
try {
  prisma = globalForPrisma.prisma || new PrismaClient({ adapter });
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3c92fc5f-a28e-4692-89ad-7cb9d7bd10c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.js:47',message:'PrismaClient created successfully',data:{usedGlobal:!!globalForPrisma.prisma,createdNew:!globalForPrisma.prisma},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/3c92fc5f-a28e-4692-89ad-7cb9d7bd10c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.js:60',message:'PrismaClient creation error',data:{errorMessage:error.message,errorName:error.name,errorCode:error.code,errorStack:error.stack?.substring(0,500),hasClientVersion:!!error.clientVersion},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  throw error;
}

export { prisma };

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;