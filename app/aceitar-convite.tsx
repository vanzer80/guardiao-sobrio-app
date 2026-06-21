import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function AceitarConviteScreen() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      setCheckingAuth(false);
    })();
  }, [router]);

  const handleAccept = async () => {
    const clean = token.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      showAlert('Código inválido', 'Digite o código de 6 dígitos enviado pelo familiar.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_family_invite', { p_token: clean });
      if (error) throw error;
      const result = data as unknown as { ok: boolean; reason?: string };
      if (!result.ok) {
        showAlert('Não foi possível aceitar', result.reason ?? 'Código inválido.');
        return;
      }
      showAlert(
        'Vinculado com sucesso',
        'Você agora acompanha o progresso do seu familiar. Abra o Escudo para ver o status do dia.',
      );
      router.replace('/(tabs)/escudo');
    } catch (err) {
      showAlert('Erro', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flex: 1, padding: 28, justifyContent: 'center' }}>

        <Text style={{ color: Colors.gold, fontSize: 11, letterSpacing: 3.5, marginBottom: 16 }}>
          MÓDULO FAMILIAR
        </Text>
        <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '700', marginBottom: 8 }}>
          Aceitar convite
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 40 }}>
          Digite o código de 6 dígitos que o seu familiar gerou no app.
        </Text>

        <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.5, marginBottom: 8 }}>
          CÓDIGO DE CONVITE
        </Text>
        <TextInput
          value={token}
          onChangeText={(v) => setToken(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="numeric"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={Colors.muted}
          accessibilityLabel="Código de convite de 6 dígitos"
          style={{
            backgroundColor: Colors.surface,
            color: Colors.text,
            fontSize: 32,
            fontWeight: '700',
            letterSpacing: 8,
            textAlign: 'center',
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: token.length === 6 ? Colors.gold : Colors.border,
            marginBottom: 32,
          }}
        />

        <Button
          title={loading ? 'Verificando…' : 'Aceitar convite'}
          onPress={handleAccept}
          disabled={loading || token.length !== 6}
        />

        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
        >
          <Text style={{ color: Colors.muted, fontSize: 15 }}>Cancelar</Text>
        </Pressable>

        <Text style={{
          color: Colors.mutedDark,
          fontSize: 11,
          textAlign: 'center',
          marginTop: 40,
          lineHeight: 17,
        }}>
          Ao aceitar, você verá apenas se o dia foi guardado.{'\n'}
          Nenhum detalhe do diário ou gatilhos é compartilhado.
        </Text>
      </View>
    </SafeAreaView>
  );
}
