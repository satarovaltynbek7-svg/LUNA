CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED');

CREATE TABLE "MenuCategory" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "names" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuItem" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "categoryId" UUID NOT NULL,
    "names" JSONB NOT NULL,
    "descriptions" JSONB NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" VARCHAR(2048) NOT NULL,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MenuItem_price_check" CHECK ("price" BETWEEN 1 AND 1000000)
);

CREATE TABLE "CafeOrder" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "tableNumber" INTEGER,
    "customerName" VARCHAR(100),
    "customerPhone" VARCHAR(24),
    "note" VARCHAR(500),
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CafeOrder_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CafeOrder_total_check" CHECK ("total" >= 0),
    CONSTRAINT "CafeOrder_tableNumber_check" CHECK ("tableNumber" IS NULL OR "tableNumber" BETWEEN 1 AND 999)
);

CREATE TABLE "OrderLine" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "menuItemId" UUID,
    "itemNames" JSONB NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderLine_values_check" CHECK ("unitPrice" >= 0 AND "quantity" BETWEEN 1 AND 99 AND "lineTotal" = "unitPrice" * "quantity")
);

CREATE TABLE "Reservation" (
    "id" UUID NOT NULL,
    "customerName" VARCHAR(80) NOT NULL,
    "phone" VARCHAR(24) NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "specialRequests" VARCHAR(400),
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Reservation_guestCount_check" CHECK ("guestCount" BETWEEN 1 AND 8)
);

CREATE TABLE "GalleryImage" (
    "id" UUID NOT NULL,
    "imageUrl" VARCHAR(2048) NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "captions" JSONB NOT NULL,
    "altTexts" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteContent" (
    "id" UUID NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromotionalBanner" (
    "id" UUID NOT NULL,
    "titles" JSONB NOT NULL,
    "messages" JSONB NOT NULL,
    "imageUrl" VARCHAR(2048),
    "linkUrl" VARCHAR(2048),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromotionalBanner_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PromotionalBanner_schedule_check" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" < "endsAt")
);

CREATE UNIQUE INDEX "MenuCategory_slug_key" ON "MenuCategory"("slug");
CREATE INDEX "MenuCategory_active_sortOrder_idx" ON "MenuCategory"("active", "sortOrder");
CREATE UNIQUE INDEX "MenuItem_slug_key" ON "MenuItem"("slug");
CREATE INDEX "MenuItem_categoryId_active_sortOrder_idx" ON "MenuItem"("categoryId", "active", "sortOrder");
CREATE INDEX "MenuItem_active_isPopular_idx" ON "MenuItem"("active", "isPopular");
CREATE INDEX "CafeOrder_status_createdAt_idx" ON "CafeOrder"("status", "createdAt" DESC);
CREATE INDEX "CafeOrder_createdAt_idx" ON "CafeOrder"("createdAt" DESC);
CREATE INDEX "Reservation_status_dateTime_idx" ON "Reservation"("status", "dateTime");
CREATE INDEX "GalleryImage_active_category_sortOrder_idx" ON "GalleryImage"("active", "category", "sortOrder");
CREATE UNIQUE INDEX "SiteContent_key_key" ON "SiteContent"("key");
CREATE INDEX "PromotionalBanner_active_sortOrder_idx" ON "PromotionalBanner"("active", "sortOrder");

ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CafeOrder" ADD CONSTRAINT "CafeOrder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "CafeOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_menuItemId_fkey"
    FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
