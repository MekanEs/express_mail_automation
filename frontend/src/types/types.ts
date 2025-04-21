export type account = {
  access_token: string | null
  app_password: string | null
  email: string | null
  expires_at: number | null
  id: string
  is_token: boolean
  provider: string | null
  refresh_token: string | null
  updated_at: string | null
  user_id: string
  isSelected?: boolean
}
export type accounts = account[]
export type from_email = { created_at: string, email: string, id: number }
export type report = {
  account: string | null
  created_at: string | null
  emails_errorMessages: string[] | null
  emails_errors: number | null
  emails_found: number | null
  emails_processed: number | null
  id: string
  inbox: string | null
  links_attemptedOpen: number | null
  links_errorMessages: string[] | null
  links_errors: number | null
  links_found: number | null
  links_targetOpen: number | null
  process_id: string | null
  sender: string | null
  status: string | null
}
