import { Platform } from 'react-native';

function store() {
  if (Platform.OS === 'web') return null;
  const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  return new MMKV({ id: 'app-settings' });
}

const KEY = 'biometric-lock-enabled';

export function isBiometricLockEnabled(): boolean {
  return store()?.getBoolean(KEY) ?? false;
}

export function setBiometricLockEnabled(value: boolean): void {
  store()?.set(KEY, value);
}
