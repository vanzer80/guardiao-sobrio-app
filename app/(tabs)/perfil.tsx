import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { daysSince } from '@/lib/sobriety';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import type { Tables } from '@/lib/database.types';

type Profile = Tables<'profiles'>;

export default function PerfilScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(data);
      setLoading(false);
    })();
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setSignOutLoading(true);
          const { error } = await supabase.auth.signOut();
          if (error) {
            setSignOutLoading(false);
            Alert.alert('Erro ao sair', error.message);
          }
          // Em sucesso, _layout.tsx redireciona para login automaticamente.
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir minha conta',
          style: 'destructive',
          onPress: async () => {
            // TODO: Chamar Edge Function que deleta a conta via service_role (LGPD)
            Alert.alert(
              'Exclusão solicitada',
              'Seus dados serão removidos em até 24h. Se precisar, entre em contato via email.',
            );
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const days = daysSince(profile?.sobriety_start_date ?? null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: Colors.surfaceRaised,
              borderWidth: 2,
              borderColor: Colors.gold,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: Colors.gold, fontSize: 26, fontWeight: '600' }}>
              {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '600' }}>
            {profile?.full_name ?? 'Usuário'}
          </Text>
          {days !== null && (
            <Text style={{ color: Colors.muted, fontSize: 14, marginTop: 4 }}>
              {days} {days === 1 ? 'dia' : 'dias'} guardados
            </Text>
          )}
        </View>

        {/* Info */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: 'Plano',
              value: profile?.is_premium ? 'Premium' : 'Gratuito',
            },
            {
              label: 'Foco',
              value: profile?.substance_focus ?? '—',
            },
            {
              label: 'Início da sobriedade',
              value: profile?.sobriety_start_date
                ? new Date(profile.sobriety_start_date + 'T12:00:00').toLocaleDateString('pt-BR')
                : '—',
            },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                borderBottomColor: Colors.border,
              }}
            >
              <Text style={{ color: Colors.muted, fontSize: 14 }}>{row.label}</Text>
              <Text style={{ color: Colors.text, fontSize: 14 }}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Ações */}
        <View style={{ gap: 12 }}>
          <Button
            title="Sair da conta"
            onPress={handleSignOut}
            variant="secondary"
            loading={signOutLoading}
          />
        </View>

        {/* LGPD — exclusão de conta (2 toques — hard rule) */}
        <Pressable onPress={handleDeleteAccount} style={{ marginTop: 32, alignItems: 'center' }}>
          <Text style={{ color: Colors.danger, fontSize: 13 }}>Excluir minha conta e dados</Text>
        </Pressable>

        {/* Recursos de crise — sempre visíveis (hard rule) */}
        <View
          style={{
            marginTop: 40,
            padding: 16,
            borderRadius: 12,
            backgroundColor: Colors.surfaceRaised,
            borderWidth: 1,
            borderColor: Colors.border,
            gap: 6,
          }}
        >
          <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '600' }}>
            Precisa de ajuda agora?
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 13 }}>CVV — 188 (24h, sigiloso)</Text>
          <Text style={{ color: Colors.muted, fontSize: 13 }}>CAPS — caps.ms/onde-buscar-ajuda</Text>
          <Text style={{ color: Colors.muted, fontSize: 11, marginTop: 4 }}>
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
