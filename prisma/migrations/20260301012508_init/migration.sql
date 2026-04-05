-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phoneNumber" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompanySetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyName" TEXT,
    "address" TEXT,
    "taxId" TEXT,
    "phone" TEXT,
    "logoText" TEXT DEFAULT 'RD',
    "logoImage" TEXT,
    "bankName" TEXT DEFAULT 'kbank',
    "customBankName" TEXT,
    "customBankLogo" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "condQT" TEXT,
    "condSO" TEXT,
    "condDO" TEXT,
    "condIV" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "no" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "customer" TEXT,
    "customerAddress" TEXT,
    "customerTaxId" TEXT,
    "vatType" TEXT NOT NULL DEFAULT 'none',
    "discountType" TEXT NOT NULL DEFAULT 'amount',
    "discountValue" REAL NOT NULL DEFAULT 0,
    "whtRate" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ร่าง',
    "refNo" TEXT,
    "poNumber" TEXT,
    "hidePrice" BOOLEAN NOT NULL DEFAULT false,
    "deliveryDate" DATETIME,
    "deliveryMethod" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DocumentItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "documentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "qty" REAL NOT NULL DEFAULT 1,
    "price" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "DocumentItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Document_no_key" ON "Document"("no");
