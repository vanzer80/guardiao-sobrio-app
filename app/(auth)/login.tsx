import { View, Text, SafeAreaView, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
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
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onLogin = async ({ email, password }: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Erro ao entrar', error.message);
    }
    // _layout.tsx redireciona automaticamente quando a sessão mudar
  };

  // Web: redireciona o navegador para o provider OAuth; ao voltar, /callback troca o code.
  // Native: PKCE via expo-web-browser (WebBrowser não funciona corretamente no web).
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
        // Navegador redirecionando para o provider — mantém spinner até sair da página.
        return;
      }

      // Native: fluxo PKCE com expo-web-browser.
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
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('[OAuth native exchange]', exchangeError.message);
            throw exchangeError;
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Eyebrow */}
        <Text
          style={{
            color: Colors.gold,
            fontSize: 11,
            letterSpacing: 3.5,
            marginBottom: 12,
          }}
        >
          BEM-VINDO DE VOLTA
        </Text>

        {/* Título serifado */}
        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.text,
            fontSize: 40,
            lineHeight: 46,
          }}
        >
          O Guardião
        </Text>
        <Text
          style={{
            fontFamily: 'CormorantGaramond-Italic',
            color: Colors.gold,
            fontSize: 40,
            lineHeight: 46,
            marginBottom: 8,
          }}
        >
          Sóbrio
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 15, marginBottom: 40 }}>
          Sobriedade não é abstinência. É construção.
        </Text>

        {/* Formulário */}
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
                autoComplete="current-password"
              />
            )}
          />

          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityRole="button"
            style={{ alignSelf: 'flex-end', paddingVertical: 4 }}
          >
            <Text style={{ color: Colors.gold, fontSize: 14 }}>Esqueceu a senha?</Text>
          </Pressable>

          <Button
            title="Entrar"
            onPress={handleSubmit(onLogin)}
            loading={loading}
            disabled={oauthLoading !== null}
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

        {/* OAuth — mesmas opções do /register */}
        <View style={{ gap: 10, marginBottom: 32 }}>
          <Button
            title={oauthLoading === 'google' ? 'Aguarde...' : 'Continuar com Google'}
            variant="secondary"
            onPress={() => handleOAuth('google')}
            disabled={loading || oauthLoading !== null}
            loading={oauthLoading === 'google'}
          />
          {Platform.OS === 'ios' && (
            <Button
              title={oauthLoading === 'apple' ? 'Aguarde...' : 'Continuar com Apple'}
              variant="secondary"
              onPress={() => handleOAuth('apple')}
              disabled={loading || oauthLoading !== null}
              loading={oauthLoading === 'apple'}
            />
          )}
        </View>

        {/* Link cadastro */}
        <View style={{ alignItems: 'center' }}>
          <Pressable
            onPress={() => router.push('/(auth)/register')}
            accessibilityRole="button"
            style={{ paddingVertical: 8 }}
          >
            <Text style={{ color: Colors.muted, fontSize: 15 }}>
              Não tem conta?{' '}
              <Text style={{ color: Colors.gold }}>Criar conta</Text>
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 48, alignItems: 'center', gap: 6 }}>
          <Text style={{ color: Colors.mutedDark, fontSize: 11, textAlign: 'center', lineHeight: 17 }}>
            CVV — 188 · CAPS — caps.ms/onde-buscar-ajuda{'\n'}
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
