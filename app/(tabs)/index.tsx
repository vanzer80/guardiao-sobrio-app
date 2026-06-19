import { View, Text, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function HojeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text
          className="text-gold text-5xl font-bold mb-2"
          style={{ fontFamily: 'CormorantGaramond' }}
        >
          0
        </Text>
        <Text className="text-muted text-base">dias guardados</Text>
      </View>
    </SafeAreaView>
  );
}
