export type account = {
  access_token: string | null;
  app_password: string | null;
  email: string | null;
  expires_at: number | null;
  id: string;
  is_token: boolean;
  provider: string | null;
  refresh_token: string | null;
  updated_at: string | null;
  user_id: string;
  isSelected?: boolean;
};
export type accounts = account[];
export type from_email = { created_at: string; email: string; id: number };
