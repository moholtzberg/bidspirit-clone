import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';
import { writeFile, appendFile } from 'fs/promises';
import { join } from 'path';

const LOG_PATH = '/Users/moholtzberg/code/bidspirit-clone/.cursor/debug.log';

async function log(data) {
  try {
    const logEntry = JSON.stringify({...data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1'}) + '\n';
    await appendFile(LOG_PATH, logEntry, 'utf8');
  } catch (e) {}
}

export async function GET({ url }) {
  // #region agent log
  await log({location:'api/auctions/+server.js:4',message:'GET /api/auctions entry',data:{},hypothesisId:'D'});
  // #endregion
  try {
    const status = url.searchParams.get('status');
    const sellerId = url.searchParams.get('sellerId');
    const auctionHouseId = url.searchParams.get('auctionHouseId');
    
    console.log('GET /api/auctions - params:', { status, sellerId, auctionHouseId });
    // #region agent log
    await log({location:'api/auctions/+server.js:12',message:'Before db.auctions.getAll',data:{options:{auctionHouseId}},hypothesisId:'A'});
    // #endregion
    
    const options = {};
    if (auctionHouseId) {
      options.auctionHouseId = auctionHouseId;
    }
    
    let auctions = await db.auctions.getAll(options);
    // #region agent log
    await log({location:'api/auctions/+server.js:18',message:'After db.auctions.getAll',data:{auctionsType:typeof auctions,isArray:Array.isArray(auctions),length:auctions?.length,firstAuction:auctions?.[0]},hypothesisId:'A,E'});
    // #endregion
    console.log('auctions.getAll returned:', auctions);
    
    // Ensure auctions is an array
    if (!Array.isArray(auctions)) {
      console.error('auctions.getAll did not return an array:', auctions);
      return json([]);
    }
    
    console.log('Total auctions before filtering:', auctions.length);
    
    if (status) {
      auctions = auctions.filter(a => a.status && a.status.toLowerCase() === status.toLowerCase());
      console.log('After status filter:', auctions.length);
    }
    
    if (sellerId) {
      auctions = auctions.filter(a => a.sellerId === sellerId);
      console.log('After sellerId filter:', auctions.length);
    }
    
    console.log('Returning auctions:', auctions.length);
    // #region agent log
    await log({location:'api/auctions/+server.js:39',message:'Returning auctions',data:{count:auctions.length},hypothesisId:'D'});
    // #endregion
    return json(auctions);
  } catch (error) {
    console.error('Error in GET /api/auctions:', error);
    console.error('Error stack:', error.stack);
    // #region agent log
    await log({location:'api/auctions/+server.js:42',message:'Error caught in GET',data:{errorMessage:error.message,errorCode:error.code,errorName:error.name,errorStack:error.stack},hypothesisId:'A,B'});
    // #endregion
    return json({ error: error.message }, { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const data = await request.json();
    
    // Remove settings field if it exists (until migration is run)
    // The settings column doesn't exist in the database yet
    const { settings, ...auctionData } = data;
    
    const auction = await db.auctions.create(auctionData);
    return json(auction, { status: 201 });
  } catch (error) {
    console.error('Error creating auction:', error);
    console.error('Error details:', {
      code: error.code,
      meta: error.meta,
      message: error.message
    });
    return json({ 
      error: error.message || 'Failed to create auction',
      code: error.code,
      details: error.meta 
    }, { status: 500 });
  }
}

