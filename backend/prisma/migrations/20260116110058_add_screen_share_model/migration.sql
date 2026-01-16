-- CreateTable
CREATE TABLE "screen_shares" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "sharedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screen_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "screen_shares_shareToken_key" ON "screen_shares"("shareToken");

-- AddForeignKey
ALTER TABLE "screen_shares" ADD CONSTRAINT "screen_shares_sharedBy_fkey" FOREIGN KEY ("sharedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
