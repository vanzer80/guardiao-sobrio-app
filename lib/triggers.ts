/**
 * Mapa de Gatilhos — CRUD helpers
 *
 * Gatilhos descrevem situações, emoções ou horários que aumentam o risco
 * de recaída, junto com estratégias de enfrentamento planejadas.
 *
 * Disponível apenas para planos Essential e Guardião.
 * RLS garante que cada usuário acessa apenas seus próprios gatilhos.
 */

import { supabase } from './supabase';
import type { Tables, TablesInsert, TablesUpdate } from './database.types';

export type UserTrigger = Tables<'user_triggers'>;
export type TriggerCategory = Tables<'trigger_categories'>;

export type RiskLevel = 1 | 2 | 3 | 4 | 5;

export const RISK_LABELS: Record<number, string> = {
  1: 'Muito baixo',
  2: 'Baixo',
  3: 'Médio',
  4: 'Alto',
  5: 'Crítico',
};

export const RISK_COLORS: Record<number, string> = {
  1: '#4caf50',
  2: '#8bc34a',
  3: '#ff9800',
  4: '#f44336',
  5: '#9c27b0',
};

// ── Categories ─────────────────────────────────────────────────────────────

export async function listCategories(): Promise<TriggerCategory[]> {
  const { data, error } = await supabase
    .from('trigger_categories')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name');

  if (error) throw error;
  return data ?? [];
}

// ── Triggers CRUD ───────────────────────────────────────────────────────────

export async function listTriggers(userId: string): Promise<UserTrigger[]> {
  const { data, error } = await supabase
    .from('user_triggers')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('risk_level', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createTrigger(
  trigger: Omit<TablesInsert<'user_triggers'>, 'id' | 'created_at' | 'updated_at'>
): Promise<UserTrigger> {
  const { data, error } = await supabase
    .from('user_triggers')
    .insert(trigger)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrigger(
  id: string,
  updates: TablesUpdate<'user_triggers'>
): Promise<UserTrigger> {
  const { data, error } = await supabase
    .from('user_triggers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Soft delete: desativa o gatilho (preserva histórico)
export async function deleteTrigger(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_triggers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ── Risk alert helpers ──────────────────────────────────────────────────────

/** Retorna gatilhos de risco alto/crítico (risk_level >= 4) para alertas */
export function getHighRiskTriggers(triggers: UserTrigger[]): UserTrigger[] {
  return triggers.filter((t) => t.risk_level >= 4);
}
