import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';

const OPTIONS = [
  { key: 'parar', label: 'Quero parar de beber' },
  { key: 'manter', label: 'Estou tentando me manter sóbrio' },
  { key: 'ajudar', label: 'Quero ajudar alguém que bebe' },
];

export default function MotivoScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Barra de progresso — passo 1 ativo */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 48 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                backgroundColor: i === 0 ? Colors.gold : Colors.border,
              }}
            />
          ))}
        </View>

        {/* Header */}
        <Text
          style={{
            color: Colors.gold,
            fontSize: 11,
            letterSpacing: 3.5,
            marginBottom: 12,
          }}
        >
          PASSO 01 DE 03
        </Text>
        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.text,
            fontSize: 32,
            lineHeight: 38,
            marginBottom: 36,
          }}
        >
          O que te traz aqui hoje?
        </Text>

        {/* Opções */}
        <View style={{ gap: 10, flex: 1 }}>
          {OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setSelected(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === opt.key }}
              style={{
                height: 56,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selected === opt.key ? Colors.gold : Colors.border,
                backgroundColor:
                  selected === opt.key ? `${Colors.gold}18` : Colors.surfaceRaised,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}
            >
              <Text
                style={{
                  color: selected === opt.key ? Colors.gold : Colors.text,
                  fontSize: 16,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 40 }}>
          <Button
            title="Continuar"
            onPress={() =>
              router.push({
                pathname: '/(auth)/onboarding/tempo',
                params: { motivo: selected },
              })
            }
            disabled={!selected}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
