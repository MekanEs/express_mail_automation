export const getYahooAccessToken = async (refresh_token: string) => {
  const client_id = process.env.YAHOO_CLIENT_ID;
  const client_secret = process.env.YAHOO_CLIENT_SECRET;
  const redirect_uri = process.env.YAHOO_REDIRECT_URI;

  if (!client_id || !client_secret || !redirect_uri) {
    return;
  }

  const params = new URLSearchParams();
  params.append('client_id', client_id);
  params.append('client_secret', client_secret);
  params.append('redirect_uri', redirect_uri);
  params.append('refresh_token', refresh_token);
  params.append('grant_type', 'refresh_token');

  const authHeader = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  const res = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch Yahoo access token: ${error}`);
  }

  const data: { access_token: string } = await res.json();
  console.log('😀', data);
  return data.access_token; // можно также вернуть expires_in и token_type при необходимости
};
