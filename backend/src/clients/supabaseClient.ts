import { createClient } from '@supabase/supabase-js';
import { env } from '../configs/supabase_env';
import { Database } from './database.types';

export const supabaseClient = createClient<Database>(env.supabaseUrl, env.supabaseKey, {
  auth: {
    // It's recommended to disable auto-refreshing tokens for server-side clients
    // as they typically use the service role key which doesn't expire.
    autoRefreshToken: false,
    persistSession: false
  }
});
