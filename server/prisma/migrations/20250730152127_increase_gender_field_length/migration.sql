/*
  Warnings:

  - The primary key for the `conversations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `avatar` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `conversations` table. All the data in the column will be lost.
  - The `id` column on the `conversations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `type` on the `conversations` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isOnline` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastSeen` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `password` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the `conversation_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_reactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `gender` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "conversation_users" DROP CONSTRAINT "conversation_users_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "conversation_users" DROP CONSTRAINT "conversation_users_userId_fkey";

-- DropForeignKey
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_messageId_fkey";

-- DropForeignKey
ALTER TABLE "message_reactions" DROP CONSTRAINT "message_reactions_userId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- AlterTable
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_pkey",
DROP COLUMN "avatar",
DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "type" SET DATA TYPE VARCHAR(20),
ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "avatar",
DROP COLUMN "createdAt",
DROP COLUMN "isOnline",
DROP COLUMN "lastSeen",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gender" VARCHAR(20) NOT NULL,
ADD COLUMN     "is_verified" BOOLEAN DEFAULT false,
ADD COLUMN     "last_login" TIMESTAMP(6),
ADD COLUMN     "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "username" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255),
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "conversation_users";

-- DropTable
DROP TABLE "message_reactions";

-- DropTable
DROP TABLE "messages";

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER,
    "user_id" INTEGER,
    "joined_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(6),

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_conversation_participants_conversation_id" ON "conversation_participants"("conversation_id");

-- CreateIndex
CREATE INDEX "idx_conversation_participants_user_id" ON "conversation_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversation_id_user_id_key" ON "conversation_participants"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_username" ON "users"("username");

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
