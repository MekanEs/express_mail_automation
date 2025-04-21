import { ImapFlowOptions } from 'imapflow';

export function createImapConfig({
  user,
  host,
  password,
  token
}: {
  user: string;
  host: string;
  password?: string;
  token?: string;
}): ImapFlowOptions {
  let authConfig: ImapFlowOptions['auth'] & { loginMethod?: string; method?: string } = {
    user: user,
    pass: password
  };

  if (password !== undefined && !token) {
    // Password-based authentication
    authConfig = {
      user: user,
      pass: password,
      loginMethod: 'AUTH=PLAIN'
    };
  } else if (token !== undefined) {
    // OAuth2 token-based authentication
    authConfig = {
      user: user,
      accessToken: token
    };
  }

  const config: ImapFlowOptions = {
    host,
    port: 993,
    secure: true,
    logger: false,
    auth: authConfig
  };

  return config;
}
