import { View, Text, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View className="flex-1 justify-center px-8">
        <Text
          className="text-gold text-4xl mb-2"
          style={{ fontFamily: 'CormorantGaramond' }}
        >
          O Guardião Sóbrio
        </Text>
        <Text className="text-muted text-base mb-12">
          Sobriedade não é abstinência. É construção.
        </Text>
        <Text className="text-text text-sm">
          — Tela de login (Sprint 1)
        </Text>
      </View>
    </SafeAreaView>
  );
}
