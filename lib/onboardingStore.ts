import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';

export interface OnboardingDraft {
  motivo?: string;
  tempo?: string;
  desafio?: string;
}

const KEY = 'onboarding_context';
let _store: MMKV | null = null;

// MMKV é nativo. Na web, o draft não é persistido — aceitável porque no web
// o app não é destruído entre telas da mesma sessão.
function getStore(): MMKV | null {
  if (Platform.OS === 'web') return null;
  if (!_store) _store = new MMKV({ id: 'onboarding' });
  return _store;
}

export function saveOnboardingDraft(draft: OnboardingDraft): void {
  const store = getStore();
  if (!store) return;
  const current = readOnboardingDraft();
  store.set(KEY, JSON.stringify({ ...current, ...draft }));
}

export function readOnboardingDraft(): OnboardingDraft {
  const store = getStore();
  if (!store) return {};
  try {
    const raw = store.getString(KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
  } catch {
    return {};
  }
}

export function clearOnboardingDraft(): void {
  getStore()?.delete(KEY);
}
