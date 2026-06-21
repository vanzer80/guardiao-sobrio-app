-- =============================================================================
-- Migration: fix RLS de family_connections (corrige o Achado 1 — "Gerar código")
-- Caminho no repo: supabase/migrations/20260621090000_fix_family_connections_rls.sql
-- Origem: Auditoria Forense — Rodada 3 (pacote-diagnostico-banco.sql, bloco C.4)
-- =============================================================================
-- PRÉ-REQUISITO: rode antes o diagnóstico (pacote-diagnostico-banco.sql, C.1 e C.2).
--   - Se C.2 retornar count = 0  -> o INSERT estava sendo rejeitado (cenário A/B).
--   - Se C.2 retornar count > 0  -> o INSERT passava; o problema é o SELECT (cenário C).
--   Esta migração corrige AMBOS os cenários e é idempotente (pode rodar de novo).
--
-- CAUSA-RAIZ: activate_trial() seta apenas trial_end, nunca profiles.plan; logo o
--   usuário em trial fica plan='free' no banco, enquanto o webhook do Stripe
--   (handleCheckoutCompleted) escreve plan='guardian' para pagantes. Qualquer
--   política que gate por plan='guardian' rejeita o usuário em trial.
-- SOLUÇÃO: função effective_plan() que honra o trial + políticas de INSERT/SELECT/UPDATE.
-- =============================================================================

begin;

-- Plano efetivo que honra o trial (espelha o getEffectivePlan() do cliente).
create or replace function public.effective_plan(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
           when p.trial_end is not null and p.trial_end > now() then 'guardian'
           else p.plan
         end
  from public.profiles p
  where p.id = uid;
$$;

alter table public.family_connections enable row level security;

-- INSERT: dono + plano efetivo guardian (inclui trial). Corrige cenário A/B.
drop policy if exists "fc_owner_insert" on public.family_connections;
create policy "fc_owner_insert" on public.family_connections
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.effective_plan(auth.uid()) = 'guardian'
  );

-- SELECT: dono OU familiar vinculado. Permite o RETURNING (.select().single() do
-- cliente) e a leitura do status pelo familiar. Corrige cenário C.
drop policy if exists "fc_owner_select" on public.family_connections;
create policy "fc_owner_select" on public.family_connections
  for select to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = family_user_id
  );

-- UPDATE: só o dono (renovar / revogar convite).
drop policy if exists "fc_owner_update" on public.family_connections;
create policy "fc_owner_update" on public.family_connections
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;

-- =============================================================================
-- VALIDAÇÃO PÓS-MIGRAÇÃO:
--   1) Re-rode C.2 (pacote-diagnostico-banco.sql) com a conta de teste em trial.
--   2) No app (trial ativo), toque "Gerar código" -> deve exibir o código de 6 dígitos.
-- NOTA: adote public.effective_plan() em QUALQUER política futura que filtre por
--   plano, para nunca repetir o descompasso trial × plan.
-- =============================================================================
