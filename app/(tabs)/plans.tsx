/**
 * Plans Screen — O Guardião Sobrio
 * Feature unlock based on subscription tier
 *
 * Routes: /plans (tab navigation)
 */

import { Alert } from 'react-native';
import { usePlanStore } from '@/hooks/usePlanStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { PlansComparison } from '@/components/PlansComparison';
import { PlanType } from '@/lib/types.monetization';

export default function PlansScreen() {
  const session = useAuthStore((state) => state.session);
  const { plan, isLoading, error, setLoading } = usePlanStore();

  const handleSelectPlan = async (selectedPlan: PlanType) => {
    if (selectedPlan === 'free') {
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Erro', 'Você precisa estar autenticado');
      return;
    }

    try {
      setLoading(true);

      // TODO: Call createCheckoutSession from lib/stripe.ts
      // This will:
      // 1. Call Edge Function create-checkout-session
      // 2. Get Stripe session ID
      // 3. Open Stripe payment flow
      // 4. On success, webhook updates user's plan

      Alert.alert('Em desenvolvimento', 'O checkout será implementado em breve');
    } catch {
      Alert.alert('Erro', error || 'Falha ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlansComparison
      currentPlan={plan as PlanType}
      onSelectPlan={handleSelectPlan}
      isLoading={isLoading}
    />
  );
}
