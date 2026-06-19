/**
 * Deep link handler: guardiaosobrio://plans/cancel
 * Exibida quando o usuário cancela o checkout no Stripe.
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function PlansCancelScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 }}>
      <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
        Checkout cancelado
      </Text>
      <Text style={{ color: Colors.muted, fontSize: 14, textAlign: 'center' }}>
        Nenhuma cobrança foi realizada. Você pode fazer upgrade a qualquer momento.
      </Text>
      <Pressable
        onPress={() => router.replace('/(tabs)/plans')}
        style={{ backgroundColor: Colors.gold, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
      >
        <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 16 }}>Ver planos</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(tabs)')}>
        <Text style={{ color: Colors.muted, fontSize: 14 }}>Voltar ao início</Text>
      </Pressable>
    </View>
  );
}
