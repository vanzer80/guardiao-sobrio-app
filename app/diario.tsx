import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { extractText } from '@/lib/diario';
import { Colors } from '@/constants/Colors';
import type { Tables } from '@/lib/database.types';

type DiaryEntry = Tables<'diary_entries'>;

function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function DiarioScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('entry_date', { ascending: false });

      setEntries(data ?? []);
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
            Diário
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: Colors.muted, fontSize: 13 }}>← Voltar</Text>
          </Pressable>
        </View>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 22 }}>
          Suas reflexões diárias. Editáveis, nunca excluíveis.
        </Text>

        {entries.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 48,
            }}
          >
            <Text style={{ color: Colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
              Nenhuma reflexão registrada ainda.{'\n'}
              Escreva sua primeira reflexão na tela Hoje.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {entries.map((entry) => {
              const text = extractText(entry);
              const isExpanded = expandedId === entry.id;
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => setExpandedId(isExpanded ? null : entry.id)}
                  style={{
                    backgroundColor: Colors.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    padding: 16,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: isExpanded ? 12 : 0,
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.gold,
                        fontSize: 13,
                        fontWeight: '600',
                        flex: 1,
                      }}
                    >
                      {formatEntryDate(entry.entry_date)}
                    </Text>
                    <Text style={{ color: Colors.muted, fontSize: 16 }}>
                      {isExpanded ? '−' : '+'}
                    </Text>
                  </View>
                  {!isExpanded && (
                    <Text
                      style={{ color: Colors.muted, fontSize: 13, lineHeight: 18, marginTop: 4 }}
                      numberOfLines={2}
                    >
                      {text}
                    </Text>
                  )}
                  {isExpanded && (
                    <Text style={{ color: Colors.text, fontSize: 14, lineHeight: 22 }}>
                      {text}
                    </Text>
                  )}
                </Pressable>
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
