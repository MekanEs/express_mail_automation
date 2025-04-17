export const sanitizeOptions = {
  allowedTags: [
    'b',
    'i',
    'em',
    'strong',
    'a',
    'p',
    'div',
    'span',
    'img',
    'table',
    'tr',
    'td',
    'body'
  ],
  allowedAttributes: {
    a: ['href'],
    img: ['src'],
    '*': ['class', 'style']
  },
  allowedSchemes: ['http', 'https', 'ftp', 'mailto']
};
