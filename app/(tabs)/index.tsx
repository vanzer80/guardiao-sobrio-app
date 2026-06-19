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
import { supabase } from '@/lib/supabase';
import { daysSince, todayISO } from '@/lib/sobriety';
import { getMilestoneLabel } from '@/lib/protocolo';
import { getPilarHoje, getPromptHoje } from '@/lib/fundamentos';
import { loadEntryToday, saveEntryToday, extractText, MIN_CHARS } from '@/lib/diario';
import { Colors } from '@/constants/Colors';
import type { Tables } from '@/lib/database.types';

type ChecklistItem = Tables<'checklist_items'>;
type Completion = Tables<'checklist_completions'>;
type Profile = Tables<'profiles'>;
type DiaryEntry = Tables<'diary_entries'>;

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
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
    // Carrega os dados ao montar (e quando loadData mudar).
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

    const userId = session.user.id;
    const today = todayISO();
    const isCompleted = completions.some((c) => c.item_id === itemId);
    const previous = completions; // snapshot para rollback em caso de erro

    setToggling((prev) => new Set(prev).add(itemId));

    // Optimistic update
    if (isCompleted) {
      setCompletions((prev) => prev.filter((c) => c.item_id !== itemId));
    } else {
      setCompletions((prev) => [
        ...prev,
        {
          id: `temp-${itemId}`,
          user_id: userId,
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
          .eq('user_id', userId)
      : await supabase.from('checklist_completions').insert({
          user_id: userId,
          item_id: itemId,
          completed_date: today,
        });

    if (error) {
      // Reverte o update otimista — o banco é a fonte de verdade.
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
      >
        {/* Saudação */}
        <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 4 }}>
          {formatDate(new Date())}
        </Text>
        <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '600', marginBottom: 32 }}>
          {profile?.full_name ? `Olá, ${profile.full_name.split(' ')[0]}` : 'Olá'}
        </Text>

        {/* Marco de dias */}
        {milestoneLabel && (
          <View
            style={{
              backgroundColor: `${Colors.gold}15`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: Colors.gold,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'CormorantGaramond',
                color: Colors.gold,
                fontSize: 32,
                marginBottom: 4,
              }}
            >
              {milestoneLabel}
            </Text>
            <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '600' }}>
              Marco alcançado
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              Cada dia guardado é uma escolha. Parabéns.
            </Text>
          </View>
        )}

        {/* Contador de sobriedade */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            marginBottom: 32,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: 'CormorantGaramond',
              color: Colors.gold,
              fontSize: 72,
              lineHeight: 80,
            }}
          >
            {days ?? '—'}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 15, marginTop: 4 }}>
            {days === 1 ? 'dia guardado' : 'dias guardados'}
          </Text>
          {!profile?.sobriety_start_date && (
            <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Defina sua data de início no perfil
            </Text>
          )}
        </View>

        {/* Checklist diário */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8, marginBottom: 16 }}>
            CHECKLIST DE HOJE
          </Text>

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
                    {/* Checkbox */}
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
                        <Text style={{ color: Colors.bg, fontSize: 12, fontWeight: '700' }}>
                          ✓
                        </Text>
                      )}
                    </View>
                    <Text
                      style={{
                        color: completed ? Colors.muted : Colors.text,
                        fontSize: 16,
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

        {/* Reflexão do Dia */}
        <View style={{ marginTop: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8 }}>
              REFLEXÃO DO DIA · {pilarHoje}
            </Text>
            {diaryEntry && (
              <Text style={{ color: Colors.success, fontSize: 11 }}>✓ salvo</Text>
            )}
          </View>

          <Text style={{ color: Colors.text, fontSize: 15, lineHeight: 22, marginBottom: 16, fontStyle: 'italic' }}>
            {promptHoje}
          </Text>

          {diaryEntry ? (
            <View
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Text style={{ color: Colors.text, fontSize: 14, lineHeight: 22 }}>
                {extractText(diaryEntry)}
              </Text>
              <Text style={{ color: Colors.muted, fontSize: 11, marginTop: 8 }}>
                Entradas do diário não podem ser editadas ou excluídas.
              </Text>
            </View>
          ) : (
            <View>
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
                <Text style={{
                  fontSize: 12,
                  color: diaryText.trim().length >= MIN_CHARS ? Colors.success : Colors.muted,
                }}>
                  {diaryText.trim().length}/{MIN_CHARS} caracteres mínimos
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
                    : <Text style={{ color: Colors.bg, fontWeight: '600', fontSize: 14 }}>Salvar</Text>
                  }
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Text style={{ color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: 40, marginBottom: 8 }}>
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
