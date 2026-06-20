/**
 * PlansComparison — Feature matrix for Free / Essential / Guardian plans
 *
 * Hard rule: No promises of cure, results, or guarantees.
 * Copy focuses on protection and structure, not outcomes.
 */

import { View, Text, ScrollView, SafeAreaView, Pressable, ActivityIndicator } from 'react-native';
import { PLAN_FEATURES, PRICING, PlanType } from '@/lib/types.monetization';
import { Colors } from '@/constants/Colors';

function trialDaysRemaining(trialEnd: string): number {
  return Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86_400_000));
}

function TrialBanner({
  trialEnd,
  trialActivatedAt,
  onActivateTrial,
  isActivatingTrial,
}: {
  trialEnd?: string | null;
  trialActivatedAt?: string | null;
  onActivateTrial?: () => Promise<void>;
  isActivatingTrial?: boolean;
}) {
  const isActive = !!trialEnd && new Date(trialEnd) > new Date();
  const wasUsed = !!trialActivatedAt && !isActive;
  const canActivate = !trialActivatedAt;

  if (isActive) {
    const days = trialDaysRemaining(trialEnd!);
    return (
      <View
        style={{
          backgroundColor: `${Colors.gold}15`,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: `${Colors.gold}55`,
          padding: 16,
          marginBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text style={{ color: Colors.gold, fontSize: 20 }}>✦</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.gold, fontWeight: '700', fontSize: 13 }}>
            Período de teste ativo
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>
            {days === 1 ? 'Último dia' : `${days} dias restantes`} — acesso completo ao Guardião.
          </Text>
        </View>
      </View>
    );
  }

  if (wasUsed) {
    return (
      <View
        style={{
          backgroundColor: Colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: 14,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: Colors.muted, fontSize: 12, textAlign: 'center' }}>
          Você já utilizou o período de teste gratuito.
        </Text>
      </View>
    );
  }

  if (canActivate) {
    return (
      <View
        style={{
          backgroundColor: `${Colors.gold}10`,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: `${Colors.gold}40`,
          padding: 18,
          marginBottom: 20,
          gap: 10,
        }}
      >
        <Text
          style={{
            color: Colors.gold,
            fontSize: 11,
            letterSpacing: 2.5,
          }}
        >
          OFERTA ÚNICA
        </Text>
        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.text,
            fontSize: 22,
            lineHeight: 28,
          }}
        >
          5 dias grátis com tudo liberado
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 13, lineHeight: 20 }}>
          Explore todos os módulos do Guardião — sem cartão, sem compromisso.
        </Text>
        <Pressable
          onPress={onActivateTrial}
          disabled={isActivatingTrial}
          accessibilityRole="button"
          accessibilityLabel="Iniciar teste gratuito de 5 dias"
          style={({ pressed }) => ({
            backgroundColor: Colors.gold,
            borderRadius: 10,
            paddingVertical: 13,
            alignItems: 'center',
            opacity: isActivatingTrial || pressed ? 0.7 : 1,
          })}
        >
          {isActivatingTrial ? (
            <ActivityIndicator color={Colors.bg} />
          ) : (
            <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 15 }}>
              Iniciar teste gratuito
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  return null;
}

interface PlansComparisonProps {
  currentPlan?: PlanType;
  onSelectPlan?: (plan: PlanType) => void;
  isLoading?: boolean;
  trialEnd?: string | null;
  trialActivatedAt?: string | null;
  onActivateTrial?: () => Promise<void>;
  isActivatingTrial?: boolean;
}

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Gratuito',
  essential: 'Essential',
  guardian: 'Guardião',
};

const FEATURES_ORDER = [
  { key: 'dailyChecklist', label: 'Checklist diário' },
  { key: 'sobrietyCounter', label: 'Contador de dias' },
  { key: 'emergencyProtocol', label: 'Protocolo SOS' },
  { key: 'diaryPrompts', label: 'Diário de prompts' },
  { key: 'foundamentals', label: '13 Fundamentos' },
  { key: 'triggerMap', label: 'Mapa de gatilhos' },
  { key: 'statistics', label: 'Estatísticas' },
  { key: 'familyModule', label: 'Módulo familiar' },
  { key: 'program30Days', label: 'Programa 30 Dias' },
  { key: 'community', label: 'Comunidade' },
];

const plans: PlanType[] = ['free', 'essential', 'guardian'];

function featureDisplay(value: boolean | number | undefined): string {
  if (typeof value === 'boolean') return value ? '✓' : '—';
  if (typeof value === 'number') return value === -1 ? '∞' : String(value);
  return '—';
}

export function PlansComparison({
  currentPlan = 'free',
  onSelectPlan,
  isLoading = false,
  trialEnd,
  trialActivatedAt,
  onActivateTrial,
  isActivatingTrial = false,
}: PlansComparisonProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Header */}
        <Text
          style={{
            color: Colors.gold,
            fontSize: 11,
            letterSpacing: 3.5,
            marginBottom: 12,
          }}
        >
          SEU PLANO
        </Text>
        <Text
          style={{
            fontFamily: 'CormorantGaramond',
            color: Colors.text,
            fontSize: 34,
            lineHeight: 40,
            marginBottom: 6,
          }}
        >
          Escolha sua proteção
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 28 }}>
          O Protocolo de Emergência jamais é bloqueado durante uma crise — independentemente do plano.
        </Text>

        {/* Banner de trial — exibido apenas para usuários free */}
        {currentPlan === 'free' && (
          <TrialBanner
            trialEnd={trialEnd}
            trialActivatedAt={trialActivatedAt}
            onActivateTrial={onActivateTrial}
            isActivatingTrial={isActivatingTrial}
          />
        )}

        {/* Grid de planos */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan;
            return (
              <View
                key={plan}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isCurrent ? Colors.gold : Colors.border,
                  backgroundColor: isCurrent ? `${Colors.gold}10` : Colors.surface,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    color: isCurrent ? Colors.gold : Colors.muted,
                    fontSize: 10,
                    letterSpacing: 1.5,
                    marginBottom: 4,
                  }}
                >
                  {PLAN_LABELS[plan].toUpperCase()}
                </Text>

                {plan !== 'free' ? (
                  <>
                    <Text
                      style={{
                        fontFamily: 'CormorantGaramond',
                        color: Colors.gold,
                        fontSize: 20,
                        lineHeight: 24,
                      }}
                    >
                      R$ {PRICING[plan as 'essential' | 'guardian'].monthly.toFixed(2).replace('.', ',')}
                    </Text>
                    <Text style={{ color: Colors.mutedDark, fontSize: 10, marginBottom: 8 }}>
                      /mês
                    </Text>
                  </>
                ) : (
                  <Text
                    style={{
                      fontFamily: 'CormorantGaramond',
                      color: Colors.text,
                      fontSize: 20,
                      lineHeight: 24,
                      marginBottom: 8,
                    }}
                  >
                    Grátis
                  </Text>
                )}

                {isCurrent ? (
                  <Text style={{ color: Colors.gold, fontSize: 11 }}>✓ Seu plano</Text>
                ) : plan !== 'free' ? (
                  <Pressable
                    disabled={isLoading}
                    onPress={() => onSelectPlan?.(plan)}
                    accessibilityRole="button"
                    accessibilityLabel={`Fazer upgrade para ${PLAN_LABELS[plan]}`}
                    style={({ pressed }) => ({
                      marginTop: 4,
                      backgroundColor: Colors.gold,
                      borderRadius: 8,
                      paddingVertical: 7,
                      opacity: isLoading || pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        color: Colors.bg,
                        fontSize: 12,
                        fontWeight: '700',
                      }}
                    >
                      {isLoading ? '…' : 'Upgrade'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Tabela comparativa */}
        <View
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.border,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          {/* Cabeçalho da tabela */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: Colors.surfaceRaised,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            }}
          >
            <View style={{ flex: 2, padding: 10 }}>
              <Text style={{ color: Colors.muted, fontSize: 11, letterSpacing: 1.5 }}>
                RECURSO
              </Text>
            </View>
            {plans.map((plan) => (
              <View
                key={plan}
                style={{
                  flex: 1,
                  padding: 10,
                  alignItems: 'center',
                  borderLeftWidth: 1,
                  borderLeftColor: Colors.border,
                }}
              >
                <Text
                  style={{
                    color: currentPlan === plan ? Colors.gold : Colors.muted,
                    fontSize: 10,
                    letterSpacing: 1,
                  }}
                >
                  {PLAN_LABELS[plan].toUpperCase().slice(0, 4)}
                </Text>
              </View>
            ))}
          </View>

          {FEATURES_ORDER.map((feature, idx) => (
            <View
              key={feature.key}
              style={{
                flexDirection: 'row',
                backgroundColor: idx % 2 === 0 ? Colors.surface : Colors.bg,
                borderTopWidth: idx === 0 ? 0 : 1,
                borderTopColor: Colors.border,
              }}
            >
              <View style={{ flex: 2, padding: 10, justifyContent: 'center' }}>
                <Text style={{ color: Colors.text, fontSize: 13 }}>{feature.label}</Text>
              </View>
              {plans.map((plan) => {
                const raw = PLAN_FEATURES[plan][feature.key as keyof typeof PLAN_FEATURES[typeof plan]];
                const display = featureDisplay(raw as boolean | number | undefined);
                const isActive = display !== '—';
                return (
                  <View
                    key={`${plan}-${feature.key}`}
                    style={{
                      flex: 1,
                      padding: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderLeftWidth: 1,
                      borderLeftColor: Colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? '700' : '400',
                        color: isActive ? Colors.gold : Colors.mutedDark,
                      }}
                    >
                      {display}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Disclaimer + CVV */}
        <View
          style={{
            padding: 16,
            backgroundColor: Colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.border,
            gap: 8,
          }}
        >
          <Text style={{ color: Colors.muted, fontSize: 12, lineHeight: 18 }}>
            Este app complementa — nunca substitui — psiquiatras, psicólogos ou grupos de apoio.
          </Text>
          <Text style={{ color: Colors.mutedDark, fontSize: 12, lineHeight: 18 }}>
            Em crise, procure CVV (188) ou o CAPS mais próximo.
          </Text>
          <Text style={{ color: Colors.mutedDark, fontSize: 11, lineHeight: 16 }}>
            Todos os seus dados são protegidos por RLS — apenas você acessa.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
