import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;
type ScreenState = 'verifying' | 'form' | 'success' | 'error';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token_hash, type } = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
  }>();

  const [state, setState] = useState<ScreenState>('verifying');
  const [tokenError, setTokenError] = useState('');
  const [loading, setLoading] = useState(false);
  const verified = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (verified.current) return;
    // Params ainda hidratando no web — aguarda.
    if (token_hash === undefined) return;

    if (!token_hash || type !== 'recovery') {
      // setTimeout para satisfazer react-hooks/set-state-in-effect (mesmo padrão do _layout.tsx)
      const id = setTimeout(() => {
        setTokenError('Link inválido ou expirado. Solicite um novo link de recuperação.');
        setState('error');
      }, 0);
      return () => clearTimeout(id);
    }

    verified.current = true;
    let alive = true;

    supabase.auth.verifyOtp({ token_hash, type: 'recovery' }).then(({ error }) => {
      if (!alive) return;
      if (error) {
        const isExpired = error.message.toLowerCase().includes('expired');
        setTokenError(
          isExpired
            ? 'O link expirou. Links de recuperação são válidos por 1 hora.'
            : 'Link inválido. Solicite um novo link de recuperação.',
        );
        setState('error');
      } else {
        setState('form');
      }
    });

    return () => {
      alive = false;
    };
  }, [token_hash, type]);

  const onSubmit = async ({ password }: FormData) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Erro ao redefinir senha', error.message);
      return;
    }

    setState('success');
  };

  if (state === 'verifying') {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: Colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <ActivityIndicator color={Colors.gold} size="large" />
        <Text style={{ color: Colors.muted, fontSize: 14 }}>Verificando link…</Text>
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        >
          <Text
            style={{ color: Colors.gold, fontSize: 11, letterSpacing: 3.5, marginBottom: 12 }}
          >
            LINK INVÁLIDO
          </Text>
          <Text
            style={{
              fontFamily: 'CormorantGaramond',
              color: Colors.text,
              fontSize: 40,
              lineHeight: 46,
              marginBottom: 8,
            }}
          >
            Link expirado
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 40 }}>
            {tokenError}
          </Text>
          <View style={{ gap: 12 }}>
            <Button
              title="Solicitar novo link"
              onPress={() => router.replace('/(auth)/forgot-password')}
            />
            <Button
              title="Voltar ao login"
              variant="ghost"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state === 'success') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        >
          <Text
            style={{ color: Colors.gold, fontSize: 11, letterSpacing: 3.5, marginBottom: 12 }}
          >
            TUDO CERTO
          </Text>
          <Text
            style={{
              fontFamily: 'CormorantGaramond',
              color: Colors.text,
              fontSize: 40,
              lineHeight: 46,
            }}
          >
            Senha
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
            redefinida
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 40 }}>
            Sua senha foi alterada com sucesso. Você já pode continuar usando o Guardião.
          </Text>
          <Button title="Continuar" onPress={() => router.replace('/(tabs)')} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // state === 'form'
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{ color: Colors.gold, fontSize: 11, letterSpacing: 3.5, marginBottom: 12 }}
        >
          NOVA SENHA
        </Text>
        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.text,
            fontSize: 40,
            lineHeight: 46,
          }}
        >
          Criar nova
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
        <Text style={{ color: Colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 40 }}>
          Escolha uma senha com pelo menos 8 caracteres.
        </Text>

        <View style={{ gap: 16, marginBottom: 24 }}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nova senha"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
                secureTextEntry
                autoComplete="new-password"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirmar nova senha"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirmPassword?.message}
                secureTextEntry
                autoComplete="new-password"
              />
            )}
          />

          <Button
            title="Redefinir senha"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
