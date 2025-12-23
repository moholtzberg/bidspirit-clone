-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'BUYER',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "auctions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "image_url" TEXT,
    "seller_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "auctions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auction_id" TEXT NOT NULL,
    "lot_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "hebrew_title" TEXT,
    "description" TEXT,
    "hebrew_description" TEXT,
    "category" TEXT,
    "starting_bid" REAL NOT NULL,
    "current_bid" REAL NOT NULL DEFAULT 0,
    "bid_increment" REAL NOT NULL,
    "image_url" TEXT,
    "image_urls" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "end_time" DATETIME,
    "highest_bidder_id" TEXT,
    "highest_bidder_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lots_auction_id_fkey" FOREIGN KEY ("auction_id") REFERENCES "auctions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lot_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT,
    "amount" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bids_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bids_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "auctions_seller_id_idx" ON "auctions"("seller_id");

-- CreateIndex
CREATE INDEX "auctions_status_idx" ON "auctions"("status");

-- CreateIndex
CREATE INDEX "auctions_start_date_idx" ON "auctions"("start_date");

-- CreateIndex
CREATE INDEX "auctions_end_date_idx" ON "auctions"("end_date");

-- CreateIndex
CREATE INDEX "lots_auction_id_idx" ON "lots"("auction_id");

-- CreateIndex
CREATE INDEX "lots_status_idx" ON "lots"("status");

-- CreateIndex
CREATE INDEX "lots_end_time_idx" ON "lots"("end_time");

-- CreateIndex
CREATE UNIQUE INDEX "lots_auction_id_lot_number_key" ON "lots"("auction_id", "lot_number");

-- CreateIndex
CREATE INDEX "bids_lot_id_idx" ON "bids"("lot_id");

-- CreateIndex
CREATE INDEX "bids_user_id_idx" ON "bids"("user_id");

-- CreateIndex
CREATE INDEX "bids_timestamp_idx" ON "bids"("timestamp");
