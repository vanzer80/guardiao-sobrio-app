import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { code, error: authError, error_description } = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    if (authError) {
      console.error('[OAuth callback]', authError, error_description);
      router.replace('/(auth)/login');
      return;
    }
    if (!code) {
      router.replace('/(auth)/login');
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('[OAuth callback] exchange failed:', error.message);
        router.replace('/(auth)/login');
        return;
      }
      // Sessão estabelecida — onAuthStateChange em _layout.tsx dispara e o
      // guard redireciona para /(tabs) ou /(auth)/setup conforme o perfil.
    });
  }, [code, authError, error_description, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.bg,
        gap: 16,
      }}
    >
      <ActivityIndicator color={Colors.gold} size="large" />
      <Text style={{ color: Colors.muted, fontSize: 14 }}>Autenticando…</Text>
    </View>
  );
}
