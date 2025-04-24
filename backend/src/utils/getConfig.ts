export const getConfig = (provider: string) => {
  if (provider === 'yahoo') {
    return { host: 'imap.mail.yahoo.com', mailboxes: ['INBOX'],spam: ['Bulk'] };
  }
  if (provider === 'yandex') { 
    return { host: 'imap.yandex.com', mailboxes: ['INBOX'] ,spam: ['Spam']};
  }
  if (provider === 'mailru') {
    return { host: 'imap.mail.ru', mailboxes: ['INBOX', 'INBOX/Newsletters', 'INBOX/News'],spam: ['Спам'] };
  }
  if (provider === 'google') {
    return { host: 'imap.gmail.com', mailboxes: ['[Gmail]/Вся почта'],spam: ['[Gmail]/Спам'] };
  }
  if (provider === 'rambler') {
    return { host: 'imap.rambler.ru', mailboxes: ['INBOX'],spam: ['Spam'] };
  }
};
