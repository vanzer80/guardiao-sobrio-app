import { View, Text, SafeAreaView, ScrollView, Linking, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function ContatosScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontFamily: 'CormorantGaramond',
              color: Colors.gold,
              fontSize: 36,
            }}
          >
            Contatos
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: Colors.muted, fontSize: 13 }}>← Voltar</Text>
          </Pressable>
        </View>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 22 }}>
          Pessoas de confiança que você pode acionar em momentos de crise.
        </Text>

        <View
          style={{
            backgroundColor: `${Colors.gold}0d`,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: `${Colors.gold}33`,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
            Em breve
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22 }}>
            A funcionalidade de cadastro de contatos de confiança está em desenvolvimento.
            Ela permitirá que você salve pessoas que sabem da sua jornada e acione-as diretamente
            pelo Protocolo SOS.
          </Text>
        </View>

        <View
          style={{
            padding: 16,
            backgroundColor: Colors.surfaceRaised,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.border,
            gap: 8,
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
          <Text style={{ color: Colors.muted, fontSize: 11, marginTop: 4 }}>
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
