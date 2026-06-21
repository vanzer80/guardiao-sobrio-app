/**
 * Escudo — Mapa de Gatilhos + Módulo Familiar
 *
 * Gatilhos: Essential + Guardião
 * Familiar: Guardião only
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { usePlanStore } from '@/hooks/usePlanStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  listTriggers,
  createTrigger,
  deleteTrigger,
  RISK_LABELS,
  RISK_COLORS,
  type UserTrigger,
} from '@/lib/triggers';
import {
  getActiveConnection,
  createInvite,
  revokeAccess,
  type FamilyConnection,
} from '@/lib/family';
import { useRouter } from 'expo-router';

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// ── Paywall banner ──────────────────────────────────────────────────────────

function PaywallBanner({ message }: { message: string }) {
  const router = useRouter();
  return (
    <View style={{ margin: 16, padding: 16, backgroundColor: `${Colors.gold}11`, borderRadius: 12, borderWidth: 1, borderColor: `${Colors.gold}33` }}>
      <Text style={{ color: Colors.gold, fontWeight: '700', marginBottom: 4 }}>Recurso exclusivo</Text>
      <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 12 }}>{message}</Text>
      <Pressable
        onPress={() => router.push('/(tabs)/plans')}
        style={{ backgroundColor: Colors.gold, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: Colors.bg, fontWeight: '700' }}>Ver planos</Text>
      </Pressable>
    </View>
  );
}

// ── Trigger form modal ──────────────────────────────────────────────────────

function TriggerFormModal({
  visible,
  userId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSaved: (t: UserTrigger) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [riskLevel, setRiskLevel] = useState(3);
  const [coping, setCoping] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(''); setDescription(''); setRiskLevel(3); setCoping(''); };

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert('Campo obrigatório', 'Dê um nome ao gatilho.');
      return;
    }
    try {
      setSaving(true);
      const copping_arr = coping.split('\n').map((s) => s.trim()).filter(Boolean);
      const t = await createTrigger({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        risk_level: riskLevel,
        coping_strategies: copping_arr.length ? copping_arr : null,
        is_active: true,
        category_id: null,
        location_lat: null,
        location_lng: null,
        location_name: null,
        people_involved: null,
      });
      onSaved(t);
      reset();
      onClose();
    } catch {
      showAlert('Erro', 'Não foi possível salvar o gatilho.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <Text style={{ color: Colors.gold, fontSize: 20, fontWeight: '700' }}>Novo gatilho</Text>

          <View style={{ gap: 6 }}>
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.5 }}>NOME DO GATILHO *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Sextas à noite em bares"
              placeholderTextColor={Colors.muted}
              style={{ backgroundColor: Colors.surface, color: Colors.text, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.5 }}>DESCRIÇÃO (opcional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Quando, onde e como isso acontece"
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={3}
              style={{ backgroundColor: Colors.surface, color: Colors.text, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <View style={{ gap: 10 }}>
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.5 }}>NÍVEL DE RISCO</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setRiskLevel(level)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
                    backgroundColor: riskLevel === level ? RISK_COLORS[level] : Colors.surface,
                    borderWidth: 1,
                    borderColor: riskLevel === level ? RISK_COLORS[level] : Colors.border,
                  }}
                >
                  <Text style={{ color: riskLevel === level ? '#fff' : Colors.muted, fontWeight: '700' }}>{level}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ color: RISK_COLORS[riskLevel], fontSize: 13, textAlign: 'center' }}>
              {RISK_LABELS[riskLevel]}
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.5 }}>ESTRATÉGIAS DE ENFRENTAMENTO</Text>
            <TextInput
              value={coping}
              onChangeText={setCoping}
              placeholder={'Uma por linha:\nLigar para um amigo\nSair do ambiente\nRespira 4-4-6'}
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={4}
              style={{ backgroundColor: Colors.surface, color: Colors.text, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, minHeight: 100, textAlignVertical: 'top' }}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: Colors.gold, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 }}
          >
            {saving
              ? <ActivityIndicator color={Colors.bg} />
              : <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 16 }}>Salvar gatilho</Text>}
          </Pressable>

          <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: Colors.muted }}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Trigger card ─────────────────────────────────────────────────────────────

function TriggerCard({ trigger, onDelete }: { trigger: UserTrigger; onDelete: (id: string) => void }) {
  const color = RISK_COLORS[trigger.risk_level] ?? Colors.muted;

  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remover "${trigger.title}"?`)) onDelete(trigger.id);
      return;
    }
    Alert.alert('Remover gatilho', `Remover "${trigger.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => onDelete(trigger.id) },
    ]);
  };

  return (
    <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, borderLeftColor: color, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 15 }}>{trigger.title}</Text>
          <Text style={{ color, fontSize: 11, letterSpacing: 0.5 }}>
            Risco {RISK_LABELS[trigger.risk_level].toUpperCase()}
          </Text>
        </View>
        <Pressable onPress={confirmDelete} hitSlop={12}>
          <Text style={{ color: Colors.muted, fontSize: 18 }}>×</Text>
        </Pressable>
      </View>

      {trigger.description ? (
        <Text style={{ color: Colors.muted, fontSize: 13, lineHeight: 20 }}>{trigger.description}</Text>
      ) : null}

      {trigger.coping_strategies?.length ? (
        <View style={{ gap: 4, marginTop: 4 }}>
          <Text style={{ color: Colors.gold, fontSize: 11, letterSpacing: 0.5 }}>ESTRATÉGIAS</Text>
          {trigger.coping_strategies.map((s, i) => (
            <Text key={i} style={{ color: Colors.text, fontSize: 13 }}>· {s}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ── Familiar section ─────────────────────────────────────────────────────────

function FamiliarSection({ userId }: { userId: string }) {
  const [conn, setConn] = useState<FamilyConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const c = await getActiveConnection(userId);
        if (!cancelled) setConn(c);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleInvite = async () => {
    if (!inviteName.trim()) {
      showAlert('Campo obrigatório', 'Informe o nome do familiar.');
      return;
    }
    try {
      setInviting(true);
      const c = await createInvite(userId, inviteName.trim());
      setConn(c);
      setShowInviteForm(false);
      setInviteName('');
    } catch (err) {
      showAlert('Erro', err instanceof Error ? err.message : 'Não foi possível gerar o convite.');
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = () => {
    if (!conn) return;
    const doRevoke = async () => {
      try {
        await revokeAccess(conn.id);
        setConn(null);
      } catch {
        showAlert('Erro', 'Não foi possível revogar o acesso.');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remover acesso de ${conn.family_name}? Essa ação é imediata.`)) doRevoke();
      return;
    }
    Alert.alert(
      'Revogar acesso',
      `Remover acesso de ${conn.family_name}? Essa ação é imediata.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Revogar', style: 'destructive', onPress: doRevoke },
      ]
    );
  };

  if (loading) return <ActivityIndicator color={Colors.gold} style={{ marginTop: 12 }} />;

  // Conexão ativa (pending ou accepted)
  if (conn) {
    const isPending = conn.invitation_status === 'pending';
    const isExpired = conn.invitation_expires_at
      ? new Date(conn.invitation_expires_at) < new Date()
      : false;

    return (
      <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: Colors.text, fontWeight: '700', fontSize: 15 }}>{conn.family_name}</Text>
          <View style={{ backgroundColor: isPending ? `${Colors.emergency}22` : `${Colors.success}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ color: isPending ? Colors.emergency : Colors.success, fontSize: 11, fontWeight: '600' }}>
              {isPending ? (isExpired ? 'EXPIRADO' : 'AGUARDANDO') : 'CONECTADO'}
            </Text>
          </View>
        </View>

        {isPending && conn.invitation_token && !isExpired && (
          <View style={{ backgroundColor: Colors.surfaceRaised, borderRadius: 10, padding: 14, alignItems: 'center', gap: 6 }}>
            <Text style={{ color: Colors.muted, fontSize: 12 }}>Código de convite (expira em 48h)</Text>
            <Text style={{ color: Colors.gold, fontSize: 32, fontWeight: '700', letterSpacing: 6 }}>
              {conn.invitation_token}
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 11 }}>Compartilhe este código com {conn.family_name}</Text>
          </View>
        )}

        {isPending && isExpired && (
          <Text style={{ color: Colors.muted, fontSize: 13 }}>Código expirado. Gere um novo convite.</Text>
        )}

        {!isPending && (
          <Text style={{ color: Colors.muted, fontSize: 13 }}>
            {conn.family_name} vê apenas: dia guardado (sim/não). Sem acesso ao diário, contador ou detalhes.
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {(isPending && isExpired) && (
            <Pressable
              onPress={handleInvite}
              style={{ flex: 1, backgroundColor: Colors.gold, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: Colors.bg, fontWeight: '700' }}>Renovar convite</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleRevoke}
            style={{ flex: 1, backgroundColor: `${Colors.danger}22`, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.danger }}
          >
            <Text style={{ color: Colors.danger, fontWeight: '700' }}>Revogar acesso</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Sem conexão — form de convite
  if (showInviteForm) {
    return (
      <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 14 }}>
        <Text style={{ color: Colors.text, fontWeight: '700' }}>Convidar familiar</Text>
        <TextInput
          value={inviteName}
          onChangeText={setInviteName}
          placeholder="Nome do familiar"
          placeholderTextColor={Colors.muted}
          style={{ backgroundColor: Colors.surfaceRaised, color: Colors.text, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border }}
        />
        <Text style={{ color: Colors.muted, fontSize: 12, lineHeight: 18 }}>
          O familiar receberá um código de 6 dígitos válido por 48h. Ele verá apenas se seu dia foi guardado — sem diário, sem detalhes.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => setShowInviteForm(false)} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ color: Colors.muted }}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={handleInvite}
            disabled={inviting}
            style={{ flex: 1, backgroundColor: Colors.gold, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
          >
            {inviting
              ? <ActivityIndicator color={Colors.bg} size="small" />
              : <Text style={{ color: Colors.bg, fontWeight: '700' }}>Gerar código</Text>}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => setShowInviteForm(true)}
      style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 8 }}
    >
      <Text style={{ color: Colors.gold, fontSize: 22 }}>+</Text>
      <Text style={{ color: Colors.text, fontWeight: '600' }}>Convidar familiar</Text>
      <Text style={{ color: Colors.muted, fontSize: 12, textAlign: 'center' }}>
        Compartilhe seu progresso diário com segurança.
      </Text>
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EscudoScreen() {
  const canAccessFeature = usePlanStore((s) => s.canAccessFeature);
  usePlanStore((s) => s.plan);
  usePlanStore((s) => s.trialEnd);
  const userId = useAuthStore((s) => s.session?.user?.id ?? '');
  const [triggers, setTriggers] = useState<UserTrigger[]>([]);
  const [loadingTriggers, setLoadingTriggers] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const canAccessTriggers = canAccessFeature('triggerMap');
  const canAccessFamily = canAccessFeature('familyModule');

  useEffect(() => {
    if (!userId || !canAccessTriggers) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingTriggers(true);
        const result = await listTriggers(userId);
        if (!cancelled) setTriggers(result);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingTriggers(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, canAccessTriggers]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTrigger(id);
      setTriggers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      showAlert('Erro', 'Não foi possível remover o gatilho.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>

        {/* Header */}
        <Text style={{ fontFamily: 'CormorantGaramond', color: Colors.gold, fontSize: 36, marginBottom: 4 }}>
          Escudo
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 22 }}>
          Proteção ativa: mapeie seus gatilhos e conecte sua rede de apoio.
        </Text>

        {/* ── MAPA DE GATILHOS ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8 }}>MAPA DE GATILHOS</Text>
          {canAccessTriggers && (
            <Pressable
              onPress={() => setShowForm(true)}
              style={{ backgroundColor: Colors.gold, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}
            >
              <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 13 }}>+ Novo</Text>
            </Pressable>
          )}
        </View>

        {!canAccessTriggers ? (
          <PaywallBanner message="O Mapa de Gatilhos está disponível nos planos Essential e Guardião." />
        ) : loadingTriggers ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: 16 }} />
        ) : triggers.length === 0 ? (
          <Pressable
            onPress={() => setShowForm(true)}
            style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 8 }}
          >
            <Text style={{ color: Colors.gold, fontSize: 22 }}>+</Text>
            <Text style={{ color: Colors.text, fontWeight: '600' }}>Adicionar primeiro gatilho</Text>
            <Text style={{ color: Colors.muted, fontSize: 12, textAlign: 'center' }}>
              Reconhecer o perigo antes dele chegar é o primeiro passo do Escudo.
            </Text>
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            {triggers.map((t) => (
              <TriggerCard key={t.id} trigger={t} onDelete={handleDelete} />
            ))}
          </View>
        )}

        {/* ── MÓDULO FAMILIAR ── */}
        <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8, marginTop: 40, marginBottom: 12 }}>
          MÓDULO FAMILIAR
        </Text>

        {!canAccessFamily ? (
          <PaywallBanner message="O Módulo Familiar está disponível no plano Guardião." />
        ) : (
          <FamiliarSection userId={userId} />
        )}

        {/* Disclaimer */}
        <Text style={{ color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: 40, fontStyle: 'italic', lineHeight: 18 }}>
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.{'\n'}
          Em crise aguda: CVV 188 (24h, sigiloso).
        </Text>
      </ScrollView>

      <TriggerFormModal
        visible={showForm}
        userId={userId}
        onClose={() => setShowForm(false)}
        onSaved={(t) => setTriggers((prev) => [t, ...prev])}
      />
    </SafeAreaView>
  );
}
