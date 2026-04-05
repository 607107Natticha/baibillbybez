-- AlterTable
ALTER TABLE "CompanySetting" ADD COLUMN "companyNameEn" TEXT;
ALTER TABLE "CompanySetting" ADD COLUMN "country" TEXT DEFAULT 'ไทย';
ALTER TABLE "CompanySetting" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "CompanySetting" ADD COLUMN "templateLayout" TEXT DEFAULT 'classic';
ALTER TABLE "CompanySetting" ADD COLUMN "templateTheme" TEXT DEFAULT 'blue';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "pinHash" TEXT NOT NULL,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "id", "phoneNumber", "pinHash", "updatedAt") SELECT "createdAt", "id", "phoneNumber", "pinHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
