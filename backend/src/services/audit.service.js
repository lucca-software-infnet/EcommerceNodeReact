import { prisma } from "../config/prisma.js";
import { logger, logError } from "../utils/logger.js";

export const auditLog = async ({
  acao,
  usuarioId = null,
  ip = null,
  userAgent = null,
  meta = null,
}) => {
  try {
    // auditoria em BD (principal)
    await prisma.auditLog.create({
      data: {
        acao,
        usuarioId,
        ip,
        userAgent,
        meta,
      },
    });
  } catch (err) {
    // fallback em arquivo
    try {
      logger.info({ acao, usuarioId, ip, userAgent, meta });
    } catch (e) {
      logError.error("Erro ao registrar auditoria", e);
    }

    // não quebra o fluxo de auth por falha de auditoria
    logError.error("Falha ao salvar auditoria no Prisma", err);
  }
};
