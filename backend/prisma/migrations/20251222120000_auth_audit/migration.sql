-- Add auth fields to Usuario
ALTER TABLE `Usuario`
  ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `ativadoEm` DATETIME(3) NULL,
  ADD COLUMN `tokenAtivacaoHash` VARCHAR(191) NULL,
  ADD COLUMN `tokenAtivacaoExpiraEm` DATETIME(3) NULL,
  ADD COLUMN `resetPasswordTokenHash` VARCHAR(191) NULL,
  ADD COLUMN `resetPasswordExpiraEm` DATETIME(3) NULL,
  ADD COLUMN `ultimoLoginEm` DATETIME(3) NULL,
  ADD COLUMN `ultimoLoginIp` VARCHAR(191) NULL,
  ADD COLUMN `ultimoLoginUserAgent` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `AuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `acao` VARCHAR(191) NOT NULL,
  `usuarioId` INTEGER NULL,
  `ip` VARCHAR(191) NULL,
  `userAgent` VARCHAR(191) NULL,
  `meta` JSON NULL,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `AuditLog_usuarioId_criadoEm_idx` (`usuarioId`, `criadoEm`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_usuarioId_fkey`
  FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

