import pino from "pino"
import fs from "fs"
import path from "path"

const logsDir = path.join(process.cwd(), "logs")

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir)
}

export const logger = pino(
  {
    level: "info",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination(path.join(logsDir, "access.log"))
)

export const logError = pino(
  {
    level: "error",
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.destination(path.join(logsDir, "errors.log"))
)
