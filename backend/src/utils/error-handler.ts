import { logger } from "./logger"

export const handleError = (err: unknown, message?: string, functionName?: string) => {
  if (err instanceof Error) {
    logger.error(sliceAndAddDots(err.name), sliceAndAddDots(message), functionName)
  } else {
    logger.error('Неизвестная ошибка', functionName, message, err)
  }
}
const sliceAndAddDots = (str: string | undefined) => {

  if (str && str.length > 200) {
    return str.slice(0, 200) + '...'
  } else {
    return str
  }
}
