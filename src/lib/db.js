// In-memory database for development
// In production, replace with a real database (PostgreSQL, MongoDB, etc.)

let auctions = [
  {
    id: '1',
    title: 'Rare Judaica & Antique Ceremonial Objects',
    description: 'A curated collection of rare Judaica including antique menorahs, Torah scrolls, Kiddush cups, and ceremonial silver from the 18th-20th centuries.',
    startDate: new Date('2024-12-20T14:00:00').toISOString(),
    endDate: new Date('2024-12-22T18:00:00').toISOString(),
    status: 'live', // upcoming, live, ended
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
    sellerId: 'seller1',
    sellerName: 'Heritage Judaica Auctions',
    totalLots: 45,
    currentBids: 128
  },
  {
    id: '2',
    title: 'Vintage Hanukkah Menorahs & Dreidels',
    description: 'Exceptional collection of antique Hanukkah menorahs, vintage dreidels, and holiday Judaica from European and American makers.',
    startDate: new Date('2024-12-18T10:00:00').toISOString(),
    endDate: new Date('2024-12-20T16:00:00').toISOString(),
    status: 'live',
    imageUrl: 'https://images.unsplash.com/photo-1606914469633-bd9cdfd8f7b0?w=800',
    sellerId: 'seller2',
    sellerName: 'Sacred Treasures Judaica',
    totalLots: 32,
    currentBids: 89
  },
  {
    id: '3',
    title: 'Torah Scrolls & Religious Textiles',
    description: 'Rare Torah scrolls, Megillot Esther, and antique religious textiles including tallitot and parochet from historic synagogues.',
    startDate: new Date('2024-12-25T12:00:00').toISOString(),
    endDate: new Date('2024-12-27T20:00:00').toISOString(),
    status: 'upcoming',
    imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
    sellerId: 'seller1',
    sellerName: 'Heritage Judaica Auctions',
    totalLots: 28,
    currentBids: 0
  }
];

let lots = [
  {
    id: 'lot1',
    auctionId: '1',
    lotNumber: 1,
    title: 'Antique Silver Hanukkah Menorah, Poland c. 1850',
    HebrewTitle: 'מנורת חנוכה כסף עתיקה, פולין 1850',
    description: 'Rare 8-branch silver menorah with intricate filigree work, hallmarked from Warsaw, Poland. Excellent condition with original patina. Height: 12 inches.',
    HebrewDescription: 'מנורת חנוכה כסף נדירה עם 8 קנים, עבודת פיליגרן מורכבת, חתומה מוורשה, פולין. מצב מעולה עם פטינה מקורית. גובה: 12 אינצ\'ים.',
    startingBid: 5000,
    currentBid: 7500,
    bidIncrement: 250,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600',
    status: 'active',
    endTime: new Date('2024-12-22T18:00:00').toISOString(),
    highestBidderId: 'user1',
    highestBidderName: 'David Cohen'
  },
  {
    id: 'lot2',
    auctionId: '1',
    lotNumber: 2,
    title: 'Vintage Silver Kiddush Cup, Russia c. 1890',
    HebrewTitle: 'גביע קידוש כסף וינטג, רוסיה 1890',
    description: 'Beautifully crafted silver Kiddush cup with Hebrew inscriptions, from a Russian synagogue. Engraved with traditional motifs. Height: 6 inches.',
    HebrewDescription: 'גביע קידוש כסף מעוצב להפליא עם כתובות עבריות, מבית כנסת רוסי. מגולף עם מוטיבים מסורתיים. גובה: 6 אינצ\'ים.',
    startingBid: 3000,
    currentBid: 4200,
    bidIncrement: 200,
    imageUrl: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=600',
    status: 'active',
    endTime: new Date('2024-12-22T18:00:00').toISOString(),
    highestBidderId: null,
    highestBidderName: null
  },
  {
    id: 'lot3',
    auctionId: '2',
    lotNumber: 1,
    title: 'Antique Dreidel Collection - Set of 4, Germany c. 1920',
    HebrewTitle: 'אוסף סביבונים עתיקים - סט של 4, גרמניה 1920',
    description: 'Rare collection of four hand-carved wooden dreidels from pre-war Germany. Each features different Hebrew letters and traditional designs. Excellent provenance.',
    HebrewDescription: 'אוסף נדיר של ארבעה סביבונים מגולפים בעבודת יד מגרמניה שלפני המלחמה. כל אחד כולל אותיות עבריות שונות ועיצובים מסורתיים. ייחוס מעולה.',
    startingBid: 1500,
    currentBid: 1850,
    bidIncrement: 100,
    imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600',
    status: 'active',
    endTime: new Date('2024-12-20T16:00:00').toISOString(),
    highestBidderId: 'user2',
    highestBidderName: 'Sarah Goldstein'
  }
];

let bids = [
  {
    id: 'bid1',
    lotId: 'lot1',
    userId: 'user1',
    userName: 'David Cohen',
    amount: 7500,
    timestamp: new Date('2024-12-19T15:30:00').toISOString()
  },
  {
    id: 'bid2',
    lotId: 'lot1',
    userId: 'user3',
    userName: 'Michael Rosen',
    amount: 7250,
    timestamp: new Date('2024-12-19T15:25:00').toISOString()
  },
  {
    id: 'bid3',
    lotId: 'lot3',
    userId: 'user2',
    userName: 'Sarah Goldstein',
    amount: 1850,
    timestamp: new Date('2024-12-19T14:20:00').toISOString()
  }
];

let users = [
  {
    id: 'user1',
    email: 'david@example.com',
    name: 'David Cohen',
    role: 'buyer'
  },
  {
    id: 'user2',
    email: 'sarah@example.com',
    name: 'Sarah Goldstein',
    role: 'buyer'
  },
  {
    id: 'seller1',
    email: 'heritage@example.com',
    name: 'Heritage Judaica Auctions',
    role: 'seller'
  },
  {
    id: 'seller2',
    email: 'sacred@example.com',
    name: 'Sacred Treasures Judaica',
    role: 'seller'
  }
];

export const db = {
  auctions: {
    getAll: () => Promise.resolve(auctions),
    getById: (id) => Promise.resolve(auctions.find(a => a.id === id)),
    create: (auction) => {
      const newAuction = { ...auction, id: String(auctions.length + 1) };
      auctions.push(newAuction);
      return Promise.resolve(newAuction);
    },
    update: (id, updates) => {
      const index = auctions.findIndex(a => a.id === id);
      if (index === -1) return Promise.resolve(null);
      auctions[index] = { ...auctions[index], ...updates };
      return Promise.resolve(auctions[index]);
    }
  },
  lots: {
    getByAuctionId: (auctionId) => Promise.resolve(lots.filter(l => l.auctionId === auctionId)),
    getById: (id) => Promise.resolve(lots.find(l => l.id === id)),
    create: (lot) => {
      const newLot = { ...lot, id: `lot${lots.length + 1}` };
      lots.push(newLot);
      return Promise.resolve(newLot);
    },
    update: (id, updates) => {
      const index = lots.findIndex(l => l.id === id);
      if (index === -1) return Promise.resolve(null);
      lots[index] = { ...lots[index], ...updates };
      return Promise.resolve(lots[index]);
    }
  },
  bids: {
    getByLotId: (lotId) => Promise.resolve(bids.filter(b => b.lotId === lotId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))),
    getByUserId: (userId) => Promise.resolve(bids.filter(b => b.userId === userId)),
    create: (bid) => {
      const newBid = { ...bid, id: `bid${bids.length + 1}`, timestamp: new Date().toISOString() };
      bids.push(newBid);
      return Promise.resolve(newBid);
    }
  },
  users: {
    getById: (id) => Promise.resolve(users.find(u => u.id === id)),
    getByEmail: (email) => Promise.resolve(users.find(u => u.email === email)),
    create: (user) => {
      const newUser = { ...user, id: `user${users.length + 1}` };
      users.push(newUser);
      return Promise.resolve(newUser);
    }
  }
};
