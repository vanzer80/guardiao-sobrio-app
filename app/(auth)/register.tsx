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
  const { motivo, tempo, desafio } = useLocalSearchParams<{
    motivo?: string;
    tempo?: string;
    desafio?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  // Quando email confirm está ativo no Supabase, exibimos estado de espera inline
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
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

  // OAuth via Supabase + expo-web-browser (PKCE flow)
  // Pré-requisito: Google e Apple habilitados no Supabase Dashboard →
  // Authentication → Providers. URL de redirect: guardiaosobrio:///
  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    try {
      const redirectUrl = Linking.createURL('/');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        Alert.alert(
          'Erro',
          'Não foi possível iniciar o login social. Verifique se o provedor está configurado.',
        );
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success') {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            Alert.alert('Erro de autenticação', exchangeError.message);
          }
          // onAuthStateChange em _layout.tsx detecta a sessão e redireciona
        } else {
          // Fluxo implícito (sem PKCE): force refresh de sessão
          await supabase.auth.getSession();
        }
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível completar o login.');
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
