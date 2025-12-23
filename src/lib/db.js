import prisma from './prisma.js';
import { AuctionHouse, User, Auction, Lot, Bid } from './models/index.js';

// Helper functions to map Prisma models to API format
function mapAuctionHouse(prismaAuctionHouse) {
  if (!prismaAuctionHouse) return null;
  return {
    id: prismaAuctionHouse.id,
    name: prismaAuctionHouse.name,
    slug: prismaAuctionHouse.slug,
    domain: prismaAuctionHouse.domain,
    description: prismaAuctionHouse.description,
    logoUrl: prismaAuctionHouse.logoUrl,
    settings: prismaAuctionHouse.settings,
    isActive: prismaAuctionHouse.isActive,
    createdAt: prismaAuctionHouse.createdAt,
    updatedAt: prismaAuctionHouse.updatedAt
  };
}

function mapAuction(prismaAuction) {
  if (!prismaAuction) return null;
  return {
    id: prismaAuction.id,
    title: prismaAuction.title,
    description: prismaAuction.description,
    startDate: prismaAuction.startDate,
    endDate: prismaAuction.endDate,
    status: prismaAuction.status.toLowerCase(),
    imageUrl: prismaAuction.imageUrl,
    auctionHouseId: prismaAuction.auctionHouseId,
    sellerId: prismaAuction.sellerId,
    createdAt: prismaAuction.createdAt,
    updatedAt: prismaAuction.updatedAt
  };
}

function mapLot(prismaLot) {
  if (!prismaLot) return null;
  return {
    id: prismaLot.id,
    auctionId: prismaLot.auctionId,
    lotNumber: prismaLot.lotNumber,
    title: prismaLot.title,
    HebrewTitle: prismaLot.hebrewTitle,
    hebrewTitle: prismaLot.hebrewTitle,
    description: prismaLot.description,
    HebrewDescription: prismaLot.hebrewDescription,
    hebrewDescription: prismaLot.hebrewDescription,
    category: prismaLot.category,
    startingBid: prismaLot.startingBid,
    currentBid: prismaLot.currentBid,
    bidIncrement: prismaLot.bidIncrement,
    imageUrl: prismaLot.imageUrl,
    imageUrls: prismaLot.imageUrls ? (typeof prismaLot.imageUrls === 'string' ? JSON.parse(prismaLot.imageUrls) : prismaLot.imageUrls) : null,
    status: prismaLot.status.toLowerCase(),
    endTime: prismaLot.endTime,
    highestBidderId: prismaLot.highestBidderId,
    highestBidderName: prismaLot.highestBidderName,
    createdAt: prismaLot.createdAt,
    updatedAt: prismaLot.updatedAt
  };
}

function mapBid(prismaBid) {
  if (!prismaBid) return null;
  return {
    id: prismaBid.id,
    lotId: prismaBid.lotId,
    userId: prismaBid.userId,
    userName: prismaBid.userName,
    amount: prismaBid.amount,
    timestamp: prismaBid.timestamp
  };
}

function mapUser(prismaUser) {
  if (!prismaUser) return null;
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    name: prismaUser.name,
    firstName: prismaUser.firstName,
    lastName: prismaUser.lastName,
    role: prismaUser.role.toLowerCase(),
    auctionHouseId: prismaUser.auctionHouseId,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt
  };
}

export const db = {
  auctionHouses: {
    getAll: async () => {
      const houses = await prisma.auctionHouse.findMany({
        where: { isActive: true }
      });
      return houses.map(mapAuctionHouse);
    },
    getById: async (id) => {
      const house = await prisma.auctionHouse.findUnique({
        where: { id }
      });
      return mapAuctionHouse(house);
    },
    getBySlug: async (slug) => {
      const house = await prisma.auctionHouse.findUnique({
        where: { slug }
      });
      return mapAuctionHouse(house);
    },
    create: async (data) => {
      const house = await prisma.auctionHouse.create({
        data
      });
      return mapAuctionHouse(house);
    },
    update: async (id, updates) => {
      const house = await prisma.auctionHouse.update({
        where: { id },
        data: updates
      });
      return mapAuctionHouse(house);
    }
  },
  auctions: {
    getAll: async (options = {}) => {
      const where = options.auctionHouseId 
        ? { auctionHouseId: options.auctionHouseId }
        : {};
      const auctions = await prisma.auction.findMany({
        where,
        include: {
          seller: true,
          auctionHouse: true
        }
      });
      return auctions.map(mapAuction);
    },
    getById: async (id) => {
      const auction = await prisma.auction.findUnique({
        where: { id },
        include: {
          seller: true,
          auctionHouse: true
        }
      });
      return mapAuction(auction);
    },
    create: async (auction) => {
      const created = await prisma.auction.create({
        data: auction,
        include: {
          seller: true,
          auctionHouse: true
        }
      });
      return mapAuction(created);
    },
    update: async (id, updates) => {
      const updated = await prisma.auction.update({
        where: { id },
        data: updates,
        include: {
          seller: true,
          auctionHouse: true
        }
      });
      return mapAuction(updated);
    }
  },
  lots: {
    getByAuctionId: async (auctionId) => {
      const lots = await prisma.lot.findMany({
        where: { auctionId },
        orderBy: { lotNumber: 'asc' }
      });
      return lots.map(mapLot);
    },
    getById: async (id) => {
      const lot = await prisma.lot.findUnique({
        where: { id },
        include: {
          auction: true
        }
      });
      return mapLot(lot);
    },
    create: async (lot) => {
      const created = await prisma.lot.create({
        data: lot
      });
      return mapLot(created);
    },
    update: async (id, updates) => {
      const updated = await prisma.lot.update({
        where: { id },
        data: updates
      });
      return mapLot(updated);
    }
  },
  bids: {
    getByLotId: async (lotId) => {
      const bids = await prisma.bid.findMany({
        where: { lotId },
        orderBy: { timestamp: 'desc' }
      });
      return bids.map(mapBid);
    },
    getByUserId: async (userId) => {
      const bids = await prisma.bid.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' }
      });
      return bids.map(mapBid);
    },
    create: async (bid) => {
      const created = await prisma.bid.create({
        data: bid
      });
      return mapBid(created);
    }
  },
  users: {
    getById: async (id) => {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      return mapUser(user);
    },
    getByEmail: async (email) => {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      return mapUser(user);
    },
    getByAuctionHouse: async (auctionHouseId) => {
      const users = await prisma.user.findMany({
        where: { auctionHouseId }
      });
      return users.map(mapUser);
    },
    create: async (user) => {
      const created = await prisma.user.create({
        data: user
      });
      return mapUser(created);
    }
  }
};
