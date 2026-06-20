import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/hooks/useProfileStore';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function ConvertScreen() {
  const router = useRouter();
  const setProfile = useProfileStore((s) => s.setProfile);
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

  const onConvert = async ({ email, password }: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) {
      setLoading(false);
      Alert.alert('Erro ao criar conta', error.message);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ is_anonymous: false, anonymous_created_at: null })
        .eq('id', user.id);

      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (updatedProfile) setProfile(updatedProfile);
    }

    setLoading(false);
    router.replace('/(tabs)');
  };

  const handleOAuthLink = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    try {
      if (Platform.OS === 'web') {
        const redirectTo = `${window.location.origin}/callback`;
        const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo } });
        if (error) throw error;
        return;
      }

      const redirectUrl = Linking.createURL('/');
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error || !data?.url) throw error ?? new Error('Provider não configurado.');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ is_anonymous: false, anonymous_created_at: null })
            .eq('id', user.id);

          const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (updatedProfile) setProfile(updatedProfile);
        }
        router.replace('/(tabs)');
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
          Seus dados estão salvos.
        </Text>
        <Text style={{ color: Colors.mutedLight, fontSize: 15, lineHeight: 22, marginBottom: 36 }}>
          Basta criar sua conta para mantê-los.
        </Text>

        <View style={{ gap: 16, marginBottom: 24 }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="E-mail"
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
            onPress={handleSubmit(onConvert)}
            loading={loading}
          />
        </View>

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

        <View style={{ gap: 10, marginBottom: 32 }}>
          <Button
            title={oauthLoading === 'google' ? 'Aguarde...' : 'Continuar com Google'}
            variant="secondary"
            onPress={() => handleOAuthLink('google')}
            disabled={oauthLoading !== null || loading}
            loading={oauthLoading === 'google'}
          />

          {Platform.OS === 'ios' && (
            <Button
              title={oauthLoading === 'apple' ? 'Aguarde...' : 'Continuar com Apple'}
              variant="secondary"
              onPress={() => handleOAuthLink('apple')}
              disabled={oauthLoading !== null || loading}
              loading={oauthLoading === 'apple'}
            />
          )}
        </View>

        <Pressable
          onPress={() => router.back()}
          style={{ alignItems: 'center', paddingVertical: 8 }}
          accessibilityRole="button"
        >
          <Text style={{ color: Colors.muted, fontSize: 15 }}>Voltar a explorar</Text>
        </Pressable>

        <View style={{ marginTop: 36, alignItems: 'center' }}>
          <Text
            style={{
              color: Colors.mutedDark,
              fontSize: 11,
              textAlign: 'center',
              lineHeight: 17,
            }}
          >
            CVV — 188 · CAPS — caps.ms/onde-buscar-ajuda{'\n'}
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
