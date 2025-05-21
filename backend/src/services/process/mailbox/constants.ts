import { Provider } from "../../../types/types";
import { MailboxType } from "./mailboxDiscovery.service";

export const COMMON_MAILBOX_NAMES: Record<MailboxType, string[]> = {
  inbox: ['INBOX'],
  sent: ['Sent', 'Sent Items', 'Отправленные', 'SentBox'],
  drafts: ['Drafts', 'Draft', 'Черновики', 'DraftBox'],
  trash: ['Trash', 'Deleted Items', 'Корзина', 'Bin'],
  archive: ['Archive', 'Архив'],
  spam: ['Spam', 'Junk', 'Спам', 'Bulk Mail', 'Bulk'],
  newsletters: ['Newsletters', 'News', 'Рассылки', 'Новости', 'Subscriptions', 'Mailing Lists', 'INBOX/Newsletters', 'INBOX/News', 'INBOX/Рассылки'],
};

export const PROVIDER_SPECIFIC_MAILBOX_NAMES: Record<Provider, Partial<Record<MailboxType, string[]>>> = {
  google: {
    inbox: ['[Gmail]/All Mail', '[Gmail]/Вся почта', 'INBOX'],
    sent: ['[Gmail]/Sent Mail', '[Gmail]/Отправленные'],
    drafts: ['[Gmail]/Drafts', '[Gmail]/Черновики'],
    trash: ['[Gmail]/Trash', '[Gmail]/Bin', '[Gmail]/Корзина'],
    archive: ['[Gmail]/Archive', '[Gmail]/Архив', '[Gmail]/All Mail'],
    spam: ['[Gmail]/Spam', '[Gmail]/Спам'],
  },
  mailru: {
    spam: ['Спам'],
    newsletters: ['INBOX/Newsletters', 'INBOX/News'],
  },
  yandex: {
    spam: ['Spam'],
  },
  yahoo: {
  },
  rambler: {
    spam: ['Spam'],
  }
};
