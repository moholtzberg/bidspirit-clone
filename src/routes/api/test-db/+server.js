import { json } from '@sveltejs/kit';
import { AuctionHouse, User, Auction, Lot, Bid } from '$lib/models';

export async function GET() {
  const results = {
    success: true,
    tests: [],
    errors: []
  };

  try {
    // Test 1: Database connection
    results.tests.push({ name: 'Database Connection', status: 'testing' });
    const prisma = (await import('$lib/prisma.js')).default;
    await prisma.$connect();
    results.tests[0].status = 'passed';
    results.tests[0].message = 'Successfully connected to database';

    // Test 2: Create AuctionHouse
    results.tests.push({ name: 'Create AuctionHouse', status: 'testing' });
    const testAuctionHouse = await AuctionHouse.create({
      name: 'Test Auction House',
      slug: `test-house-${Date.now()}`,
      description: 'Test auction house for database verification'
    });
    results.tests[1].status = 'passed';
    results.tests[1].message = `Created auction house: ${testAuctionHouse.id}`;

    // Test 3: Create User
    results.tests.push({ name: 'Create User', status: 'testing' });
    const testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'SELLER',
      auctionHouseId: testAuctionHouse.id
    });
    results.tests[2].status = 'passed';
    results.tests[2].message = `Created user: ${testUser.id}`;

    // Test 4: Create Auction
    results.tests.push({ name: 'Create Auction', status: 'testing' });
    const testAuction = await Auction.create({
      title: 'Test Auction',
      description: 'Test auction for database verification',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'UPCOMING',
      auctionHouseId: testAuctionHouse.id,
      sellerId: testUser.id
    });
    results.tests[3].status = 'passed';
    results.tests[3].message = `Created auction: ${testAuction.id}`;

    // Test 5: Create Lot
    results.tests.push({ name: 'Create Lot', status: 'testing' });
    const testLot = await Lot.create({
      auctionId: testAuction.id,
      lotNumber: 1,
      title: 'Test Lot',
      description: 'Test lot for database verification',
      startingBid: 100,
      currentBid: 100,
      bidIncrement: 10,
      status: 'ACTIVE'
    });
    results.tests[4].status = 'passed';
    results.tests[4].message = `Created lot: ${testLot.id}`;

    // Test 6: Create Bid
    results.tests.push({ name: 'Create Bid', status: 'testing' });
    const testBid = await Bid.create({
      lotId: testLot.id,
      userId: testUser.id,
      userName: testUser.name,
      amount: 110
    });
    results.tests[5].status = 'passed';
    results.tests[5].message = `Created bid: ${testBid.id}`;

    // Test 7: Read operations
    results.tests.push({ name: 'Read Operations', status: 'testing' });
    const foundAuctionHouse = await AuctionHouse.find(testAuctionHouse.id);
    const foundUser = await User.find(testUser.id);
    const foundAuction = await Auction.find(testAuction.id);
    const foundLot = await Lot.find(testLot.id);
    const foundBid = await Bid.find(testBid.id);
    
    if (foundAuctionHouse && foundUser && foundAuction && foundLot && foundBid) {
      results.tests[6].status = 'passed';
      results.tests[6].message = 'All read operations successful';
    } else {
      results.tests[6].status = 'failed';
      results.tests[6].message = 'Some read operations failed';
    }

    // Test 8: List operations
    results.tests.push({ name: 'List Operations', status: 'testing' });
    const auctionHouses = await AuctionHouse.findMany({ per_page: 5 });
    const users = await User.findMany({ per_page: 5 });
    const auctions = await Auction.findMany({ per_page: 5 });
    
    if (auctionHouses.records.length > 0 && users.records.length > 0 && auctions.records.length > 0) {
      results.tests[7].status = 'passed';
      results.tests[7].message = `Found ${auctionHouses.records.length} auction houses, ${users.records.length} users, ${auctions.records.length} auctions`;
    } else {
      results.tests[7].status = 'failed';
      results.tests[7].message = 'List operations returned empty results';
    }

    // Test 9: Relations
    results.tests.push({ name: 'Relations', status: 'testing' });
    const auctionWithRelations = await Auction.find(testAuction.id, {
      include: {
        auctionHouse: true,
        seller: true,
        lots: true
      }
    });
    
    if (auctionWithRelations && auctionWithRelations.data.auctionHouse && auctionWithRelations.data.seller) {
      results.tests[8].status = 'passed';
      results.tests[8].message = 'Relations loaded successfully';
    } else {
      results.tests[8].status = 'failed';
      results.tests[8].message = 'Failed to load relations';
    }

    // Cleanup: Delete test data
    results.tests.push({ name: 'Cleanup', status: 'testing' });
    try {
      await Bid.find(testBid.id).then(b => b?.destroy());
      await Lot.find(testLot.id).then(l => l?.destroy());
      await Auction.find(testAuction.id).then(a => a?.destroy());
      await User.find(testUser.id).then(u => u?.destroy());
      await AuctionHouse.find(testAuctionHouse.id).then(ah => ah?.destroy());
      results.tests[9].status = 'passed';
      results.tests[9].message = 'Test data cleaned up';
    } catch (error) {
      results.tests[9].status = 'warning';
      results.tests[9].message = `Cleanup had issues: ${error.message}`;
    }

    results.summary = {
      total: results.tests.length,
      passed: results.tests.filter(t => t.status === 'passed').length,
      failed: results.tests.filter(t => t.status === 'failed').length,
      warnings: results.tests.filter(t => t.status === 'warning').length
    };

  } catch (error) {
    results.success = false;
    results.errors.push({
      message: error.message,
      stack: error.stack
    });
  }

  return json(results);
}

