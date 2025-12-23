import { logger, logError } from "../utils/logger.js";

export const auditLog = async ({
  acao,
  usuarioId = null,
  ip = null,
  userAgent = null,
  meta = null,
}) => {
  try {
    // Sem schema/model de auditoria no Prisma: log em arquivo (pino)
    logger.info({ acao, usuarioId, ip, userAgent, meta });
  } catch (e) {
    // não quebra o fluxo por falha de auditoria
    try {
      logError.error("Erro ao registrar auditoria", e);
    } catch {}
  }
};
