import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('Supabase no configurado: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env');
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = Boolean(supabase);
