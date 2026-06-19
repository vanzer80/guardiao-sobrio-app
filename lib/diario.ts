import { supabase } from './supabase';
import { todayISO } from './sobriety';
import type { Tables } from './database.types';

export type DiaryEntry = Tables<'diary_entries'>;
export const MIN_CHARS = 50;

export async function loadEntryToday(userId: string): Promise<DiaryEntry | null> {
  const { data } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', todayISO())
    .maybeSingle();
  return data ?? null;
}

export async function saveEntryToday(
  userId: string,
  text: string,
): Promise<{ error: string | null }> {
  if (text.trim().length < MIN_CHARS) {
    return { error: `Mínimo ${MIN_CHARS} caracteres para salvar.` };
  }

  const { error } = await supabase.from('diary_entries').upsert(
    {
      user_id: userId,
      entry_date: todayISO(),
      content: { text: text.trim() },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,entry_date' },
  );

  return { error: error?.message ?? null };
}

export function extractText(entry: DiaryEntry | null): string {
  if (!entry) return '';
  const c = entry.content;
  if (typeof c === 'object' && c !== null && 'text' in c) return String((c as { text: string }).text);
  return '';
}
