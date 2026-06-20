import { View, Text, SafeAreaView, ScrollView, Switch } from 'react-native';
import { useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { isBiometricLockEnabled, setBiometricLockEnabled } from '@/lib/appLock';
import { Colors } from '@/constants/Colors';

export default function PrivacidadeScreen() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(() => isBiometricLockEnabled());

  useEffect(() => {
    (async () => {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(has && enrolled);
    })();
  }, []);

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Ative a proteção por biometria',
        cancelLabel: 'Cancelar',
      });
      if (!result.success) return;
    }
    setBiometricEnabled(value);
    setBiometricLockEnabled(value);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>

        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.gold,
            fontSize: 36,
            marginBottom: 4,
          }}
        >
          Privacidade
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 22 }}>
          Controle o acesso ao app e proteja seus dados pessoais.
        </Text>

        <Text
          style={{
            color: Colors.muted,
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          PROTEÇÃO DE ACESSO
        </Text>

        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            marginBottom: 24,
          }}
        >
          {biometricAvailable ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ color: Colors.text, fontSize: 15 }}>Biometria / PIN</Text>
                <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>
                  Bloqueia o app ao retornar do fundo
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                trackColor={{ false: Colors.border, true: Colors.gold }}
                thumbColor="#fff"
              />
            </View>
          ) : (
            <View style={{ padding: 20 }}>
              <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22 }}>
                Biometria não disponível neste dispositivo ou nenhuma biometria cadastrada no sistema.
              </Text>
            </View>
          )}
        </View>

        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: 16,
            gap: 10,
          }}
        >
          <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '600' }}>
            Seus dados
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 13, lineHeight: 20 }}>
            Todos os seus dados são protegidos por Row Level Security (RLS) no banco de dados.
            Apenas você tem acesso aos seus registros de sobriedade, checklist e diário.
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 13, lineHeight: 20 }}>
            Para excluir permanentemente sua conta e todos os dados, acesse{' '}
            <Text style={{ color: Colors.gold }}>Perfil → Excluir minha conta</Text>.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
