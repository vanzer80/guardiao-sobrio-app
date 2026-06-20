/**
 * Plans Screen — O Guardião Sobrio
 * Feature unlock based on subscription tier
 */

import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { usePlanStore } from '@/hooks/usePlanStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { PlansComparison } from '@/components/PlansComparison';
import { createCheckoutSession } from '@/lib/stripe';
import { PlanType } from '@/lib/types.monetization';

export default function PlansScreen() {
  const session = useAuthStore((state) => state.session);
  const {
    plan,
    isLoading,
    error,
    trialEnd,
    trialActivatedAt,
    activateTrial,
    setLoading,
    setError,
  } = usePlanStore();

  const [isActivatingTrial, setIsActivatingTrial] = useState(false);

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

  const handleActivateTrial = useCallback(async () => {
    try {
      setIsActivatingTrial(true);
      await activateTrial();
      Alert.alert(
        'Teste ativado',
        'Você tem 5 dias com acesso completo ao Guardião. Explore à vontade.',
        [{ text: 'Ok' }],
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível ativar o teste. Tente novamente.');
    } finally {
      setIsActivatingTrial(false);
    }
  }, [activateTrial]);

  return (
    <PlansComparison
      currentPlan={plan as PlanType}
      onSelectPlan={handleSelectPlan}
      isLoading={isLoading}
      trialEnd={trialEnd}
      trialActivatedAt={trialActivatedAt}
      onActivateTrial={handleActivateTrial}
      isActivatingTrial={isActivatingTrial}
    />
  );
}
