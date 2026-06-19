/**
 * Deep link handler: guardiaosobrio://plans/success?session_id=xxx
 * Exibida após checkout bem-sucedido no Stripe.
 * Atualiza plano do usuário consultando o banco (webhook já processou).
 */

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { usePlanStore } from '@/hooks/usePlanStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { PlanType } from '@/lib/types.monetization';
import { Colors } from '@/constants/Colors';

export default function PlansSuccessScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { setPlan } = usePlanStore();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    if (!userId) return;

    // Webhook do Stripe pode levar alguns segundos — tenta até 3x com intervalo de 2s
    let attempts = 0;
    const maxAttempts = 3;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single();

      if (cancelled) return;

      if (error || !data) {
        setStatus('error');
        return;
      }

      const plan = data.plan as PlanType;

      if (plan !== 'free' || attempts >= maxAttempts) {
        setPlan(plan);
        setStatus('done');
        return;
      }

      // Plano ainda não atualizado — aguarda webhook
      attempts++;
      setTimeout(poll, 2000);
    };

    poll();
    return () => { cancelled = true; };
  }, [userId, setPlan]);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <ActivityIndicator color={Colors.gold} size="large" />
        <Text style={{ color: Colors.text, fontSize: 16 }}>Confirmando seu plano...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 }}>
        <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
          Pagamento recebido
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 14, textAlign: 'center' }}>
          Seu plano será atualizado em instantes. Se não atualizar, feche e reabra o app.
        </Text>
        <Pressable onPress={handleContinue} style={{ backgroundColor: Colors.gold, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}>
          <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 16 }}>Continuar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 32 }}>
      <Text style={{ color: Colors.gold, fontSize: 48 }}>✓</Text>
      <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
        Plano ativado com sucesso
      </Text>
      <Text style={{ color: Colors.muted, fontSize: 14, textAlign: 'center' }}>
        Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
      </Text>
      <Pressable onPress={handleContinue} style={{ backgroundColor: Colors.gold, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}>
        <Text style={{ color: Colors.bg, fontWeight: '700', fontSize: 16 }}>Continuar</Text>
      </Pressable>
    </View>
  );
}
