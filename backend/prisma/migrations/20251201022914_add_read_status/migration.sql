-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isRead" BOOLEAN DEFAULT false,
ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Message_isRead_idx" ON "Message"("isRead");
