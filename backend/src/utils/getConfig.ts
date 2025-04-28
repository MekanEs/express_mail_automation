import { Provider, ProviderConfigsType } from '../types/types';
const ProviderConfigs: ProviderConfigsType = {
  yahoo: { host: 'imap.mail.yahoo.com', mailboxes: ['INBOX'], spam: ['Bulk'] },
  yandex: { host: 'imap.yandex.com', mailboxes: ['INBOX'], spam: ['Spam'] },
  mailru: {
    host: 'imap.mail.ru',
    mailboxes: ['INBOX', 'INBOX/Newsletters', 'INBOX/News'],
    spam: ['Спам']
  },
  google: { host: 'imap.gmail.com', mailboxes: ['[Gmail]/Вся почта', '[Gmail]/All Mail'], spam: ['[Gmail]/Спам', '[Gmail]/Spam'] },
  rambler: { host: 'imap.rambler.ru', mailboxes: ['INBOX'], spam: ['Spam'] }
};
export const getConfig = (provider: Provider) => {
  return ProviderConfigs[provider];
};
