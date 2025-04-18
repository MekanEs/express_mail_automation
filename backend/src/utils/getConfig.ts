export const getConfig = (provider: string) => {
  if (provider === 'yahoo') {
    return { host: 'imap.mail.yahoo.com', mailboxes: ['INBOX'] };
  }
  if (provider === 'yandex') {
    return { host: 'imap.yandex.com', mailboxes: ['INBOX'] };
  }
  if (provider === 'mailru') {
    return { host: 'imap.mail.ru', mailboxes: ['INBOX', 'INBOX/Newsletters', 'INBOX/News'] };
  }
  if (provider === 'google') {
    return { host: 'imap.gmail.com', mailboxes: ['[Gmail]/Вся почта'] };
  }
};
