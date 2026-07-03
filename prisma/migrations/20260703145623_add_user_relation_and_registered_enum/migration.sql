/*
  Warnings:

  - Added the required column `userID` to the `Issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registered` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `issue` ADD COLUMN `userID` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `registered` ENUM('CREDENTIALS', 'GOOGLE_OAUTH') NOT NULL,
    ADD COLUMN `role` ENUM('SUPERADMIN', 'USER', 'MANAGER') NOT NULL DEFAULT 'USER';

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
