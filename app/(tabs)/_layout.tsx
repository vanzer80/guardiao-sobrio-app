import { Tabs } from 'expo-router';
import { Pressable, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hoje' }} />
      <Tabs.Screen name="metodo" options={{ title: 'Método' }} />
      <Tabs.Screen
        name="protocolo"
        options={{
          title: 'SOS',
          tabBarButton: (props) => (
            <Pressable
              onPress={props.onPress ?? undefined}
              onLongPress={props.onLongPress ?? undefined}
              accessibilityRole="button"
              accessibilityLabel="Protocolo de Emergência"
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: Colors.emergency,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  shadowColor: Colors.emergency,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.45,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }}>
                  SOS
                </Text>
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen name="escudo" options={{ title: 'Escudo' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
      {/* Hidden from tab bar */}
      <Tabs.Screen name="plans" options={{ href: null }} />
    </Tabs>
  );
}
