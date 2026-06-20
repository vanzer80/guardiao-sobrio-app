import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View, Text, Pressable } from 'react-native';
import { AnonymousExpiredModal } from '@/components/AnonymousExpiredModal';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as LocalAuthentication from 'expo-local-authentication';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useProfileStore } from '@/hooks/useProfileStore';
import { usePlanStore } from '@/hooks/usePlanStore';
import { isBiometricLockEnabled } from '@/lib/appLock';
import { PlanType } from '@/lib/types.monetization';
import { Colors } from '@/constants/Colors';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond: CormorantGaramond_400Regular,
    'CormorantGaramond-Italic': CormorantGaramond_400Regular_Italic,
    'CormorantGaramond-SemiBold': CormorantGaramond_600SemiBold,
    'CormorantGaramond-SemiBoldItalic': CormorantGaramond_600SemiBold_Italic,
    JetBrainsMono: JetBrainsMono_400Regular,
    'JetBrainsMono-SemiBold': JetBrainsMono_600SemiBold,
  });
  // Na web, o SSR gera HTML sem sessão; o cliente redireciona para login após mount.
  // Renderizamos null até o cliente estar hidratado para evitar o erro React #418.
  // Na web, o SSR gera HTML sem sessão; o cliente redireciona após mount.
  // Usamos setTimeout 0 (async do ponto de vista do lint) para satisfazer
  // react-hooks/set-state-in-effect e ainda garantir o guard de hidratação.
  const [locked, setLocked] = useState(false);
  const [anonymousExpired, setAnonymousExpired] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (next) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = next;
      if (next === 'active' && wasBackground && isBiometricLockEnabled()) {
        setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const unlock = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloqueie o Guardião',
      cancelLabel: 'Cancelar',
    });
    if (result.success) setLocked(false);
  };

  const [hydrated, setHydrated] = useState(Platform.OS !== 'web');
  useEffect(() => {
    if (hydrated) return;
    const t = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(t);
  }, [hydrated]);

  const { session, isLoading, setSession, setLoading } = useAuthStore();
  const {
    profile,
    isLoading: profileLoading,
    setProfile,
    setLoading: setProfileLoading,
  } = useProfileStore();
  const setPlan = usePlanStore((s) => s.setPlan);
  const setTrialEnd = usePlanStore((s) => s.setTrialEnd);
  const setTrialActivatedAt = usePlanStore((s) => s.setTrialActivatedAt);
  const router = useRouter();
  const segments = useSegments();

  const userId = session?.user.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setLoading]);

  // Carrega o profile sempre que a sessão mudar — fonte única para o guard.
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        if (data?.plan) setPlan(data.plan as PlanType);
        setTrialEnd(data?.trial_end ?? null);
        setTrialActivatedAt(data?.trial_activated_at ?? null);
        setProfileLoading(false);

        if (data?.is_anonymous && data?.anonymous_created_at) {
          const created = new Date(data.anonymous_created_at).getTime();
          const expired = Date.now() > created + 5 * 24 * 60 * 60 * 1000;
          if (expired) setAnonymousExpired(true);
        } else {
          setAnonymousExpired(false);
        }
      });
  }, [userId, setProfile, setProfileLoading, setPlan, setTrialEnd, setTrialActivatedAt]);

  useEffect(() => {
    if (isLoading) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';
    // setup = tela de detalhes de perfil (nome, data, substância) pós-cadastro
    const isSetup = segs[1] === 'setup';
    // ativacao = tela de celebração exibida APÓS o setup; não redirecionar para tabs ainda
    const isAtivacao = segs[1] === 'ativacao';
    // convert = tela de criação de conta para usuário anônimo; não redirecionar para tabs
    const isConvert = segs[1] === 'convert';

    if (!session) {
      SplashScreen.hideAsync();
      if (!inAuthGroup) router.replace('/(auth)/welcome');
      return;
    }

    // Com sessão, espera o profile carregar para decidir setup x tabs.
    if (profileLoading) return;
    SplashScreen.hideAsync();

    if (!profile?.onboarding_completed) {
      // Setup incompleto — leva (ou mantém) o usuário na tela de setup.
      if (!isSetup) router.replace('/(auth)/setup');
    } else if (inAuthGroup && !isAtivacao && !isConvert) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, profile, profileLoading, router]);

  if (!hydrated || !fontsLoaded) return null;

  const segsNow = segments as string[];
  const isSOSScreen = segsNow.includes('protocolo');

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {!isSOSScreen && (
        <AnonymousExpiredModal
          visible={anonymousExpired}
          onConvert={() => {
            setAnonymousExpired(false);
            router.push('/(auth)/convert');
          }}
          onDismiss={() => setAnonymousExpired(false)}
        />
      )}
      {locked && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <Text style={{ color: Colors.gold, fontSize: 32 }}>🔒</Text>
          <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '600' }}>
            O Guardião está protegido
          </Text>
          <Pressable
            onPress={unlock}
            style={{
              backgroundColor: Colors.gold,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 16 }}>
              Usar biometria / PIN
            </Text>
          </Pressable>
        </View>
      )}
    </>
  );
}
