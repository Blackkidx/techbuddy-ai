/*
  Warnings:

  - The `status` column on the `friendships` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `ai_prediction` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `confidence_score` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `feedback_type` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `is_correct` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `message_id` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `original_text` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `retrained_at` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `used_for_training` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `user_correction` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_feedback` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `team` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `intents` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `language` on table `messages` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `aiPrediction` to the `user_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feedbackType` to the `user_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isCorrect` to the `user_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalText` to the `user_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userCorrection` to the `user_feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `user_feedback` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "user_feedback" DROP CONSTRAINT "user_feedback_message_id_fkey";

-- DropForeignKey
ALTER TABLE "user_feedback" DROP CONSTRAINT "user_feedback_user_id_fkey";

-- DropIndex
DROP INDEX "messages_createdAt_idx";

-- DropIndex
DROP INDEX "messages_senderId_receiverId_idx";

-- DropIndex
DROP INDEX "user_feedback_feedback_type_idx";

-- DropIndex
DROP INDEX "user_feedback_used_for_training_idx";

-- DropIndex
DROP INDEX "user_feedback_user_id_idx";

-- AlterTable
ALTER TABLE "friendships" DROP COLUMN "status",
ADD COLUMN     "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "language" SET NOT NULL,
ALTER COLUMN "language" SET DEFAULT 'en';

-- AlterTable
ALTER TABLE "user_feedback" DROP COLUMN "ai_prediction",
DROP COLUMN "confidence_score",
DROP COLUMN "created_at",
DROP COLUMN "feedback_type",
DROP COLUMN "is_correct",
DROP COLUMN "message_id",
DROP COLUMN "original_text",
DROP COLUMN "retrained_at",
DROP COLUMN "used_for_training",
DROP COLUMN "user_correction",
DROP COLUMN "user_id",
ADD COLUMN     "aiPrediction" TEXT NOT NULL,
ADD COLUMN     "confidenceScore" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "feedbackType" TEXT NOT NULL,
ADD COLUMN     "isCorrect" BOOLEAN NOT NULL,
ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "originalText" TEXT NOT NULL,
ADD COLUMN     "retrainedAt" TIMESTAMP(3),
ADD COLUMN     "usedForTraining" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userCorrection" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "bio",
DROP COLUMN "role",
DROP COLUMN "team",
ALTER COLUMN "learningLanguage" SET DEFAULT 'Japanese';

-- DropTable
DROP TABLE "intents";

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_receiverId_idx" ON "messages"("receiverId");

-- AddForeignKey
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
