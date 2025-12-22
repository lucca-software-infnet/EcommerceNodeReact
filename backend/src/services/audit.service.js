import { logger, logError } from "../utils/logger.js"

export const auditLog = (action, userId = null, meta = {}) => {
  try {
    logger.info({
      action,
      userId,
      meta,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    logError.error("Erro ao registrar auditoria", err)
  }
}
