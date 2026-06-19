import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <Text style={{ color: Colors.text, fontSize: 20, marginBottom: 16 }}>
          Tela não encontrada.
        </Text>
        <Link href="/">
          <Text style={{ color: Colors.gold }}>Voltar ao início</Text>
        </Link>
      </View>
    </>
  );
}
