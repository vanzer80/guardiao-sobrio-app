import { View, Text, SafeAreaView, ScrollView, Linking, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';

const HARD_RULES = [
  'Nenhuma tela ou notificação promete cura, sobriedade garantida ou resultado milagroso.',
  'Nunca pressionamos o usuário a não procurar ajuda profissional.',
  'Dados de sobriedade nunca são expostos a terceiros sem consentimento explícito.',
  'O Protocolo de Emergência (SOS) jamais é bloqueado durante uma crise.',
  'CVV (188) e CAPS sempre visíveis nas telas de protocolo e configurações.',
  'Exclusão de conta e todos os dados em no máximo 2 toques (LGPD, Art. 18 VI).',
  'Sem notificações entre 23h e 7h.',
  'RLS ativa em toda tabela de dados de usuário — apenas você acessa seus dados.',
];

export default function SobreScreen() {
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
          Sobre
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 22 }}>
          O Guardião Sóbrio — suporte à sobriedade e recuperação.
        </Text>

        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: 20,
            marginBottom: 24,
            gap: 10,
          }}
        >
          <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
            O QUE É ESTE APP
          </Text>
          <Text style={{ color: Colors.text, fontSize: 14, lineHeight: 22 }}>
            O Guardião Sóbrio é uma ferramenta de suporte diário para pessoas em jornada de sobriedade.
            Oferece estrutura, protocolos de crise e fundamentos baseados em evidências —
            sem promessas de cura ou substituição de tratamento profissional.
          </Text>
        </View>

        <Text
          style={{
            color: Colors.muted,
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          COMPROMISSOS INEGOCIÁVEIS
        </Text>
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          {HARD_RULES.map((rule, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                gap: 12,
                padding: 14,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: Colors.border,
                alignItems: 'flex-start',
              }}
            >
              <Text style={{ color: Colors.gold, fontSize: 14 }}>✓</Text>
              <Text style={{ color: Colors.text, fontSize: 13, lineHeight: 20, flex: 1 }}>{rule}</Text>
            </View>
          ))}
        </View>

        <View
          style={{
            padding: 16,
            backgroundColor: Colors.surfaceRaised,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.border,
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '600' }}>
            Precisa de ajuda agora?
          </Text>
          <Pressable
            onPress={() => Linking.openURL('tel:188')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ color: Colors.emergency, fontSize: 13, fontWeight: '600' }}>CVV 188</Text>
            <Text style={{ color: Colors.muted, fontSize: 13 }}>— gratuito, 24h, sigiloso</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('https://caps.ms/onde-buscar-ajuda')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '600' }}>CAPS</Text>
            <Text style={{ color: Colors.muted, fontSize: 13 }}>— rede pública de saúde mental</Text>
          </Pressable>
        </View>

        <Text
          style={{
            color: Colors.muted,
            fontSize: 12,
            textAlign: 'center',
            fontStyle: 'italic',
            lineHeight: 18,
          }}
        >
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
