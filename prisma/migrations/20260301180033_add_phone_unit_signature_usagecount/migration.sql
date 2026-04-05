-- AlterTable
ALTER TABLE "CompanySetting" ADD COLUMN "signatureImage" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "phone" TEXT;

-- AlterTable
ALTER TABLE "DocumentItem" ADD COLUMN "unit" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("id", "name", "price", "updatedAt") SELECT "id", "name", "price", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
