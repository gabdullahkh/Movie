import { createClient } from '@supabase/supabase-js';

// Supabase publishable key: this is intended for browser use.
export const supabase = createClient('https://wdezottacdblvhmzbizu.supabase.co', "sb_publishable_jYOyGLt3_auoqrFvMT62vA_TSq0QNEe", { auth: { persistSession: true, autoRefreshToken: true } });
