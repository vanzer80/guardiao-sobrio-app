/**
 * Programa 30 Dias — O Guardião Sobrio
 * Plano Guardião. Progresso desbloqueado sequencialmente.
 * Certificado ao completar os 30 dias.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usePlanStore } from '@/hooks/usePlanStore';
import { supabase } from '@/lib/supabase';
import { todayISO } from '@/lib/sobriety';
import {
  getDiasPrograma,
  getDiaStatus,
  calcularProgresso,
  type DiaPrograma,
  type DiaProgramaStatus,
} from '@/lib/programa30dias';

// ── Persiste progresso em diary_entries via campo craving_level = 0 (hack)
// usando entry_date no formato 'programa30-dia-N' para distinguir das entradas normais.
// Evita adicionar nova tabela — os dias completos são marcados como entradas especiais.
async function loadDiasCompletos(userId: string): Promise<Set<number>> {
  const { data } = await supabase
    .from('diary_entries')
    .select('entry_date')
    .eq('user_id', userId)
    .like('entry_date', 'programa30-dia-%');

  if (!data) return new Set();
  const dias = data
    .map((r) => parseInt(r.entry_date.replace('programa30-dia-', ''), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 30);
  return new Set(dias);
}

async function marcarDiaCompleto(userId: string, dia: number): Promise<void> {
  await supabase.from('diary_entries').upsert(
    {
      user_id: userId,
      entry_date: `programa30-dia-${dia}`,
      content: { completed: true, completedAt: todayISO() },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,entry_date' },
  );
}

// ── Componente de um dia ──────────────────────────────────────────────────────

function DiaCard({
  dia,
  status,
  onPress,
}: {
  dia: DiaPrograma;
  status: DiaProgramaStatus;
  onPress: () => void;
}) {
  const isCompleted = status === 'completed';
  const isAvailable = status === 'available';

  return (
    <Pressable
      onPress={isAvailable || isCompleted ? onPress : undefined}
      accessibilityRole="button"
      accessibilityLabel={`Dia ${dia.dia}: ${dia.fundamento.titulo}`}
      accessibilityState={{ disabled: status === 'locked' }}
      style={{
        backgroundColor: isCompleted ? `${Colors.success}22` : Colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: isCompleted ? Colors.success : isAvailable ? Colors.gold : Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: status === 'locked' ? 0.4 : 1,
      }}
    >
      {/* Número do dia */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isCompleted ? Colors.success : isAvailable ? `${Colors.gold}22` : Colors.surfaceRaised,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isCompleted ? (
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✓</Text>
        ) : (
          <Text style={{ color: isAvailable ? Colors.gold : Colors.muted, fontWeight: '700', fontSize: 14 }}>
            {dia.dia}
          </Text>
        )}
      </View>

      {/* Conteúdo */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text, fontWeight: '600', fontSize: 14 }}>
          {dia.fundamento.titulo}
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 11, marginTop: 2 }}>
          {dia.fundamento.pilar}
        </Text>
      </View>

      {status === 'locked' && (
        <Text style={{ color: Colors.muted, fontSize: 14 }}>🔒</Text>
      )}
      {isAvailable && (
        <Text style={{ color: Colors.gold, fontSize: 14 }}>→</Text>
      )}
    </Pressable>
  );
}

// ── Modal de detalhe do dia ───────────────────────────────────────────────────

function DetalhesDia({
  dia,
  status,
  onClose,
  onComplete,
}: {
  dia: DiaPrograma;
  status: DiaProgramaStatus;
  onClose: () => void;
  onComplete: () => Promise<void>;
}) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    await onComplete();
    setCompleting(false);
    onClose();
  };

  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: `${Colors.bg}ee`,
        justifyContent: 'flex-end',
      }}
    >
      <View
        style={{
          backgroundColor: Colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          paddingBottom: 40,
          gap: 20,
          maxHeight: '85%',
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8 }}>
              DIA {dia.dia} DE 30
            </Text>
            <Pressable onPress={onClose} hitSlop={16}>
              <Text style={{ color: Colors.muted, fontSize: 20 }}>×</Text>
            </Pressable>
          </View>

          <Text style={{ fontFamily: 'CormorantGaramond', color: Colors.gold, fontSize: 28, marginBottom: 4 }}>
            {dia.fundamento.titulo}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.5, marginBottom: 20 }}>
            {dia.fundamento.pilar}
          </Text>

          {/* Insight */}
          <Text style={{ color: Colors.text, fontSize: 15, lineHeight: 24, fontStyle: 'italic', marginBottom: 20 }}>
            {`"${dia.fundamento.insight}"`}
          </Text>

          {/* Descrição */}
          <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22, marginBottom: 20 }}>
            {dia.fundamento.descricao}
          </Text>

          {/* Prática do dia */}
          <View style={{ backgroundColor: Colors.surfaceRaised, borderRadius: 12, padding: 16, gap: 8, marginBottom: 16 }}>
            <Text style={{ color: Colors.gold, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
              PRÁTICA DO DIA
            </Text>
            <Text style={{ color: Colors.text, fontSize: 14, lineHeight: 22 }}>
              {dia.protocolo}
            </Text>
          </View>

          {/* Prompt */}
          <View style={{ backgroundColor: Colors.surfaceRaised, borderRadius: 12, padding: 16, gap: 8, marginBottom: 20 }}>
            <Text style={{ color: Colors.gold, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
              REFLEXÃO
            </Text>
            <Text style={{ color: Colors.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>
              {dia.prompt}
            </Text>
          </View>

          {/* Ação mínima */}
          <View style={{ borderLeftWidth: 2, borderLeftColor: Colors.gold, paddingLeft: 14, marginBottom: 20 }}>
            <Text style={{ color: Colors.gold, fontSize: 11, letterSpacing: 0.5, marginBottom: 4 }}>AÇÃO MÍNIMA</Text>
            <Text style={{ color: Colors.text, fontSize: 14, lineHeight: 22 }}>
              {dia.fundamento.acaoMinima}
            </Text>
          </View>

          {/* Frase de âncora */}
          <Text style={{ color: Colors.gold, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginBottom: 24 }}>
            {`"${dia.fundamento.fraseAncora}"`}
          </Text>

          <Text style={{ color: Colors.muted, fontSize: 11, textAlign: 'center', marginBottom: 16, lineHeight: 18 }}>
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>

          {/* Botão concluir */}
          {status === 'available' && (
            <Pressable
              onPress={handleComplete}
              disabled={completing}
              style={{
                backgroundColor: Colors.gold,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              {completing
                ? <ActivityIndicator color={Colors.bg} />
                : <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 16 }}>
                    Concluir dia {dia.dia}
                  </Text>}
            </Pressable>
          )}

          {status === 'completed' && (
            <View style={{ backgroundColor: `${Colors.success}22`, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.success }}>
              <Text style={{ color: Colors.success, fontWeight: '700', fontSize: 15 }}>
                ✓ Dia {dia.dia} concluído
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Certificado ───────────────────────────────────────────────────────────────

function Certificado({ nome }: { nome: string }) {
  return (
    <View
      style={{
        backgroundColor: `${Colors.gold}11`,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.gold,
        alignItems: 'center',
        gap: 12,
        marginBottom: 32,
      }}
    >
      <Text style={{ fontFamily: 'CormorantGaramond', color: Colors.gold, fontSize: 28, textAlign: 'center' }}>
        30 Dias Guardados
      </Text>
      <Text style={{ color: Colors.text, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
        {nome} concluiu o Programa 30 Dias do Guardião Sóbrio.
      </Text>
      <Text style={{ color: Colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
        Trinta dias de presença, escolha a escolha. Este certificado é seu — não precisa da aprovação de ninguém.
      </Text>
      <Text style={{ color: Colors.gold, fontSize: 22, marginTop: 8 }}>✦</Text>
    </View>
  );
}

// ── Tela principal ─────────────────────────────────────────────────────────────

export default function Programa30Screen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user?.id ?? '');
  const canAccessFeature = usePlanStore((s) => s.canAccessFeature);
  const [diasCompletos, setDiasCompletos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedDia, setSelectedDia] = useState<DiaPrograma | null>(null);

  const canAccess = canAccessFeature('program30Days');
  const dias = getDiasPrograma();
  const progresso = calcularProgresso(diasCompletos);

  useEffect(() => {
    if (!userId || !canAccess) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const completos = await loadDiasCompletos(userId);
        if (!cancelled) setDiasCompletos(completos);
      } catch {
        if (!cancelled) Alert.alert('Erro', 'Não foi possível carregar seu progresso.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, canAccess]);

  const handleComplete = async (dia: DiaPrograma) => {
    if (!userId) return;
    try {
      await marcarDiaCompleto(userId, dia.dia);
      setDiasCompletos((prev) => new Set([...prev, dia.dia]));
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o progresso. Tente novamente.');
      throw new Error('save failed');
    }
  };

  const selectedStatus = selectedDia ? getDiaStatus(selectedDia.dia, diasCompletos) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={{ color: Colors.gold, fontSize: 16 }}>←</Text>
        </Pressable>
        <Text style={{ fontFamily: 'CormorantGaramond', color: Colors.gold, fontSize: 28, flex: 1 }}>
          Programa 30 Dias
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8, paddingBottom: 48 }}>

        {/* Paywall */}
        {!canAccess && (
          <View style={{ backgroundColor: `${Colors.gold}11`, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: `${Colors.gold}33`, gap: 12 }}>
            <Text style={{ color: Colors.gold, fontWeight: '700', fontSize: 16 }}>Plano Guardião</Text>
            <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22 }}>
              O Programa 30 Dias está disponível exclusivamente no plano Guardião.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/plans')}
              style={{ backgroundColor: Colors.gold, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: Colors.bg, fontWeight: '700' }}>Ver planos</Text>
            </Pressable>
          </View>
        )}

        {/* Conteúdo */}
        {canAccess && loading && (
          <ActivityIndicator color={Colors.gold} size="large" style={{ marginTop: 48 }} />
        )}

        {canAccess && !loading && (
          <>
            {/* Certificado (se completo) */}
            {progresso.certificadoDisponivel && (
              <Certificado nome="Você" />
            )}

            {/* Barra de progresso */}
            <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>Progresso</Text>
                <Text style={{ color: Colors.gold, fontSize: 14, fontWeight: '700' }}>
                  {progresso.completados}/30
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${progresso.percentual}%`,
                    height: '100%',
                    backgroundColor: Colors.gold,
                    borderRadius: 3,
                  }}
                />
              </View>
              <Text style={{ color: Colors.muted, fontSize: 12 }}>
                {progresso.completados === 0
                  ? 'Comece pelo Dia 1'
                  : progresso.certificadoDisponivel
                  ? 'Programa concluído'
                  : `${30 - progresso.completados} dias restantes`}
              </Text>
            </View>

            {/* Lista de dias */}
            <View style={{ gap: 8 }}>
              {dias.map((dia) => {
                const status = getDiaStatus(dia.dia, diasCompletos);
                return (
                  <DiaCard
                    key={dia.dia}
                    dia={dia}
                    status={status}
                    onPress={() => setSelectedDia(dia)}
                  />
                );
              })}
            </View>

            <Text style={{ color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: 32, lineHeight: 18 }}>
              Este app não substitui psiquiatra, psicólogo ou grupos de apoio.{'\n'}
              Em crise aguda: CVV 188 (24h, sigiloso).
            </Text>
          </>
        )}
      </ScrollView>

      {/* Detalhe do dia (overlay) */}
      {selectedDia && selectedStatus && (
        <DetalhesDia
          dia={selectedDia}
          status={selectedStatus}
          onClose={() => setSelectedDia(null)}
          onComplete={() => handleComplete(selectedDia)}
        />
      )}
    </SafeAreaView>
  );
}
