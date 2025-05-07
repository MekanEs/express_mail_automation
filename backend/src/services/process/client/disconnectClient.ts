import { ImapFlow } from "imapflow";
import { logger } from "../../../utils/logger";

export async function disconnectClient(client: ImapFlow) {
    try {
      if (client.usable) {
        await client.logout();
        logger.info('IMAP client logout completed.');
      } else {
        logger.info('IMAP client already logged out or unusable.');
      }
    } catch (logoutErr) {
      logger.error('Error during IMAP client logout:', logoutErr);
    }
  }