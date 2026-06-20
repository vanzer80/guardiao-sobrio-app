import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { saveOnboardingDraft } from '@/lib/onboardingStore';

const OPTIONS = [
  { key: 'comecar', label: 'Não sei por onde começar' },
  { key: 'gatilhos', label: 'Os gatilhos são muito fortes' },
  { key: 'sozinho', label: 'Me sinto sozinho nisso' },
  { key: 'recaida', label: 'Tive uma recaída recente' },
];

export default function DesafioScreen() {
  const router = useRouter();
  const { motivo, tempo } = useLocalSearchParams<{ motivo: string; tempo: string }>();
  const [selected, setSelected] = useState('');

  const handleContinue = () => {
    saveOnboardingDraft({ desafio: selected });
    router.push({
      pathname: '/(auth)/register',
      params: {
        motivo: motivo ?? '',
        tempo: tempo ?? '',
        desafio: selected,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Barra de progresso — todos os 3 ativos */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 48 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                backgroundColor: Colors.gold,
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
          PASSO 03 DE 03
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
          Qual é o seu maior desafio agora?
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
          <Button title="Criar minha conta" onPress={handleContinue} disabled={!selected} />
        </View>

        <Text
          style={{
            color: Colors.mutedDark,
            fontSize: 11,
            textAlign: 'center',
            marginTop: 20,
            lineHeight: 17,
          }}
        >
          Este app complementa — nunca substitui — psiquiatras, psicólogos ou grupos de apoio.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
