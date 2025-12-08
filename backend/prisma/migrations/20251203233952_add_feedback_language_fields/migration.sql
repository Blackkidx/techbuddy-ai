-- AlterTable
ALTER TABLE "UserFeedback" ADD COLUMN     "retrainedAt" TIMESTAMP(3),
ADD COLUMN     "sourceLanguage" TEXT,
ADD COLUMN     "targetLanguage" TEXT,
ADD COLUMN     "usedForTraining" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "messageId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "UserFeedback_usedForTraining_idx" ON "UserFeedback"("usedForTraining");

-- CreateIndex
CREATE INDEX "UserFeedback_sourceLanguage_idx" ON "UserFeedback"("sourceLanguage");

-- CreateIndex
CREATE INDEX "UserFeedback_targetLanguage_idx" ON "UserFeedback"("targetLanguage");
