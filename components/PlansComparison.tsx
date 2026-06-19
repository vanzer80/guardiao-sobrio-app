/**
 * PlansComparison — Feature matrix for Free / Essential / Guardian plans
 *
 * Hard rule: No promises of cure, results, or guarantees.
 * Copy focuses on protection and structure, not outcomes.
 */

import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { PLAN_FEATURES, PRICING, PlanType } from '@/lib/types.monetization';

interface PlansComparisonProps {
  currentPlan?: PlanType;
  onSelectPlan?: (plan: PlanType) => void;
  isLoading?: boolean;
}

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

export function PlansComparison({
  currentPlan = 'free',
  onSelectPlan,
  isLoading = false,
}: PlansComparisonProps) {
  const plans: PlanType[] = ['free', 'essential', 'guardian'];

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="px-4 pt-6 pb-8">
        {/* Header */}
        <Text className="text-2xl font-bold text-white mb-2">Escolha seu plano</Text>
        <Text className="text-sm text-gray-400 mb-6">
          Todas as funções são protegidas por RLS. Seus dados são seus.
        </Text>

        {/* Plans grid */}
        <View className="flex-row gap-4 mb-8">
          {plans.map((plan) => (
            <View
              key={plan}
              className={`flex-1 rounded-lg p-4 border ${
                currentPlan === plan
                  ? 'border-amber-400 bg-gray-900'
                  : 'border-gray-700 bg-gray-800'
              }`}
            >
              <Text className="text-lg font-bold text-white capitalize">{plan}</Text>

              {plan !== 'free' && (
                <>
                  <Text className="text-lg font-bold text-amber-400 mt-2">
                    R$ {PRICING[plan as 'essential' | 'guardian'].monthly.toFixed(2)}/mês
                  </Text>
                  <Text className="text-xs text-gray-400">
                    ou R$ {PRICING[plan as 'essential' | 'guardian'].annual.toFixed(0)}/ano
                  </Text>
                </>
              )}

              {currentPlan === plan && (
                <Text className="text-xs text-amber-400 mt-2">✓ Seu plano atual</Text>
              )}

              {plan !== currentPlan && plan !== 'free' && (
                <TouchableOpacity
                  disabled={isLoading}
                  onPress={() => onSelectPlan?.(plan)}
                  className="mt-4 bg-amber-400 rounded py-2"
                >
                  <Text className="text-center font-bold text-black">
                    {isLoading ? 'Processando...' : 'Fazer upgrade'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Features comparison */}
        <View className="border border-gray-700 rounded-lg overflow-hidden">
          {FEATURES_ORDER.map((feature, idx) => (
            <View
              key={feature.key}
              className={`flex-row ${idx % 2 === 0 ? 'bg-gray-900' : 'bg-black'}`}
            >
              <View className="flex-1 p-3 border-r border-gray-700">
                <Text className="text-sm text-white">{feature.label}</Text>
              </View>

              {plans.map((plan) => {
                const featureValue = PLAN_FEATURES[plan][feature.key];
                let display = '—';

                if (typeof featureValue === 'boolean') {
                  display = featureValue ? '✓' : '—';
                } else if (typeof featureValue === 'number') {
                  display = featureValue === -1 ? '∞' : `${featureValue}`;
                }

                return (
                  <View key={`${plan}-${feature.key}`} className="flex-1 p-3 border-r border-gray-700">
                    <Text className={`text-center text-sm ${display === '—' ? 'text-gray-600' : 'text-amber-400 font-bold'}`}>
                      {display}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <Text className="text-xs text-gray-400">
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.{'\n\n'}
            Em crise aguda, procure CVV (188) ou CAPS mais próximo.{'\n\n'}
            Todos os planos têm acesso ao Protocolo de Emergência sem limites.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
