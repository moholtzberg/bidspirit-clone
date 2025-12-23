/*
  Warnings:

  - Added the required column `auction_house_id` to the `auctions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "auction_houses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "description" TEXT,
    "logo_url" TEXT,
    "settings" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auctions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "image_url" TEXT,
    "auction_house_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "auctions_auction_house_id_fkey" FOREIGN KEY ("auction_house_id") REFERENCES "auction_houses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "auctions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_auctions" ("created_at", "description", "end_date", "id", "image_url", "seller_id", "start_date", "status", "title", "updated_at") SELECT "created_at", "description", "end_date", "id", "image_url", "seller_id", "start_date", "status", "title", "updated_at" FROM "auctions";
DROP TABLE "auctions";
ALTER TABLE "new_auctions" RENAME TO "auctions";
CREATE INDEX "auctions_auction_house_id_idx" ON "auctions"("auction_house_id");
CREATE INDEX "auctions_seller_id_idx" ON "auctions"("seller_id");
CREATE INDEX "auctions_status_idx" ON "auctions"("status");
CREATE INDEX "auctions_start_date_idx" ON "auctions"("start_date");
CREATE INDEX "auctions_end_date_idx" ON "auctions"("end_date");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'BUYER',
    "auction_house_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_auction_house_id_fkey" FOREIGN KEY ("auction_house_id") REFERENCES "auction_houses" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("created_at", "email", "first_name", "id", "last_name", "name", "role", "updated_at") SELECT "created_at", "email", "first_name", "id", "last_name", "name", "role", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_auction_house_id_idx" ON "users"("auction_house_id");
CREATE INDEX "users_role_idx" ON "users"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "auction_houses_slug_key" ON "auction_houses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "auction_houses_domain_key" ON "auction_houses"("domain");

-- CreateIndex
CREATE INDEX "auction_houses_slug_idx" ON "auction_houses"("slug");

-- CreateIndex
CREATE INDEX "auction_houses_is_active_idx" ON "auction_houses"("is_active");
