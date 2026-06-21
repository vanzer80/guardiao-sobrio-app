/**
 * Módulo Familiar — helpers de convite e conexão
 *
 * Regras (guardiao-sobrio-docs §5):
 * - 1 conexão ativa por usuário (MVP)
 * - Familiar vê APENAS: dia guardado (sim/não) — sem diário, sem detalhes
 * - Código de convite: 6 dígitos, expira 48h
 * - Revogar: imediato, sem confirmação do familiar
 *
 * Disponível apenas para plano Guardião.
 */

import { supabase } from './supabase';
import type { Tables, TablesInsert } from './database.types';

export type FamilyConnection = Tables<'family_connections'> & {
  invitation_expires_at?: string | null;
};

// ── Invite Code ─────────────────────────────────────────────────────────────

/** Gera código de 6 dígitos numéricos */
function generateInviteCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Cria ou renova o convite para um familiar */
export async function createInvite(
  userId: string,
  familyName: string,
  relationship?: string
): Promise<FamilyConnection> {
  const token = generateInviteCode();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  // Verifica se já existe uma conexão para este usuário (MVP: apenas 1)
  const { data: existing } = await supabase
    .from('family_connections')
    .select('id, invitation_status')
    .eq('user_id', userId)
    .neq('invitation_status', 'revoked')
    .maybeSingle();

  if (existing) {
    // Renova token da conexão existente
    const { data, error } = await supabase
      .from('family_connections')
      .update({
        family_name: familyName,
        relationship: relationship ?? null,
        invitation_token: token,
        invitation_status: 'pending',
        invitation_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      } as Partial<FamilyConnection>)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as FamilyConnection;
  }

  // Cria nova conexão
  const insert: TablesInsert<'family_connections'> = {
    user_id: userId,
    family_name: familyName,
    relationship: relationship ?? null,
    invitation_token: token,
    invitation_status: 'pending',
    can_see_checklist: true,
    can_see_diary: false,
    can_see_sos: false,
    can_see_triggers: false,
  };

  const { data, error } = await supabase
    .from('family_connections')
    .insert({ ...insert, invitation_expires_at: expiresAt } as TablesInsert<'family_connections'>)
    .select()
    .single();

  if (error) throw error;
  return data as FamilyConnection;
}

/** Busca a conexão ativa do usuário (não revogada) */
export async function getActiveConnection(userId: string): Promise<FamilyConnection | null> {
  const { data, error } = await supabase
    .from('family_connections')
    .select('*')
    .eq('user_id', userId)
    .neq('invitation_status', 'revoked')
    .maybeSingle();

  if (error) throw error;
  return data as FamilyConnection | null;
}

/** Revoga acesso do familiar — imediato, sem confirmação */
export async function revokeAccess(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('family_connections')
    .update({
      invitation_status: 'revoked',
      invitation_token: null,
      family_user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId);

  if (error) throw error;
}

/** Aceita convite pelo código de 6 dígitos (usa RPC SECURITY DEFINER — evita bloqueio de RLS) */
export async function acceptInvite(
  token: string,
  _familyUserId?: string
): Promise<{ ok: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('accept_family_invite', { p_token: token });
  if (error) throw error;
  return data as unknown as { ok: boolean; reason?: string };
}

/** Vista do familiar: status do dia do dono via RPC SECURITY DEFINER */
export async function getFamilyDayStatus(): Promise<{
  linked: boolean;
  dayGuarded?: boolean;
  label?: string;
}> {
  const { data, error } = await supabase.rpc('get_family_day_status');
  if (error) throw error;
  return data as unknown as { linked: boolean; dayGuarded?: boolean; label?: string };
}
