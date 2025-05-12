import { logger } from "../../utils/logger";

export const getAccessToken = async (refresh_token: string, provider: string) => {
  if (provider === 'google') {
    logger.info(`обновляем токен для google`)
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      return;
    }

    const params = new URLSearchParams();
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);
    params.append('refresh_token', refresh_token);
    params.append('grant_type', 'refresh_token');

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch Google access token: ${error}`);
    }

    const data: { access_token: string } = await res.json();
    return data.access_token;
  }
  else if (provider === 'mailru') {
    logger.info('refresh token for mailru')
    const client_id = process.env.MAILRU_CLIENT_ID;
    const client_secret = process.env.MAILRU_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      return;
    }

    const params = new URLSearchParams();
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);
    params.append('refresh_token', refresh_token);
    params.append('grant_type', 'refresh_token');
    const res = await fetch('https://oauth.mail.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch Mail.ru access token: ${error}`);
    }

    const data: { access_token: string } = await res.json();
    return data.access_token;
  }

  throw new Error(`Unsupported provider: ${provider}`);
};
