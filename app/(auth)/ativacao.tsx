import { View, Text, SafeAreaView, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useProfileStore } from '@/hooks/useProfileStore';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';

function getDaysSober(startDate: string | null | undefined): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function AtivacaoScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const daysSober = getDaysSober(profile?.sobriety_start_date);

  const scale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringOpacity, { toValue: 0.55, duration: 1400, useNativeDriver: true }),
            Animated.timing(ringScale, { toValue: 1.28, duration: 1400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ringOpacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
            Animated.timing(ringScale, { toValue: 1, duration: 1400, useNativeDriver: true }),
          ]),
        ]),
      ).start();
    });
  }, [scale, ringOpacity, ringScale]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
        }}
      >
        {/* Eyebrow */}
        <Text
          style={{
            color: Colors.gold,
            fontSize: 11,
            letterSpacing: 3.5,
            marginBottom: 52,
            textAlign: 'center',
          }}
        >
          SEU ESCUDO ESTÁ ATIVO
        </Text>

        {/* Anel pulsante + contador de dias */}
        <View
          style={{
            width: 160,
            height: 160,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 52,
          }}
        >
          {/* Anel externo pulsante */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: 80,
              borderWidth: 1.5,
              borderColor: Colors.gold,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            }}
          />
          {/* Anel principal com número */}
          <Animated.View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              borderWidth: 1.5,
              borderColor: Colors.gold,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale }],
            }}
          >
            <Text
              style={{
                fontFamily: 'CormorantGaramond',
                color: Colors.gold,
                fontSize: 64,
                lineHeight: 68,
              }}
            >
              {daysSober}
            </Text>
            <Text
              style={{
                color: Colors.muted,
                fontSize: 11,
                letterSpacing: 2.5,
              }}
            >
              {daysSober === 1 ? 'DIA' : 'DIAS'}
            </Text>
          </Animated.View>
        </View>

        {/* Título */}
        <Text
          style={{
            color: Colors.gold,
            fontSize: 12,
            letterSpacing: 2.5,
            marginBottom: 14,
            textAlign: 'center',
          }}
        >
          SEU PRIMEIRO DIA COMEÇA AGORA
        </Text>

        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.text,
            fontSize: 24,
            textAlign: 'center',
            lineHeight: 32,
            marginBottom: 56,
          }}
        >
          Hoje é o único dia que você precisa ganhar.
        </Text>

        <View style={{ width: '100%' }}>
          <Button
            title="Começar meu primeiro dia"
            onPress={() => router.replace('/(tabs)')}
          />
        </View>

        <Text
          style={{
            color: Colors.mutedDark,
            fontSize: 11,
            textAlign: 'center',
            marginTop: 24,
            lineHeight: 17,
          }}
        >
          Este app complementa — nunca substitui — psiquiatras, psicólogos ou grupos de apoio.
        </Text>
      </View>
    </SafeAreaView>
  );
}
