import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { readOnboardingDraft } from '@/lib/onboardingStore';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

// Salva as respostas do onboarding pré-cadastro no perfil do usuário.
// Operação não-bloqueante: falha silenciosa se as colunas ainda não existirem.
async function saveOnboardingContext(
  userId: string,
  motivo?: string,
  tempo?: string,
  desafio?: string,
) {
  if (!motivo && !tempo && !desafio) return;
  try {
    await supabase
      .from('profiles')
      .update({
        ...(motivo ? { onboarding_motivo: motivo } : {}),
        ...(tempo ? { onboarding_tempo: tempo } : {}),
        ...(desafio ? { onboarding_desafio: desafio } : {}),
      })
      .eq('id', userId);
  } catch {
    // Contexto de onboarding é suplementar — não bloqueia o fluxo
  }
}

export default function RegisterScreen() {
  const router = useRouter();
  const { motivo: paramMotivo, tempo: paramTempo, desafio: paramDesafio } = useLocalSearchParams<{
    motivo?: string;
    tempo?: string;
    desafio?: string;
  }>();
  // MMKV como fallback: se o app morreu e voltou sem os params de URL, lê do draft.
  const [draft] = useState(() => readOnboardingDraft());
  const motivo = paramMotivo || draft.motivo || '';
  const tempo = paramTempo || draft.tempo || '';
  const desafio = paramDesafio || draft.desafio || '';

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  // Quando email confirm está ativo no Supabase, exibimos estado de espera inline
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onRegister = async ({ email, password }: FormData) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Erro ao criar conta', error.message);
      return;
    }

    if (!data.session) {
      // Email confirm ATIVO no Supabase — usuário precisa confirmar antes de continuar
      setSentToEmail(email);
      setEmailSent(true);
      return;
    }

    // Sessão ativa — salva contexto do pré-onboarding e segue para setup
    await saveOnboardingContext(data.session.user.id, motivo, tempo, desafio);
    router.replace('/(auth)/setup');
  };

  const checkEmailConfirmation = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    setLoading(false);

    if (data.session) {
      await saveOnboardingContext(data.session.user.id, motivo, tempo, desafio);
      router.replace('/(auth)/setup');
    } else {
      Alert.alert(
        'Ainda não confirmado',
        'Verifique seu email e clique no link antes de continuar.',
      );
    }
  };

  // Web: redireciona o navegador para o provider OAuth; ao voltar, /callback troca o code.
  // Native: PKCE via expo-web-browser. Salva contexto de onboarding após troca de código.
  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    try {
      if (Platform.OS === 'web') {
        const redirectTo = `${window.location.origin}/callback`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        });
        if (error) {
          console.error('[OAuth web]', provider, error.message);
          throw error;
        }
        // Navegador redirecionando — contexto de onboarding não persiste no web
        // (MMKV é nativo); novo usuário irá para setup sem pré-preenchimento.
        return;
      }

      // Native: PKCE com expo-web-browser + salva contexto de onboarding.
      const redirectUrl = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      if (error || !data.url) {
        console.error('[OAuth native]', provider, error?.message ?? 'sem URL');
        throw error ?? new Error('Provider não configurado. Tente novamente.');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        if (code) {
          const { data: authData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[OAuth native exchange]', exchangeError.message);
            throw exchangeError;
          } else if (authData.session) {
            await saveOnboardingContext(authData.session.user.id, motivo, tempo, desafio);
          }
          // onAuthStateChange em _layout.tsx detecta a sessão e redireciona.
        } else {
          await supabase.auth.getSession();
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível completar o login.';
      Alert.alert('Erro ao autenticar', msg);
    } finally {
      setOauthLoading(null);
    }
  };

  // Estado: aguardando confirmação de email
  if (emailSent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              color: Colors.gold,
              fontSize: 11,
              letterSpacing: 3.5,
              marginBottom: 16,
            }}
          >
            CONFIRME SEU EMAIL
          </Text>
          <Text
            style={{
              fontFamily: 'CormorantGaramond',
              color: Colors.text,
              fontSize: 32,
              lineHeight: 38,
              marginBottom: 16,
            }}
          >
            Verifique sua caixa de entrada
          </Text>
          <Text style={{ color: Colors.mutedLight, fontSize: 15, lineHeight: 22, marginBottom: 36 }}>
            Enviamos um link para{' '}
            <Text style={{ color: Colors.text }}>{sentToEmail}</Text>.{'\n'}
            Clique no link e volte aqui para continuar.
          </Text>

          <Button
            title="Já confirmei"
            onPress={checkEmailConfirmation}
            loading={loading}
          />

          <Pressable
            onPress={() => setEmailSent(false)}
            style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}
            accessibilityRole="button"
          >
            <Text style={{ color: Colors.muted, fontSize: 15 }}>Usar outro email</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text
          style={{
            color: Colors.gold,
            fontSize: 11,
            letterSpacing: 3.5,
            marginBottom: 12,
          }}
        >
          CRIAR CONTA
        </Text>
        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.text,
            fontSize: 36,
            lineHeight: 42,
            marginBottom: 8,
          }}
        >
          Crie sua conta
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 15, marginBottom: 36 }}>
          Seu escudo começa aqui. Leva 30 segundos.
        </Text>

        {/* Formulário email/senha */}
        <View style={{ gap: 16, marginBottom: 24 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Senha"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="new-password"
              />
            )}
          />

          <Button
            title="Criar conta"
            onPress={handleSubmit(onRegister)}
            loading={loading}
          />
        </View>

        {/* Divisor "ou" */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
          <Text style={{ color: Colors.muted, fontSize: 13 }}>ou</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
        </View>

        {/* OAuth — Google */}
        <View style={{ gap: 10, marginBottom: 32 }}>
          <Button
            title={oauthLoading === 'google' ? 'Aguarde...' : 'Continuar com Google'}
            variant="secondary"
            onPress={() => handleOAuth('google')}
            disabled={oauthLoading !== null || loading}
            loading={oauthLoading === 'google'}
          />

          {/* Sign in with Apple obrigatório na App Store quando há login Google */}
          {Platform.OS === 'ios' && (
            <Button
              title={oauthLoading === 'apple' ? 'Aguarde...' : 'Continuar com Apple'}
              variant="secondary"
              onPress={() => handleOAuth('apple')}
              disabled={oauthLoading !== null || loading}
              loading={oauthLoading === 'apple'}
            />
          )}
        </View>

        {/* Link login */}
        <View style={{ alignItems: 'center' }}>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            style={{ paddingVertical: 8 }}
          >
            <Text style={{ color: Colors.muted, fontSize: 15 }}>
              Já tenho conta{' '}
              <Text style={{ color: Colors.gold }}>Entrar</Text>
            </Text>
          </Pressable>
        </View>

        {/* Disclaimers */}
        <View style={{ marginTop: 36, alignItems: 'center', gap: 4 }}>
          <Text style={{ color: Colors.mutedDark, fontSize: 11, textAlign: 'center', lineHeight: 17 }}>
            CVV — 188 · CAPS — caps.ms/onde-buscar-ajuda{'\n'}
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
