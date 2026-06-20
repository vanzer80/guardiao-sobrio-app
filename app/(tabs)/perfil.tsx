import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Switch,
  TextInput,
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { isBiometricLockEnabled, setBiometricLockEnabled } from '@/lib/appLock';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/hooks/useProfileStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { daysSince } from '@/lib/sobriety';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import type { Tables } from '@/lib/database.types';
import { cancelAllReminders, scheduleDailyReminder } from '@/lib/notifications';
import { usePlanStore } from '@/hooks/usePlanStore';

type Profile = Tables<'profiles'>;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito',
  essential: 'Essential',
  guardian: 'Guardião',
};

export default function PerfilScreen() {
  const router = useRouter();
  const { profile: storeProfile, setProfile: setStoreProfile } = useProfileStore();
  const { setSession } = useAuthStore();
  const plan = usePlanStore((s) => s.plan);
  const [profile, setProfile] = useState<Profile | null>(storeProfile);
  const [loading, setLoading] = useState(!storeProfile);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(() => isBiometricLockEnabled());
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<TextInput>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserEmail(session.user.email ?? '');

      if (!storeProfile) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
        setLoading(false);
      }

      const hasBiometric = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasBiometric && isEnrolled);
    })();
  }, [storeProfile]);

  const startEditingName = () => {
    setNameValue(profile?.full_name ?? '');
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === profile?.full_name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSavingName(false); return; }

    const { data: updated } = await supabase
      .from('profiles')
      .update({ full_name: trimmed })
      .eq('id', session.user.id)
      .select()
      .single();

    if (updated) {
      setProfile(updated);
      setStoreProfile(updated);
    }
    setSavingName(false);
    setEditingName(false);
  };

  const performSignOut = async () => {
    setSignOutLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      // Limpa stores explicitamente; onAuthStateChange também dispara em _layout,
      // mas chamada direta garante consistência se o evento atrasar.
      setStoreProfile(null);
      setSession(null);
      router.replace('/(auth)/welcome');
    } catch (err) {
      Alert.alert('Erro ao sair', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setSignOutLoading(false);
    }
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      // Alert.alert na web delega para window.confirm(), que browsers modernos
      // bloqueiam quando chamado dentro de handlers assíncronos do React.
      // window.confirm() síncrono direto é confiável e não é bloqueado.
      if (window.confirm('Tem certeza que deseja sair da conta?')) performSignOut();
      return;
    }
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: performSignOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta e dados',
      'Todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir tudo',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Erro ao excluir conta');
      }

      await supabase.auth.signOut();
    } catch (err) {
      setDeleteLoading(false);
      Alert.alert('Erro', err instanceof Error ? err.message : 'Tente novamente.');
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotifEnabled(value);
    if (value) {
      await scheduleDailyReminder(9, 0);
    } else {
      await cancelAllReminders();
    }
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Ative a proteção por biometria',
        cancelLabel: 'Cancelar',
      });
      if (!result.success) return;
    }
    setBiometricEnabled(value);
    setBiometricLockEnabled(value);
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

        {/* Header — avatar + nome editável */}
        <View style={{ marginBottom: 32, alignItems: 'flex-start' }}>
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

          {editingName ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                ref={nameInputRef}
                value={nameValue}
                onChangeText={setNameValue}
                onBlur={saveName}
                onSubmitEditing={saveName}
                autoFocus
                style={{
                  color: Colors.text,
                  fontSize: 22,
                  fontWeight: '600',
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.gold,
                  minWidth: 160,
                  paddingBottom: 2,
                }}
              />
              {savingName && <ActivityIndicator size="small" color={Colors.gold} />}
            </View>
          ) : (
            <Pressable onPress={startEditingName} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '600' }}>
                {profile?.full_name || 'Usuário'}
              </Text>
              <Text style={{ color: Colors.muted, fontSize: 12 }}>✎</Text>
            </Pressable>
          )}

          <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 2 }}>{userEmail}</Text>

          {days !== null && (
            <Text style={{ color: Colors.muted, fontSize: 14, marginTop: 4 }}>
              {days} {days === 1 ? 'dia' : 'dias'} guardados
            </Text>
          )}
        </View>

        {/* Info da conta */}
        <InfoCard rows={[
          { label: 'Plano', value: PLAN_LABEL[plan] ?? 'Gratuito' },
          { label: 'Foco', value: profile?.substance_focus ?? '—' },
          {
            label: 'Sobriedade desde',
            value: profile?.sobriety_start_date
              ? new Date(profile.sobriety_start_date + 'T12:00:00').toLocaleDateString('pt-BR')
              : '—',
          },
        ]} />

        {/* Progresso */}
        <SectionTitle>Progresso</SectionTitle>
        <Pressable
          onPress={() => router.push('/stats')}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View>
            <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 15 }}>Ver estatísticas</Text>
            <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>Checklist, diário e relatório PDF</Text>
          </View>
          <Text style={{ color: Colors.gold, fontSize: 18 }}>→</Text>
        </Pressable>

        {/* Programa 30 Dias — Guardian only */}
        <Pressable
          onPress={() => router.push('/programa30')}
          style={{
            backgroundColor: plan === 'guardian' ? `${Colors.gold}11` : Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: plan === 'guardian' ? Colors.gold : Colors.border,
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <View>
            <Text style={{ color: plan === 'guardian' ? Colors.gold : Colors.muted, fontWeight: '600', fontSize: 15 }}>
              Programa 30 Dias
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>
              {plan === 'guardian' ? 'Conteúdo progressivo com certificado' : 'Plano Guardião'}
            </Text>
          </View>
          <Text style={{ color: plan === 'guardian' ? Colors.gold : Colors.muted, fontSize: 18 }}>→</Text>
        </Pressable>

        {/* Configurações */}
        <SectionTitle>Configurações</SectionTitle>
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.border,
            marginBottom: 24,
          }}
        >
          <ToggleRow
            label="Lembrete diário"
            sublabel="09:00 — desative para silenciar"
            value={notifEnabled}
            onChange={toggleNotifications}
          />
          {biometricAvailable && (
            <ToggleRow
              label="Biometria / PIN"
              sublabel="Protege o app ao retornar do fundo"
              value={biometricEnabled}
              onChange={toggleBiometric}
              borderTop
            />
          )}
        </View>

        {/* Ações */}
        <View style={{ gap: 12, marginBottom: 8 }}>
          <Button
            title="Sair da conta"
            onPress={handleSignOut}
            variant="secondary"
            loading={signOutLoading}
          />
        </View>

        {/* LGPD — exclusão em 2 toques */}
        <Pressable
          onPress={handleDeleteAccount}
          disabled={deleteLoading}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          {deleteLoading
            ? <ActivityIndicator color={Colors.danger} />
            : <Text style={{ color: Colors.danger, fontSize: 13 }}>Excluir minha conta e todos os dados</Text>
          }
        </Pressable>

        {/* CVV / CAPS — hard rule: sempre visível */}
        <View
          style={{
            marginTop: 40,
            padding: 16,
            borderRadius: 12,
            backgroundColor: Colors.surfaceRaised,
            borderWidth: 1,
            borderColor: Colors.border,
            gap: 8,
          }}
        >
          <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '600' }}>
            Precisa de ajuda agora?
          </Text>

          <Pressable onPress={() => Linking.openURL('tel:188')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: Colors.emergency, fontSize: 13, fontWeight: '600' }}>CVV 188</Text>
            <Text style={{ color: Colors.muted, fontSize: 13 }}>— gratuito, 24h, sigiloso</Text>
          </Pressable>

          <Pressable onPress={() => Linking.openURL('https://caps.ms/onde-buscar-ajuda')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '600' }}>CAPS</Text>
            <Text style={{ color: Colors.muted, fontSize: 13 }}>— rede pública de saúde mental</Text>
          </Pressable>

          <Text style={{ color: Colors.muted, fontSize: 11, marginTop: 4 }}>
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8, marginTop: 8 }}>
      {children.toUpperCase()}
    </Text>
  );
}

function InfoCard({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <View
      style={{
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 24,
      }}
    >
      {rows.map((row, i) => (
        <View
          key={row.label}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: i < rows.length - 1 ? 1 : 0,
            borderBottomColor: Colors.border,
          }}
        >
          <Text style={{ color: Colors.muted, fontSize: 14 }}>{row.label}</Text>
          <Text style={{ color: Colors.text, fontSize: 14 }}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

function ToggleRow({
  label, sublabel, value, onChange, borderTop,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  borderTop?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: borderTop ? 1 : 0,
        borderTopColor: Colors.border,
      }}
    >
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text style={{ color: Colors.text, fontSize: 15 }}>{label}</Text>
        {sublabel && <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.gold }}
        thumbColor="#fff"
      />
    </View>
  );
}
