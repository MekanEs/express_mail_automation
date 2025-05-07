export const getAccessToken = async (refresh_token: string) => {
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

    throw new Error(`Failed to fetch access token: ${error}`);
  }

  const data: { access_token: string } = await res.json();

  return data.access_token; // можно также взять data.expires_in
};
