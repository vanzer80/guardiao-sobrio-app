import { View, Text, SafeAreaView, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';

const PILLARS = [
  {
    key: 'ESPELHO',
    days: 'Seg & Qui',
    description:
      'Autoanálise honesta: o que está funcionando, o que precisa mudar e quais padrões você reconhece.',
    color: Colors.gold,
  },
  {
    key: 'TÁTICA',
    days: 'Ter & Sex',
    description:
      'Planejamento prático: estratégias concretas para os próximos dias, antecipação de riscos e ajuste de rota.',
    color: Colors.text,
  },
  {
    key: 'ESCUDO',
    days: 'Qua & Sáb',
    description:
      'Proteção e cuidado: construção de rotinas, limites saudáveis e redes de apoio que sustentam a sobriedade.',
    color: Colors.muted,
  },
] as const;

export default function MetodoScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.gold,
            fontSize: 36,
            marginBottom: 4,
          }}
        >
          O Método
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 22 }}>
          Três pilares rotativos que estruturam a sua semana e sustentam a construção da sobriedade.
        </Text>

        {/* Pillars */}
        <View style={{ gap: 16, marginBottom: 40 }}>
          {PILLARS.map((p) => (
            <View
              key={p.key}
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: Colors.border,
                borderLeftWidth: 3,
                borderLeftColor: p.color,
              }}
            >
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}
              >
                <Text style={{ color: p.color, fontSize: 16, fontWeight: '700', letterSpacing: 1 }}>
                  {p.key}
                </Text>
                <Text style={{ color: Colors.muted, fontSize: 12 }}>{p.days}</Text>
              </View>
              <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22 }}>
                {p.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Dom livre */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: Colors.border,
            marginBottom: 40,
          }}
        >
          <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 6 }}>
            Dom · Dia livre
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22 }}>
            Descanso intencional. Sem metas, sem análise. Apenas estar presente.
          </Text>
        </View>

        {/* Coming soon */}
        <View
          style={{
            backgroundColor: `${Colors.gold}0d`,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: `${Colors.gold}33`,
          }}
        >
          <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
            Em breve — Sprint 4
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 13, lineHeight: 20 }}>
            Diário de prompts diários, os 13 Fundamentos e o Fundamento do Dia chegarão no próximo sprint.
          </Text>
        </View>

        <Text
          style={{
            color: Colors.muted,
            fontSize: 12,
            textAlign: 'center',
            marginTop: 32,
            fontStyle: 'italic',
          }}
        >
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
