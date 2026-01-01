-- AlterTable
ALTER TABLE `Usuario` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `emailVerificado` BOOLEAN NOT NULL DEFAULT false;
