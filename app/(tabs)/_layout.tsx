import { Tabs, useRouter } from 'expo-router';
import { Pressable, View, Animated } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

function SosButton() {
  const router = useRouter();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] });

  return (
    <Pressable
      onPress={() => router.navigate('/(tabs)/protocolo')}
      accessibilityRole="button"
      accessibilityLabel="Protocolo de Emergência SOS"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Anel pulsante atrás do botão */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: Colors.emergency,
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
          marginBottom: 12,
        }}
      />
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: Colors.emergency,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          shadowColor: Colors.emergency,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 14,
          elevation: 12,
        }}
      >
        <Ionicons name="shield" size={26} color={Colors.bg} />
      </View>
    </Pressable>
  );
}

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
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="metodo"
        options={{
          title: 'Método',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="protocolo"
        options={{
          title: '',
          tabBarButton: () => <SosButton />,
        }}
      />
      <Tabs.Screen
        name="escudo"
        options={{
          title: 'Escudo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden from tab bar */}
      <Tabs.Screen name="plans" options={{ href: null }} />
    </Tabs>
  );
}
