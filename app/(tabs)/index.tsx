import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { daysSince, todayISO } from '@/lib/sobriety';
import { getMilestoneLabel } from '@/lib/protocolo';
import { getPilarHoje, getPromptHoje, getFundamentoDodia } from '@/lib/fundamentos';
import { loadEntryToday, saveEntryToday, extractText, MIN_CHARS } from '@/lib/diario';
import { Colors } from '@/constants/Colors';
import type { Tables } from '@/lib/database.types';

type ChecklistItem = Tables<'checklist_items'>;
type Completion = Tables<'checklist_completions'>;
type Profile = Tables<'profiles'>;
type DiaryEntry = Tables<'diary_entries'>;

function formatDateMono(d: Date): string {
  const weekday = d
    .toLocaleDateString('pt-BR', { weekday: 'long' })
    .split('-')[0]
    .toUpperCase();
  const day = d.getDate();
  const month = d.toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  return `${weekday} · ${day} ${month}`;
}

export default function HojeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [diaryEntry, setDiaryEntry] = useState<DiaryEntry | null>(null);
  const [diaryText, setDiaryText] = useState('');
  const [diarySaving, setDiarySaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const pilarHoje = getPilarHoje();
  const promptHoje = getPromptHoje(new Date().getDate());

  const loadData = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const uid = session.user.id;
      setUserId(uid);
      const today = todayISO();

      const [profileRes, itemsRes, completionsRes, entryRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase
          .from('checklist_items')
          .select('*')
          .eq('user_id', uid)
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('checklist_completions')
          .select('*')
          .eq('user_id', uid)
          .eq('completed_date', today),
        loadEntryToday(uid),
      ]);

      setProfile(profileRes.data ?? null);
      setItems(itemsRes.data ?? []);
      setCompletions(completionsRes.data ?? []);
      setDiaryEntry(entryRes);
      setDiaryText(extractText(entryRes));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleItem = async (itemId: string) => {
    if (toggling.has(itemId)) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const uid = session.user.id;
    const today = todayISO();
    const isCompleted = completions.some((c) => c.item_id === itemId);
    const previous = completions;

    setToggling((prev) => new Set(prev).add(itemId));

    if (isCompleted) {
      setCompletions((prev) => prev.filter((c) => c.item_id !== itemId));
    } else {
      setCompletions((prev) => [
        ...prev,
        {
          id: `temp-${itemId}`,
          user_id: uid,
          item_id: itemId,
          completed_date: today,
          completed_at: new Date().toISOString(),
        },
      ]);
    }

    const { error } = isCompleted
      ? await supabase
          .from('checklist_completions')
          .delete()
          .eq('item_id', itemId)
          .eq('completed_date', today)
          .eq('user_id', uid)
      : await supabase.from('checklist_completions').insert({
          user_id: uid,
          item_id: itemId,
          completed_date: today,
        });

    if (error) {
      setCompletions(previous);
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente novamente.');
    }

    setToggling((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleSaveDiary = async () => {
    if (!userId) return;
    setDiarySaving(true);
    const { error } = await saveEntryToday(userId, diaryText);
    setDiarySaving(false);
    if (error) {
      Alert.alert('Não foi possível salvar', error);
    } else {
      const updated = await loadEntryToday(userId);
      setDiaryEntry(updated);
    }
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
  const milestoneLabel = getMilestoneLabel(days);
  const allDone = items.length > 0 && completions.length >= items.length;
  const doneCount = completions.length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const fundamento = getFundamentoDodia(days ?? 0);

  // Próximo marco em N dias
  const MILESTONES = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
  const nextMilestone = MILESTONES.find((m) => (days ?? 0) < m);
  const toMilestone = nextMilestone !== undefined ? nextMilestone - (days ?? 0) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        {/* ── Saudação ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <View>
            <Text style={{ color: Colors.muted, fontSize: 13, fontFamily: 'GeneralSans' }}>
              {profile?.full_name ? `Olá, ${profile.full_name.split(' ')[0]}` : 'Olá'}
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 11, letterSpacing: 1.5, color: Colors.mutedDark, marginTop: 2 }}>
              {formatDateMono(new Date())}
            </Text>
          </View>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: Colors.surfaceRaised,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.07)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="notifications-outline" size={19} color={Colors.muted} />
          </View>
        </View>

        {/* ── Marco de dias (banner — aparece só no dia do marco) ── */}
        {milestoneLabel && (
          <LinearGradient
            colors={['#1f1a10', '#141312']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 20,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: Colors.gold,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'CormorantGaramond', color: Colors.gold, fontSize: 32, marginBottom: 4 }}>
              {milestoneLabel}
            </Text>
            <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '600' }}>Marco alcançado</Text>
            <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              Cada dia guardado é uma escolha.
            </Text>
          </LinearGradient>
        )}

        {/* ── Contador de sobriedade ── */}
        <LinearGradient
          colors={['#1a1917', '#141312']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 18,
            padding: 26,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 22,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.07)',
            marginBottom: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {/* Círculo com contador */}
          <View style={{ position: 'relative', flexShrink: 0 }}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 2,
                borderColor: 'rgba(200,168,75,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'JetBrainsMono-SemiBold', fontSize: 38, color: Colors.gold, lineHeight: 44 }}>
                {days ?? '—'}
              </Text>
            </View>
            {/* Ícone de escudo sobreposto */}
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: 0,
                backgroundColor: Colors.surface,
                borderRadius: 12,
                padding: 3,
              }}
            >
              <Ionicons name="shield" size={18} color={Colors.gold} />
            </View>
          </View>

          {/* Texto direito */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
              Dias construindo
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 13, lineHeight: 20 }}>
              {toMilestone !== null
                ? <>Próximo marco em <Text style={{ color: Colors.gold }}>{toMilestone} {toMilestone === 1 ? 'dia' : 'dias'}</Text>. Sem streak punitiva.</>
                : !profile?.sobriety_start_date
                ? 'Defina sua data de início no perfil.'
                : 'Você chegou nos marcos mais longe.'}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Âncora do Dia ── */}
        <View
          style={{
            backgroundColor: 'rgba(200,168,75,0.07)',
            borderWidth: 1,
            borderColor: 'rgba(200,168,75,0.18)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 28,
          }}
        >
          <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 9, letterSpacing: 2, color: Colors.gold, marginBottom: 10 }}>
            ÂNCORA DO DIA
          </Text>
          <Text style={{ fontFamily: 'CormorantGaramond-Italic', fontSize: 22, lineHeight: 30, color: Colors.text }}>
            {`"${fundamento.fraseAncora}"`}
          </Text>
        </View>

        {/* ── Checklist diário ── */}
        <View style={{ marginBottom: 8 }}>
          {/* Header do checklist */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 10, letterSpacing: 2, color: Colors.muted }}>
              {pilarHoje} · CHECKLIST DIÁRIO
            </Text>
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 13, color: Colors.gold }}>
              {doneCount}/{totalCount}
            </Text>
          </View>

          {/* Barra de progresso 4px */}
          <View style={{ height: 4, borderRadius: 2, backgroundColor: '#211f1d', overflow: 'hidden', marginBottom: 14 }}>
            <View
              style={{
                height: '100%',
                borderRadius: 2,
                backgroundColor: Colors.gold,
                width: `${progressPct}%`,
              }}
            />
          </View>

          {items.length === 0 ? (
            <Text style={{ color: Colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: 24 }}>
              Nenhum item no checklist.{'\n'}Complete o onboarding para criar seus itens.
            </Text>
          ) : (
            <View style={{ gap: 10 }}>
              {items.map((item) => {
                const completed = completions.some((c) => c.item_id === item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleItem(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: completed }}
                    accessibilityLabel={item.title}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: Colors.surface,
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: completed ? Colors.gold : Colors.border,
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: completed ? Colors.gold : Colors.muted,
                        backgroundColor: completed ? Colors.gold : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {completed && (
                        <Ionicons name="checkmark" size={13} color={Colors.bg} />
                      )}
                    </View>
                    <Text
                      style={{
                        color: completed ? Colors.muted : Colors.text,
                        fontSize: 15,
                        textDecorationLine: completed ? 'line-through' : 'none',
                        flex: 1,
                      }}
                    >
                      {item.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {allDone && (
            <View
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                backgroundColor: `${Colors.success}22`,
                borderWidth: 1,
                borderColor: Colors.success,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.success, fontSize: 15, fontWeight: '600' }}>
                Checklist completo hoje
              </Text>
              <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4 }}>
                Cada dia completo constrói o próximo.
              </Text>
            </View>
          )}
        </View>

        {/* ── Reflexão do Dia ── */}
        <View style={{ marginTop: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'JetBrainsMono', fontSize: 10, letterSpacing: 2, color: Colors.muted }}>
              REFLEXÃO DO DIA
            </Text>
            {diaryEntry && (
              <Text style={{ color: Colors.success, fontSize: 11 }}>✓ salvo</Text>
            )}
          </View>

          <Text style={{ color: Colors.text, fontSize: 15, lineHeight: 24, marginBottom: 16, fontStyle: 'italic' }}>
            {promptHoje}
          </Text>

          <TextInput
            value={diaryText}
            onChangeText={setDiaryText}
            placeholder="Escreva sua reflexão aqui..."
            placeholderTextColor={Colors.muted}
            multiline
            textAlignVertical="top"
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: 16,
              color: Colors.text,
              fontSize: 14,
              lineHeight: 22,
              minHeight: 120,
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 12, color: diaryText.trim().length >= MIN_CHARS ? Colors.success : Colors.muted }}>
              {diaryText.trim().length}/{MIN_CHARS} mín.{diaryEntry ? ' · editável' : ''}
            </Text>
            <Pressable
              onPress={handleSaveDiary}
              disabled={diarySaving || diaryText.trim().length < MIN_CHARS}
              style={{
                backgroundColor: diaryText.trim().length >= MIN_CHARS ? Colors.gold : Colors.border,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              {diarySaving
                ? <ActivityIndicator size="small" color={Colors.bg} />
                : <Text style={{ color: Colors.bg, fontWeight: '600', fontSize: 14 }}>
                    {diaryEntry ? 'Atualizar' : 'Salvar'}
                  </Text>}
            </Pressable>
          </View>
          {diaryEntry && (
            <Text style={{ color: Colors.muted, fontSize: 11, marginTop: 4 }}>
              Entradas podem ser editadas, mas não excluídas.
            </Text>
          )}
        </View>

        <Text style={{ color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: 40, marginBottom: 8 }}>
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
