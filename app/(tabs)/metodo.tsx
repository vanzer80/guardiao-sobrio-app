import { View, Text, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function MetodoScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-text text-2xl" style={{ fontFamily: 'CormorantGaramond' }}>
          Método
        </Text>
        <Text className="text-muted text-sm mt-2">ESPELHO · TÁTICA · ESCUDO</Text>
      </View>
    </SafeAreaView>
  );
}
