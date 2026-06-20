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

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
                autoComplete="current-password"
              />
            )}
          />

          <Button title="Entrar" onPress={handleSubmit(onLogin)} loading={loading} />
        </View>

        <View style={{ marginTop: 32, alignItems: 'center', gap: 12 }}>
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
