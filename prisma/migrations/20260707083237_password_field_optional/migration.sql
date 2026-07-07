-- DropForeignKey
ALTER TABLE `issue` DROP FOREIGN KEY `Issue_userID_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `resetToken` VARCHAR(191) NULL,
    ADD COLUMN `tokenExpireAt` DATETIME(3) NULL,
    MODIFY `password` VARCHAR(255) NULL;

-- AddForeignKey
ALTER TABLE `issue` ADD CONSTRAINT `issue_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `issue` RENAME INDEX `Issue_userID_fkey` TO `issue_userID_fkey`;
