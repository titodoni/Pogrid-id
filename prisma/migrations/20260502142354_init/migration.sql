-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PO" (
    "id" TEXT NOT NULL,
    "po_internal_number" TEXT NOT NULL,
    "po_client_number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "urgency_flag" TEXT NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "work_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFTING',
    "drawing_approved" BOOLEAN NOT NULL DEFAULT false,
    "drawing_revision" INTEGER NOT NULL DEFAULT 0,
    "purchasing_progress" INTEGER NOT NULL DEFAULT 0,
    "is_rework" BOOLEAN NOT NULL DEFAULT false,
    "rework_type" TEXT,
    "rework_reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ORIGINAL',
    "parentItemId" TEXT,
    "invoice_status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoiced_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "drafting_started_at" TIMESTAMP(3),
    "purchasing_started_at" TIMESTAMP(3),
    "production_started_at" TIMESTAMP(3),
    "qc_started_at" TIMESTAMP(3),
    "delivery_started_at" TIMESTAMP(3),
    "done_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemProgress" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'OPERATOR',
    "note" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution_note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "itemId" TEXT,
    "poId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "itemId" TEXT,
    "poId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoSequence" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PoSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "clientName" TEXT NOT NULL DEFAULT 'POgrid Client',
    "brandColor" TEXT NOT NULL DEFAULT '#14b8a6',
    "brandColorDark" TEXT NOT NULL DEFAULT '#0d9488',
    "logoUrl" TEXT,
    "poPrefix" TEXT NOT NULL DEFAULT 'PO-[YYYY]-[SEQ]',
    "adminWaNumber" TEXT,
    "flagThreshold1" INTEGER NOT NULL DEFAULT 7,
    "flagThreshold2" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PO_po_internal_number_key" ON "PO"("po_internal_number");

-- CreateIndex
CREATE UNIQUE INDEX "ItemProgress_itemId_departmentId_key" ON "ItemProgress"("itemId", "departmentId");

-- AddForeignKey
ALTER TABLE "PO" ADD CONSTRAINT "PO_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemProgress" ADD CONSTRAINT "ItemProgress_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemProgress" ADD CONSTRAINT "ItemProgress_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
