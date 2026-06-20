import { View, Text, Image, SafeAreaView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Foto de herói em P&B com overlay escuro */}
      <Image
        source={require('@/assets/images/luis_vanzer.png')}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.32 }}
        resizeMode="cover"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      <LinearGradient
        colors={['transparent', `${Colors.bg}bb`, Colors.bg]}
        locations={[0.2, 0.55, 0.78]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 28, paddingBottom: 40 }}>
          {/* Eyebrow */}
          <Text
            style={{
              color: Colors.gold,
              fontSize: 11,
              letterSpacing: 3.5,
              marginBottom: 16,
            }}
          >
            LUIS VANZER · DA TRINCHEIRA
          </Text>

          {/* Título serifado + itálico dourado */}
          <Text
            style={{
              fontFamily: 'CormorantGaramond',
              color: Colors.text,
              fontSize: 40,
              lineHeight: 46,
            }}
          >
            Sobriedade não é abstinência.
          </Text>
          <Text
            style={{
              fontFamily: 'CormorantGaramond-Italic',
              color: Colors.gold,
              fontSize: 40,
              lineHeight: 46,
              marginBottom: 20,
            }}
          >
            É construção.
          </Text>

          {/* Subtítulo */}
          <Text
            style={{
              color: Colors.mutedLight,
              fontSize: 15,
              lineHeight: 23,
              marginBottom: 44,
            }}
          >
            Uma estrutura diária de proteção da sobriedade. Não é o terapeuta, não é o médico. É o escudo no momento crítico.
          </Text>

          {/* CTA primário */}
          <Button
            title="Começar"
            onPress={() => router.push('/(auth)/onboarding/motivo')}
          />

          {/* Link login */}
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{ marginTop: 16, alignItems: 'center', paddingVertical: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Já tenho conta, fazer login"
          >
            <Text style={{ color: Colors.muted, fontSize: 15 }}>
              Já tenho conta{' '}
              <Text style={{ color: Colors.gold }}>Entrar</Text>
            </Text>
          </Pressable>

          {/* Acesso sem cadastro — link textual discreto para não competir com o CTA */}
          <Pressable
            onPress={() => router.push({ pathname: '/(auth)/onboarding/motivo', params: { mode: 'guest' } })}
            accessibilityRole="button"
            accessibilityLabel="Explorar o app sem criar uma conta"
            style={{ marginTop: 4, alignItems: 'center', padding: 12 }}
          >
            <Text style={{ color: Colors.mutedDark, fontSize: 13, textDecorationLine: 'underline' }}>
              Explorar sem cadastro
            </Text>
          </Pressable>

          {/* Disclaimers hard rule */}
          <Text
            style={{
              color: Colors.mutedDark,
              fontSize: 11,
              textAlign: 'center',
              marginTop: 28,
              lineHeight: 17,
            }}
          >
            Este app complementa — nunca substitui — psiquiatras, psicólogos ou grupos de apoio.{'\n'}
            CVV — 188 · CAPS — caps.ms/onde-buscar-ajuda
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
