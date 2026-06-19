/**
 * Plans Screen — O Guardião Sobrio
 * Feature unlock based on subscription tier
 */

import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { usePlanStore } from '@/hooks/usePlanStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { PlansComparison } from '@/components/PlansComparison';
import { createCheckoutSession } from '@/lib/stripe';
import { PlanType } from '@/lib/types.monetization';

export default function PlansScreen() {
  const session = useAuthStore((state) => state.session);
  const { plan, isLoading, error, setLoading, setError } = usePlanStore();

  const handleSelectPlan = useCallback(async (selectedPlan: PlanType) => {
    if (selectedPlan === 'free') return;

    if (!session?.user?.id || !session.access_token) {
      Alert.alert('Erro', 'Você precisa estar autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { url } = await createCheckoutSession(
        session.user.id,
        selectedPlan,
        session.access_token,
      );

      if (!url) {
        throw new Error('URL de checkout não retornada');
      }

      // Abre Stripe Checkout no navegador externo
      // O retorno ocorre via deep link (guardiao://plans/success)
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error('Não foi possível abrir o checkout');
      }
      await Linking.openURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao processar pagamento';
      setError(message);
      Alert.alert('Erro', error || message);
    } finally {
      setLoading(false);
    }
  }, [session, error, setLoading, setError]);

  return (
    <PlansComparison
      currentPlan={plan as PlanType}
      onSelectPlan={handleSelectPlan}
      isLoading={isLoading}
    />
  );
}
