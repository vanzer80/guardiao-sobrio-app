import { useEffect, useRef } from 'react';
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
  // Evita dupla troca em re-renders / React Strict Mode.
  const attempted = useRef(false);

  useEffect(() => {
    if (authError) {
      console.error('[OAuth callback] erro do provider:', authError, error_description);
      router.replace('/(auth)/login');
      return;
    }
    // undefined significa que os params ainda não foram hidratados no web —
    // aguarda o próximo re-render em vez de redirecionar prematuramente.
    if (code === undefined) return;
    if (!code) {
      console.error('[OAuth callback] code ausente na URL');
      router.replace('/(auth)/login');
      return;
    }
    if (attempted.current) return;
    attempted.current = true;

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('[OAuth callback] exchange falhou:', error.message);
        router.replace('/(auth)/login');
      }
      // Sessão estabelecida — onAuthStateChange em _layout.tsx dispara e o
      // guard redireciona para /(tabs) ou /(auth)/setup conforme o perfil.
    });
  }, [code, authError, error_description, router]);

  // Fallback: se o code nunca chegar (e.g. navegação direta sem params), redireciona.
  useEffect(() => {
    const id = setTimeout(() => {
      if (!attempted.current) {
        console.error('[OAuth callback] timeout — code não disponível após 10s');
        router.replace('/(auth)/login');
      }
    }, 10_000);
    return () => clearTimeout(id);
  }, [router]);

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
