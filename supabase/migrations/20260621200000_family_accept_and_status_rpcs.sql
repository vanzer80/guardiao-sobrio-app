-- =============================================================================
-- Módulo Familiar — RPCs do lado do familiar (SECURITY DEFINER)
-- Auditoria Rodada 5 / Achado 6 — 2026-06-21
-- =============================================================================
-- Por que SECURITY DEFINER em vez de policies abertas:
--   accept_family_invite: o familiar precisa fazer UPDATE na linha do dono
--     (family_user_id = auth.uid()). A policy fc_owner_update só permite o dono.
--     Abrir a policy seria abusável; a RPC valida o token antes de atualizar.
--   get_family_day_status: lê checklist_completions do dono — a RLS do dono
--     bloqueia leitura por terceiros. A RPC expõe apenas o booleano do dia.
-- =============================================================================

-- Familiar reivindica um convite pendente pelo código de 6 dígitos
create or replace function public.accept_family_invite(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_exp timestamptz;
begin
  select id, invitation_expires_at into v_id, v_exp
  from family_connections
  where invitation_token = p_token and invitation_status = 'pending'
  limit 1;
  if v_id is null then
    return jsonb_build_object('ok', false, 'reason', 'Código inválido ou já utilizado.');
  end if;
  if v_exp is not null and v_exp < now() then
    return jsonb_build_object('ok', false, 'reason', 'Código expirado. Peça um novo convite.');
  end if;
  update family_connections
    set family_user_id = auth.uid(), invitation_status = 'accepted',
        invitation_token = null, updated_at = now()
  where id = v_id;
  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.accept_family_invite(text) to authenticated;

-- Familiar vinculado lê APENAS o booleano do dia do dono
create or replace function public.get_family_day_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_guarded boolean;
begin
  select user_id into v_owner from family_connections
   where family_user_id = auth.uid() and invitation_status = 'accepted' limit 1;
  if v_owner is null then return jsonb_build_object('linked', false); end if;
  select exists(
    select 1 from checklist_completions
    where user_id = v_owner and completed_date = current_date
  ) into v_guarded;
  return jsonb_build_object('linked', true, 'dayGuarded', v_guarded,
    'label', case when v_guarded then 'Dia guardado' else 'Em jornada' end);
end; $$;

grant execute on function public.get_family_day_status() to authenticated;
