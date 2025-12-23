import { logger, logError } from "../utils/logger.js";

export const auditLog = async ({
  acao,
  usuarioId = null,
  ip = null,
  userAgent = null,
  meta = null,
}) => {
  try {
    // O schema.prisma atual não possui modelo de auditoria.
    // Para manter consistência com o schema, registramos auditoria apenas em log.
    logger.info({ acao, usuarioId, ip, userAgent, meta }, "[audit]");
  } catch (err) {
    // não quebra o fluxo de auth por falha de auditoria
    logError.error("Falha ao registrar auditoria", err);
  }
};
