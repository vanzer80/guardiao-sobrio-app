import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { daysSince } from '@/lib/sobriety';
import { useProfileStore } from '@/hooks/useProfileStore';
import {
  FUNDAMENTOS,
  getPilarHoje,
  getFundamentoDodia,
  isFundamentoLocked,
  type Fundamento,
} from '@/lib/fundamentos';

const PILAR_META: Record<'ESPELHO' | 'TÁTICA' | 'ESCUDO' | 'LIVRE', { color: string; desc: string }> = {
  ESPELHO: {
    color: Colors.gold,
    desc: 'Autoanálise honesta: o que está funcionando, o que precisa mudar e quais padrões você reconhece.',
  },
  TÁTICA: {
    color: Colors.text,
    desc: 'Planejamento prático: estratégias concretas para os próximos dias, antecipação de riscos e ajuste de rota.',
  },
  ESCUDO: {
    color: Colors.muted,
    desc: 'Proteção e cuidado: construção de rotinas, limites saudáveis e redes de apoio que sustentam a sobriedade.',
  },
  LIVRE: {
    color: Colors.success,
    desc: 'Descanso intencional. Sem metas, sem análise. Apenas estar presente.',
  },
};

const PILAR_DAYS: Record<'ESPELHO' | 'TÁTICA' | 'ESCUDO' | 'LIVRE', string> = {
  ESPELHO: 'Seg & Qui',
  TÁTICA: 'Ter & Sex',
  ESCUDO: 'Qua & Sáb',
  LIVRE: 'Dom',
};

const PILAR_COLOR: Record<string, string> = {
  ESPELHO: Colors.gold,
  TÁTICA: Colors.text,
  ESCUDO: Colors.muted,
};

export default function MetodoScreen() {
  const { profile } = useProfileStore();
  const days = daysSince(profile?.sobriety_start_date ?? null) ?? 0;
  const pilarHoje = getPilarHoje();
  const pilarMeta = PILAR_META[pilarHoje];
  const fundamentoHoje = getFundamentoDodia(days);
  const isPremium = profile?.is_premium ?? false;
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [aplicados, setAplicados] = useState<Set<number>>(new Set());

  const toggleAplicado = (id: number) => {
    setAplicados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>

        {/* Header */}
        <Text style={{ fontFamily: 'CormorantGaramond', color: Colors.gold, fontSize: 36, marginBottom: 4 }}>
          O Método
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 32, lineHeight: 22 }}>
          Três pilares rotativos que estruturam a sua semana.
        </Text>

        {/* Pilar do dia — destaque */}
        <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8, marginBottom: 10 }}>
          PILAR DE HOJE
        </Text>
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: Colors.border,
            borderLeftWidth: 3,
            borderLeftColor: pilarMeta.color,
            marginBottom: 32,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: pilarMeta.color, fontSize: 18, fontWeight: '700', letterSpacing: 1 }}>
              {pilarHoje}
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 12 }}>{PILAR_DAYS[pilarHoje]}</Text>
          </View>
          <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22 }}>
            {pilarMeta.desc}
          </Text>
        </View>

        {/* Os outros pilares — compactos */}
        <View style={{ gap: 10, marginBottom: 40 }}>
          {(['ESPELHO', 'TÁTICA', 'ESCUDO'] as const)
            .filter((p) => p !== pilarHoje)
            .map((p) => (
              <View
                key={p}
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: PILAR_COLOR[p] ?? Colors.muted, fontSize: 14, fontWeight: '600', letterSpacing: 0.8 }}>{p}</Text>
                <Text style={{ color: Colors.muted, fontSize: 12 }}>{PILAR_DAYS[p]}</Text>
              </View>
            ))}
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: Colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: Colors.success, fontSize: 14, fontWeight: '600' }}>LIVRE</Text>
            <Text style={{ color: Colors.muted, fontSize: 12 }}>Dom</Text>
          </View>
        </View>

        {/* Fundamento do Dia */}
        <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8, marginBottom: 10 }}>
          FUNDAMENTO DO DIA
        </Text>
        <FundamentoCard
          f={fundamentoHoje}
          expanded={expandedId === fundamentoHoje.id}
          aplicado={aplicados.has(fundamentoHoje.id)}
          locked={false}
          onToggleExpand={() => setExpandedId(expandedId === fundamentoHoje.id ? null : fundamentoHoje.id)}
          onToggleAplicado={() => toggleAplicado(fundamentoHoje.id)}
          highlight
        />

        {/* Os 13 Fundamentos */}
        <Text style={{ color: Colors.muted, fontSize: 12, letterSpacing: 0.8, marginTop: 40, marginBottom: 10 }}>
          OS 13 FUNDAMENTOS
        </Text>
        <View style={{ gap: 8 }}>
          {FUNDAMENTOS.map((f) => {
            const locked = isFundamentoLocked(f.id, isPremium);
            return (
              <FundamentoCard
                key={f.id}
                f={f}
                expanded={!locked && expandedId === f.id}
                aplicado={aplicados.has(f.id)}
                locked={locked}
                onToggleExpand={() => {
                  if (locked) return;
                  setExpandedId(expandedId === f.id ? null : f.id);
                }}
                onToggleAplicado={() => toggleAplicado(f.id)}
              />
            );
          })}
        </View>
        {!isPremium && (
          <View style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            backgroundColor: `${Colors.gold}0d`,
            borderWidth: 1,
            borderColor: `${Colors.gold}33`,
          }}>
            <Text style={{ color: Colors.gold, fontSize: 13, fontWeight: '600', marginBottom: 4 }}>
              10 fundamentos bloqueados
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 13 }}>
              Planos Essential e Guardião desbloqueiam todos os 13 fundamentos.
            </Text>
          </View>
        )}

        <Text style={{ color: Colors.muted, fontSize: 12, textAlign: 'center', marginTop: 40, fontStyle: 'italic' }}>
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FundamentoCard({
  f, expanded, aplicado, locked, onToggleExpand, onToggleAplicado, highlight = false,
}: {
  f: Fundamento;
  expanded: boolean;
  aplicado: boolean;
  locked: boolean;
  onToggleExpand: () => void;
  onToggleAplicado: () => void;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: highlight ? `${Colors.gold}0d` : Colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: highlight ? `${Colors.gold}44` : Colors.border,
        overflow: 'hidden',
        opacity: locked ? 0.5 : 1,
      }}
    >
      <Pressable
        onPress={onToggleExpand}
        style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Text style={{ color: Colors.muted, fontSize: 12, width: 20 }}>{f.id}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '600' }}>{f.titulo}</Text>
          <Text style={{ color: PILAR_COLOR[f.pilar] ?? Colors.muted, fontSize: 11, marginTop: 2 }}>
            {f.pilar}
          </Text>
        </View>
        <Text style={{ color: Colors.muted, fontSize: 16 }}>
          {locked ? '🔒' : expanded ? '−' : '+'}
        </Text>
      </Pressable>

      {expanded && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}>
          {/* Insight */}
          <Text style={{ color: Colors.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>
            {`“${f.insight}”`}
          </Text>
          {/* Descrição */}
          <Text style={{ color: Colors.muted, fontSize: 14, lineHeight: 22 }}>{f.descricao}</Text>
          {/* Ação mínima */}
          <View style={{ backgroundColor: Colors.surfaceRaised, borderRadius: 10, padding: 12, gap: 4 }}>
            <Text style={{ color: Colors.gold, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
              AÇÃO MÍNIMA
            </Text>
            <Text style={{ color: Colors.text, fontSize: 13, lineHeight: 20 }}>{f.acaoMinima}</Text>
          </View>
          {/* Frase de âncora */}
          <Text style={{ color: Colors.gold, fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
            {`"${f.fraseAncora}"`}
          </Text>
          {/* Botão aplicar hoje */}
          <Pressable
            onPress={onToggleAplicado}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
              backgroundColor: aplicado ? `${Colors.success}22` : Colors.surfaceRaised,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: aplicado ? Colors.success : Colors.border,
            }}
          >
            <Text style={{ color: aplicado ? Colors.success : Colors.muted, fontSize: 13 }}>
              {aplicado ? '✓ Aplicado hoje' : 'Aplicar hoje'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
