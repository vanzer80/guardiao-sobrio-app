import { View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Senhas não coincidem',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirm: '' },
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
      // Confirmação de email habilitada no Supabase: ainda não há sessão.
      Alert.alert(
        'Confirme seu email',
        'Enviamos um link de confirmação. Confirme seu email e faça login para continuar.',
      );
      router.replace('/(auth)/login');
      return;
    }

    // Sessão ativa — segue para o onboarding.
    router.replace('/(auth)/onboarding');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: Colors.gold, fontSize: 28, fontWeight: '600', marginBottom: 8 }}>
          Criar conta
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 15, marginBottom: 36 }}>
          Seu progresso fica seguro e privado.
        </Text>

        <View style={{ gap: 16 }}>
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

          <Controller
            control={control}
            name="confirm"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirmar senha"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.confirm?.message}
                secureTextEntry
                autoComplete="new-password"
              />
            )}
          />

          <Button title="Criar conta" onPress={handleSubmit(onRegister)} loading={loading} />
        </View>

        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: Colors.muted, fontSize: 15 }}>
              Já tenho conta{' '}
              <Text style={{ color: Colors.gold }}>Entrar</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
