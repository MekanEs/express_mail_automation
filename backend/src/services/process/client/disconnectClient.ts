import { ImapFlow } from "imapflow";
import { logger } from "../../../utils/logger";

export async function disconnectClient(client: ImapFlow) {
    try {
      if (client.usable) {
        await client.logout();
        logger.info('Выход из IMAP клиента выполнен.');
      } else {
        logger.info('IMAP клиент уже вышел из системы или недоступен.');
      }
    } catch (logoutErr) {
      logger.error('Ошибка при выходе из IMAP клиента:', logoutErr);
    }
  }