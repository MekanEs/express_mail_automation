import { logger } from "./logger"

export const handleError = (err: unknown, message?: string, functionName?: string) => {
  if (err instanceof Error) {
    logger.error(err.message, message, functionName)
  } else {
    logger.error('Unknown error', functionName, message, err)
  }
}
