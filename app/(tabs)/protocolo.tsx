import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function ProtocoloScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          className="w-24 h-24 rounded-full items-center justify-center"
          style={{ backgroundColor: Colors.emergency }}
        >
          <Text className="text-text text-lg font-bold">SOS</Text>
        </Pressable>
        <Text className="text-muted text-sm mt-4 text-center">
          Protocolo de Emergência{'\n'}
          Este app não substitui profissional de saúde.
        </Text>
        <Text className="text-gold text-sm mt-6">CVV — 188 (24h, sigiloso)</Text>
      </View>
    </SafeAreaView>
  );
}
