import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { saveOnboardingDraft } from '@/lib/onboardingStore';

const OPTIONS = [
  { key: 'parar', label: 'Quero parar de beber' },
  { key: 'manter', label: 'Estou tentando me manter sóbrio' },
  { key: 'ajudar', label: 'Quero ajudar alguém que bebe' },
];

export default function MotivoScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [selected, setSelected] = useState('');

  const handleContinue = () => {
    saveOnboardingDraft({ motivo: selected });
    router.push({
      pathname: '/(auth)/onboarding/tempo',
      params: { motivo: selected, ...(mode ? { mode } : {}) },
    });
  };

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

        <View style={{ gap: 10, flex: 1 }}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSelected(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={{
                  height: 56,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isSelected ? Colors.gold : Colors.border,
                  backgroundColor: isSelected ? `${Colors.gold}18` : Colors.surfaceRaised,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ color: isSelected ? Colors.gold : Colors.text, fontSize: 16 }}>
                  {opt.label}
                </Text>
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                  size={18}
                  color={isSelected ? Colors.gold : Colors.mutedDark}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 40 }}>
          <Button title="Continuar" onPress={handleContinue} disabled={!selected} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
