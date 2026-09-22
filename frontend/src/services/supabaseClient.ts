/**
 * Supabase Client Initializer for Career Compass AI
 * Provides authenticated client for real Auth, Session state, and Row-Level Security.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvptbsolhdycbnaizjlf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn(
    '⚠️ [Career Compass AI] VITE_SUPABASE_ANON_KEY is not defined in frontend/.env. Supabase Auth operations will be limited.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'career_compass_supabase_auth_token',
  },
});

