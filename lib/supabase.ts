import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// MMKV é nativo — não existe em Node.js (SSR/web build da Vercel).
// No web, deixa o supabase-js usar o adapter padrão (localStorage).
function buildAuthStorage() {
  if (Platform.OS === 'web') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const store = new MMKV({ id: 'supabase-auth' });
  return {
    getItem: (key: string) => store.getString(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  };
}

// Retorna um cliente inerte durante SSR (sem URL), evitando crash no build web.
function buildClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false },
    });
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: buildAuthStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  });
}

export const supabase = buildClient();
