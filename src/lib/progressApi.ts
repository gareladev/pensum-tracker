import type { ProgressMap } from '../types';
import { supabase } from './supabase';

const TABLE = 'user_progress';

export async function saveProgressToCloud(userId: string, data: ProgressMap): Promise<{ error: Error | null }> {
  if (!supabase) return { error: new Error('Supabase no configurado') };
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      { user_id: userId, data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  return { error: error ?? null };
}

export async function loadProgressFromCloud(userId: string): Promise<{ data: ProgressMap | null; error: Error | null }> {
  if (!supabase) return { data: null, error: new Error('Supabase no configurado') };
  const { data: row, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { data: null, error };
  const map = row?.data;
  if (map && typeof map === 'object' && !Array.isArray(map)) {
    return { data: map as ProgressMap, error: null };
  }
  return { data: {}, error: null };
}
