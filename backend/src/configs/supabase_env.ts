import dotenv from 'dotenv';
dotenv.config();

export const env = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_KEY!,
  supabaseSchema: process.env.SUPABASE_SCHEMA || 'public'
};
