import { Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAnonymousSession } from '@/hooks/useAnonymousSession';
import { Colors } from '@/constants/Colors';

export function AnonymousBanner() {
  const router = useRouter();
  const { shouldShowBanner, daysRemaining } = useAnonymousSession();

  if (!shouldShowBanner) return null;

  const label =
    daysRemaining === 1
      ? 'Último dia de acesso gratuito'
      : `${daysRemaining} dias de acesso gratuito restantes`;

  return (
    <Pressable
      onPress={() => router.push('/(auth)/convert')}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Toque para criar sua conta e manter seu progresso.`}
      style={{
        backgroundColor: Colors.goldDim,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: Colors.bg, fontSize: 12, fontWeight: '600', flex: 1 }}>
        {label}
      </Text>
      <Text style={{ color: Colors.bg, fontSize: 12, fontWeight: '700' }}>
        Criar conta →
      </Text>
    </Pressable>
  );
}
