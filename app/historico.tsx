import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

type CompletionSummary = {
  completed_date: string;
  count: number;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export default function HistoricoScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<CompletionSummary[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      const [itemsRes, completionsRes] = await Promise.all([
        supabase
          .from('checklist_items')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('is_active', true),
        supabase
          .from('checklist_completions')
          .select('completed_date')
          .eq('user_id', uid)
          .order('completed_date', { ascending: false })
          .limit(90),
      ]);

      setTotalItems(itemsRes.count ?? 0);

      const grouped: Record<string, number> = {};
      for (const row of completionsRes.data ?? []) {
        grouped[row.completed_date] = (grouped[row.completed_date] ?? 0) + 1;
      }
      const sorted = Object.entries(grouped)
        .map(([completed_date, count]) => ({ completed_date, count }))
        .sort((a, b) => b.completed_date.localeCompare(a.completed_date));

      setSummary(sorted);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontFamily: 'CormorantGaramond',
              color: Colors.gold,
              fontSize: 36,
            }}
          >
            Histórico
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: Colors.muted, fontSize: 13 }}>← Voltar</Text>
          </Pressable>
        </View>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 22 }}>
          Últimos 90 dias de checklist diário.
        </Text>

        {summary.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
              Nenhum item concluído ainda.{'\n'}Complete o checklist diário na tela Hoje.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {summary.map((day) => {
              const pct = totalItems > 0 ? day.count / totalItems : 0;
              const isComplete = day.count >= totalItems && totalItems > 0;
              return (
                <View
                  key={day.completed_date}
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isComplete ? Colors.gold : Colors.border,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isComplete ? Colors.gold : Colors.text, fontSize: 14, fontWeight: '600' }}>
                      {formatDate(day.completed_date)}
                    </Text>
                    <View
                      style={{
                        height: 3,
                        borderRadius: 2,
                        backgroundColor: Colors.border,
                        marginTop: 6,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          backgroundColor: isComplete ? Colors.gold : Colors.muted,
                          width: `${pct * 100}%`,
                        }}
                      />
                    </View>
                  </View>
                  <Text style={{ color: isComplete ? Colors.gold : Colors.muted, fontSize: 13 }}>
                    {day.count}/{totalItems}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Text
          style={{
            color: Colors.muted,
            fontSize: 11,
            textAlign: 'center',
            marginTop: 40,
            fontStyle: 'italic',
          }}
        >
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
