import { supabase } from './supabase';

export const FREE_MONTHLY_LIMIT = 3;

export const MILESTONE_LABELS: Record<number, string> = {
  1: '1 dia',
  3: '3 dias',
  7: '1 semana',
  14: '2 semanas',
  21: '3 semanas',
  30: '1 mês',
  60: '2 meses',
  90: '3 meses',
  180: '6 meses',
  365: '1 ano',
};

export function getMilestoneLabel(days: number | null): string | null {
  if (!days) return null;
  return MILESTONE_LABELS[days] ?? null;
}

export async function countSosThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count } = await supabase
    .from('sos_activations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('triggered_at', start);
  return count ?? 0;
}

// Fire-and-forget — nunca bloqueia o fluxo do protocolo.
export function saveSosActivation(userId: string, cravingLevel: number): void {
  supabase
    .from('sos_activations')
    .insert({
      user_id: userId,
      craving_level: cravingLevel,
      actions_taken: ['PARE', 'RESPIRE', 'CONTATO', 'MOVIMENTO', 'ESTRUTURA'],
      triggered_at: new Date().toISOString(),
    })
    .then(() => {});
}
