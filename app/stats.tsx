/**
 * Tela de Estatísticas — O Guardião Sóbrio
 *
 * Disponível: Essential + Guardião
 * Princípio: presença e progresso, nunca falha ou punição.
 * Exportação PDF para compartilhar com terapeuta.
 *
 * Acessada via Perfil → Ver estatísticas
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useProfileStore } from '@/hooks/useProfileStore';
import { usePlanStore } from '@/hooks/usePlanStore';
import {
  getOverallStats,
  get28DayGrid,
  buildReportHtml,
  type OverallStats,
  type DayStatus,
} from '@/lib/stats';

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
      gap: 4,
    }}>
      <Text style={{ color: Colors.gold, fontSize: 30, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: Colors.muted, fontSize: 11, textAlign: 'center', lineHeight: 16 }}>{label}</Text>
    </View>
  );
}

// ── 28-day grid ───────────────────────────────────────────────────────────────

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function DayGrid({ grid, mode }: { grid: DayStatus[]; mode: 'checklist' | 'diary' }) {
  const firstDate = grid[0]?.date;
  const firstDayOfWeek = firstDate ? new Date(firstDate + 'T12:00:00').getDay() : 0;

  return (
    <View>
      {/* Week header */}
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', color: Colors.muted, fontSize: 10 }}>{d}</Text>
        ))}
      </View>

      {/* Dots — with leading offset for first week */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }} />
        ))}
        {grid.map((day) => {
          const active = mode === 'checklist' ? day.hasChecklist : day.hasDiary;
          return (
            <View
              key={day.date}
              style={{
                width: `${100 / 7}%`,
                aspectRatio: 1,
                padding: 2,
              }}
            >
              <View style={{
                flex: 1,
                borderRadius: 4,
                backgroundColor: active
                  ? mode === 'checklist' ? Colors.success : Colors.gold
                  : Colors.surface,
                borderWidth: 1,
                borderColor: active ? 'transparent' : Colors.border,
              }} />
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: mode === 'checklist' ? Colors.success : Colors.gold }} />
          <Text style={{ color: Colors.muted, fontSize: 11 }}>Realizado</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }} />
          <Text style={{ color: Colors.muted, fontSize: 11 }}>Sem registro</Text>
        </View>
      </View>
    </View>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={{ height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user?.id ?? '');
  const { profile } = useProfileStore();
  const canAccessFeature = usePlanStore((s) => s.canAccessFeature);

  const [stats, setStats] = useState<OverallStats | null>(null);
  const [grid, setGrid] = useState<DayStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const canAccess = canAccessFeature('statistics');

  useEffect(() => {
    if (!userId || !canAccess) return;

    let cancelled = false;
    (async () => {
      try {
        const [s, g] = await Promise.all([
          getOverallStats(userId, profile?.sobriety_start_date ?? null),
          get28DayGrid(userId),
        ]);
        if (!cancelled) { setStats(s); setGrid(g); }
      } catch {
        if (!cancelled) Alert.alert('Erro', 'Não foi possível carregar as estatísticas.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, canAccess, profile?.sobriety_start_date]);

  const handleExportPdf = async () => {
    if (!stats) return;
    try {
      setExporting(true);
      const html = buildReportHtml(stats, grid, profile?.full_name ?? 'Usuário');
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Relatório O Guardião Sóbrio' });
      } else {
        Alert.alert('Compartilhamento indisponível', 'PDF gerado em: ' + uri);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o relatório.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: Colors.gold, fontSize: 16 }}>←</Text>
        </Pressable>
        <Text style={{ fontFamily: 'CormorantGaramond', color: Colors.gold, fontSize: 28, flex: 1 }}>
          Estatísticas
        </Text>
        {stats && (
          <Pressable
            onPress={handleExportPdf}
            disabled={exporting}
            style={{ backgroundColor: Colors.surfaceRaised, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border }}
          >
            {exporting
              ? <ActivityIndicator color={Colors.gold} size="small" />
              : <Text style={{ color: Colors.gold, fontSize: 12, fontWeight: '600' }}>Exportar PDF</Text>}
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8, paddingBottom: 48 }}>

        {/* Paywall */}
        {!canAccess && (
          <View style={{ backgroundColor: `${Colors.gold}11`, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: `${Colors.gold}33`, gap: 12 }}>
            <Text style={{ color: Colors.gold, fontWeight: '700', fontSize: 16 }}>Recurso exclusivo</Text>
            <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22 }}>
              Estatísticas e exportação de relatório estão disponíveis nos planos Essential e Guardião.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/plans')}
              style={{ backgroundColor: Colors.gold, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: Colors.bg, fontWeight: '700' }}>Ver planos</Text>
            </Pressable>
          </View>
        )}

        {/* Loading */}
        {canAccess && loading && (
          <ActivityIndicator color={Colors.gold} size="large" style={{ marginTop: 48 }} />
        )}

        {/* Content */}
        {canAccess && !loading && stats && (
          <>
            {/* Cards resumo */}
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8, marginBottom: 12 }}>
              RESUMO GERAL
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <StatCard value={stats.sobrietyDays} label={'Dias em\njornada'} />
              <StatCard value={`${stats.checklistRate28}%`} label={'Presença\n(28 dias)'} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
              <StatCard value={stats.checklistDays28} label={'Checklist\nrealizados'} />
              <StatCard value={stats.diaryDays30} label={'Entradas\nno diário'} />
            </View>

            {/* Barra de presença */}
            <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10, marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>Presença no checklist</Text>
                <Text style={{ color: Colors.gold, fontSize: 14, fontWeight: '700' }}>{stats.checklistDays28}/28</Text>
              </View>
              <ProgressBar value={stats.checklistDays28} max={28} color={Colors.success} />
              <Text style={{ color: Colors.muted, fontSize: 12 }}>Últimas 4 semanas · sem punição por faltas</Text>
            </View>

            {/* Grid checklist */}
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8, marginBottom: 12 }}>
              CHECKLIST — ÚLTIMOS 28 DIAS
            </Text>
            <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 32 }}>
              <DayGrid grid={grid} mode="checklist" />
            </View>

            {/* Grid diário */}
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8, marginBottom: 12 }}>
              DIÁRIO — ÚLTIMOS 28 DIAS
            </Text>
            <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 32 }}>
              <DayGrid grid={grid} mode="diary" />
            </View>

            {/* SOS este mês */}
            {stats.sosUsageThisMonth > 0 && (
              <View style={{ backgroundColor: `${Colors.emergency}11`, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: `${Colors.emergency}33`, marginBottom: 32 }}>
                <Text style={{ color: Colors.emergency, fontWeight: '700', marginBottom: 4 }}>
                  Protocolo SOS este mês
                </Text>
                <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '700' }}>
                  {stats.sosUsageThisMonth}× ativado
                </Text>
                <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
                  Buscar o protocolo é um ato de autocuidado, não uma fraqueza.
                </Text>
              </View>
            )}

            {/* Export CTA */}
            <Pressable
              onPress={handleExportPdf}
              disabled={exporting}
              style={{ backgroundColor: Colors.surfaceRaised, borderRadius: 12, padding: 18, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 6 }}
            >
              {exporting
                ? <ActivityIndicator color={Colors.gold} />
                : <>
                    <Text style={{ color: Colors.gold, fontWeight: '700', fontSize: 15 }}>Exportar relatório PDF</Text>
                    <Text style={{ color: Colors.muted, fontSize: 12, textAlign: 'center' }}>
                      Compartilhe seu progresso com seu terapeuta ou psicólogo.
                    </Text>
                  </>}
            </Pressable>
          </>
        )}

        {/* Disclaimer */}
        <Text style={{ color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: 40, fontStyle: 'italic', lineHeight: 18 }}>
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.{'\n'}
          Em crise aguda: CVV 188 (24h, sigiloso).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
