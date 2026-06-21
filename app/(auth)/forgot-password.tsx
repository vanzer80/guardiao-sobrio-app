import { View, Text, SafeAreaView, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

const RESEND_COOLDOWN_SECONDS = 60;

function buildRedirectTo(): string {
  if (Platform.OS === 'web') {
    return `${window.location.origin}/reset-password`;
  }
  // Grupos Expo Router como (auth) são transparentes na URL — deep link usa /reset-password
  return Linking.createURL('/reset-password');
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendResetEmail = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildRedirectTo(),
    });
    setLoading(false);
    return error;
  };

  const onSubmit = async ({ email }: FormData) => {
    const error = await sendResetEmail(email);
    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }
    setSentEmail(email);
    setSent(true);
    setCountdown(RESEND_COOLDOWN_SECONDS);
  };

  const onResend = async () => {
    if (countdown > 0 || loading) return;
    const error = await sendResetEmail(sentEmail);
    if (error) {
      Alert.alert('Erro ao reenviar', error.message);
      return;
    }
    setCountdown(RESEND_COOLDOWN_SECONDS);
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
          RECUPERAÇÃO DE ACESSO
        </Text>

        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.text,
            fontSize: 40,
            lineHeight: 46,
          }}
        >
          Redefinir
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
          senha
        </Text>

        {!sent ? (
          <>
            <Text style={{ color: Colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 40 }}>
              Informe o email da sua conta. Enviaremos um link para criar uma nova senha.
            </Text>

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

              <Button
                title="Enviar link de recuperação"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
              />
            </View>
          </>
        ) : (
          <View style={{ marginBottom: 40 }}>
            <View
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: Colors.border,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: Colors.text, fontSize: 15, lineHeight: 22, marginBottom: 8 }}>
                Email enviado para{' '}
                <Text style={{ color: Colors.gold, fontWeight: '600' }}>{sentEmail}</Text>
              </Text>
              <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 20 }}>
                Verifique sua caixa de entrada e clique no link para criar uma nova senha. O link
                expira em 1 hora.
              </Text>
            </View>

            <Button
              title={countdown > 0 ? `Reenviar em ${countdown}s` : 'Reenviar email'}
              variant="secondary"
              onPress={onResend}
              loading={loading}
              disabled={countdown > 0}
            />
          </View>
        )}

        <Button title="Voltar ao login" variant="ghost" onPress={() => router.back()} />

        <View style={{ marginTop: 48, alignItems: 'center' }}>
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
