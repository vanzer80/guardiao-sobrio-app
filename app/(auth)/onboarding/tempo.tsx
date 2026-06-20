import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { saveOnboardingDraft } from '@/lib/onboardingStore';

const OPTIONS = [
  { key: 'agora', label: 'Estou começando agora' },
  { key: '1a7', label: '1 a 7 dias' },
  { key: '8a30', label: '8 a 30 dias' },
  { key: '30mais', label: 'Mais de 30 dias' },
];

export default function TempoScreen() {
  const router = useRouter();
  const { motivo } = useLocalSearchParams<{ motivo: string }>();
  const [selected, setSelected] = useState('');

  const handleContinue = () => {
    saveOnboardingDraft({ tempo: selected });
    router.push({
      pathname: '/(auth)/onboarding/desafio',
      params: { motivo: motivo ?? '', tempo: selected },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Barra de progresso — passo 2 ativo */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 48 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                backgroundColor: i <= 1 ? Colors.gold : Colors.border,
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
          PASSO 02 DE 03
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
          Há quanto tempo você está nesta jornada?
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
