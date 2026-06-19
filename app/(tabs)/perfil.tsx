import { View, Text, SafeAreaView } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function PerfilScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-text text-2xl" style={{ fontFamily: 'CormorantGaramond' }}>
          Perfil
        </Text>
        <Text className="text-muted text-sm mt-2">Configurações · LGPD</Text>
      </View>
    </SafeAreaView>
  );
}
