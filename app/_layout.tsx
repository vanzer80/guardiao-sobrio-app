import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useProfileStore } from '@/hooks/useProfileStore';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { session, isLoading, setSession, setLoading } = useAuthStore();
  const {
    profile,
    isLoading: profileLoading,
    setProfile,
    setLoading: setProfileLoading,
  } = useProfileStore();
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
        setProfileLoading(false);
      });
  }, [userId, setProfile, setProfileLoading]);

  useEffect(() => {
    if (isLoading) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';
    const isOnboarding = segs[1] === 'onboarding';

    if (!session) {
      SplashScreen.hideAsync();
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    // Com sessão, espera o profile carregar para decidir onboarding x tabs.
    if (profileLoading) return;
    SplashScreen.hideAsync();

    if (!profile?.onboarding_completed) {
      // Onboarding incompleto — leva (ou mantém) o usuário no onboarding.
      if (!isOnboarding) router.replace('/(auth)/onboarding');
    } else if (inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, profile, profileLoading, router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
