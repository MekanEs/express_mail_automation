import { Provider, ProviderConfigsType } from '../types/types';
const ProviderConfigs: ProviderConfigsType = {
  yahoo: { host: 'imap.mail.yahoo.com', /* mailboxes: ['INBOX'], spam: ['Bulk'], */ smtpHost: 'smtp.mail.yahoo.com' },
  yandex: { host: 'imap.yandex.com', /* mailboxes: ['INBOX'], spam: ['Spam'], */ smtpHost: 'smtp.yandex.ru' },
  mailru: {
    host: 'imap.mail.ru',
    // mailboxes: ['INBOX', 'INBOX/Newsletters', 'INBOX/News'], // Удалено
    // spam: ['Спам'], // Удалено
    smtpHost: 'smtp.mail.ru'
  },
  google: { host: 'imap.gmail.com', /* mailboxes: ['[Gmail]/Вся почта', '[Gmail]/All Mail'], spam: ['[Gmail]/Спам', '[Gmail]/Spam'], */ smtpHost: 'smtp.gmail.com' },
  rambler: { host: 'imap.rambler.ru', /* mailboxes: ['INBOX'], spam: ['Spam'], */ smtpHost: 'smtp.rambler.ru' }
};
export const getConfig = (provider: Provider) => {
  return ProviderConfigs[provider];
};
