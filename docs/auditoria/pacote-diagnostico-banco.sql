-- =============================================================================
-- PACOTE DE DIAGNÓSTICO E REMEDIAÇÃO DO BANCO — O Guardião Sóbrio
-- Auditoria forense · Rodada 3 · 2026-06-21
-- =============================================================================
-- COMO USAR:
--   1. Abra o Supabase Dashboard -> SQL Editor (roda como 'postgres', que IGNORA
--      RLS — por isso revela o estado REAL, não o filtrado pelo app).
--   2. Rode os blocos C.1 e C.2 (READ-ONLY, seguros). Leia "RESULTADO ESPERADO".
--   3. SÓ DEPOIS de interpretar C.1/C.2, decida aplicar C.4 (ESCRITA).
--   4. C.3 são comandos de terminal (fora do SQL Editor) para versionar o schema.
--
-- AJUSTE DE NOMES: se o C.1 revelar nomes de tabela diferentes dos abaixo,
--   substitua-os. Catalogados nesta auditoria:
--   profiles, checklist_items, checklist_completions, diary_entries,
--   user_triggers, sobriety_records, emergency_contacts, family_connections,
--   subscriptions, subscription_audit_log, user_settings, push_tokens,
--   trigger_categories.
-- =============================================================================


-- =============================================================================
-- C.1 — DIAGNÓSTICO DE RLS  (READ-ONLY — seguro)
-- =============================================================================

-- (1) RLS ligada por tabela.
-- RESULTADO ESPERADO: rls_enabled = true em TODA tabela de dados de usuário.
select c.relname as tabela,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relkind = 'r'
order by c.relname;

-- (2) Sinal de VAZAMENTO: tabela de usuário com RLS DESLIGADA.
-- RESULTADO ESPERADO: NENHUMA linha. Qualquer linha aqui = dados expostos sem RLS.
select c.relname as tabela_sem_rls
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relkind = 'r'
  and not c.relrowsecurity
  and c.relname in ('profiles','checklist_items','checklist_completions','diary_entries',
                    'user_triggers','sobriety_records','emergency_contacts',
                    'family_connections','user_settings','push_tokens');

-- (3) Sinal de MISCONFIG: RLS ligada mas SEM nenhuma política (tabela fica inacessível ao app).
-- RESULTADO ESPERADO: NENHUMA linha.
select c.relname as tabela_rls_sem_policy
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relkind = 'r'
  and c.relrowsecurity
  and not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname
  );

-- (4) Dump de TODAS as políticas.
-- RESULTADO ESPERADO: cada tabela de usuário com SELECT/INSERT/UPDATE/DELETE
--   escopados por auth.uid() (ex.: using/with_check = (auth.uid() = user_id)).
select tablename, policyname, cmd, roles,
       qual       as using_expr,
       with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- (5) Políticas de family_connections (o Achado 1).
-- RESULTADO ESPERADO (a interpretar): revela se o INSERT exige plan='guardian'
--   (rejeita trial), se FALTA política de INSERT, e se o SELECT permite o dono
--   (auth.uid() = user_id) — origem do RETURNING usado pelo cliente.
select policyname, cmd,
       qual       as using_expr,
       with_check
from pg_policies
where schemaname = 'public' and tablename = 'family_connections'
order by cmd;

-- (6) View segura do familiar.
-- RESULTADO ESPERADO (por spec docs/06): existir 'family_day_status' expondo
--   APENAS {owner, date, completed}. Se vier vazio, a view NÃO existe e o familiar
--   lê checklist_completions direto — revise a RLS dessa leitura.
select table_name, view_definition
from information_schema.views
where table_schema = 'public' and table_name = 'family_day_status';


-- =============================================================================
-- C.2 — QUERY DECISIVA: INSERT × SELECT do Achado 1  (READ-ONLY — seguro)
-- =============================================================================
-- Esta é a única evidência que isola a operação exata que falha no convite.
-- (A auditoria NÃO pôde rodar isto — exige bypass de RLS, que só o dono tem.)

-- (1) Conta linhas REAIS de family_connections da conta de auditoria, IGNORANDO RLS.
-- INTERPRETAÇÃO:
--   count = 0  -> o INSERT foi REJEITADO (cenário A/B: WITH CHECK / falta de policy de INSERT).
--                 Causa do bug = política de INSERT. Aplique C.4 (fc_owner_insert honra trial).
--   count > 0  -> o INSERT PASSOU; o que quebra é o SELECT do RETURNING (cenário C).
--                 Causa do bug = política de SELECT (ou o cliente exigir .select().single()).
--                 Aplique C.4 (fc_owner_select) E/OU ajuste lib/family.ts.
select count(*) as linhas_reais_conta_auditoria
from public.family_connections fc
join auth.users u on u.id = fc.user_id
where u.email = 'audit.guardiao.2026@mailinator.com';

-- (2) Estado de plano/trial da conta de teste — comprova a assimetria.
-- RESULTADO ESPERADO: plan = 'free' E trial_ativo = true
--   -> comprova que activate_trial() NÃO promove 'plan' (o elo da causa-raiz).
select p.plan,
       p.trial_end,
       (p.trial_end > now()) as trial_ativo
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'audit.guardiao.2026@mailinator.com';

-- (3) (Opcional) Compare com um usuário PAGANTE real, se houver:
-- RESULTADO ESPERADO: plan = 'guardian' (escrito pelo webhook handleCheckoutCompleted).
--   Demonstra por que o bug atinge o trial e provavelmente NÃO o pagante.
-- select p.plan, count(fc.id) as convites
-- from public.profiles p
-- left join public.family_connections fc on fc.user_id = p.id
-- where p.plan = 'guardian'
-- group by p.plan;


-- =============================================================================
-- C.3 — VERSIONAR O SCHEMA (TERMINAL — fora do SQL Editor)
-- =============================================================================
-- Traz schema-base + RLS para supabase/migrations/ (hoje estão fora do repo).
-- Corrige a causa de fundo "segurança não auditável por código".
--
-- Opção A (recomendada) — Supabase CLI:
--   supabase login
--   supabase link --project-ref <SEU_PROJECT_REF>
--   supabase db pull                 # gera migração com schema+RLS atuais
--   # revisar o diff e commitar em supabase/migrations/
--
-- Opção B — pg_dump apenas do schema:
--   pg_dump "postgresql://postgres:<senha>@<host>:5432/postgres" \
--     --schema-only --schema=public > supabase/migrations/00000000000000_baseline_schema.sql
--
-- (O project-ref deste projeto aparece na URL das edge functions:
--  https://huumwjwndsefdmgezohb.supabase.co  -> ref = huumwjwndsefdmgezohb)


-- =============================================================================
-- C.4 — PATCH DA RLS DE family_connections  (ESCRITA — aplicar APÓS C.1/C.2)
-- =============================================================================
-- Cobre os cenários A, B e C de uma vez. Se C.2 deu count > 0, o foco real é a
-- política de SELECT (incluída abaixo) — mas aplicar tudo é seguro e idempotente.

-- Plano efetivo que honra o trial (mesma regra do getEffectivePlan do cliente).
create or replace function public.effective_plan(uid uuid)
returns text
language sql stable security definer set search_path = public as $$
  select case
           when p.trial_end is not null and p.trial_end > now() then 'guardian'
           else p.plan
         end
  from profiles p
  where p.id = uid;
$$;

alter table public.family_connections enable row level security;

-- INSERT: dono + plano efetivo guardian (inclui trial). Corrige cenário A/B.
drop policy if exists "fc_owner_insert" on public.family_connections;
create policy "fc_owner_insert" on public.family_connections
  for insert to authenticated
  with check ( auth.uid() = user_id
               and public.effective_plan(auth.uid()) = 'guardian' );

-- SELECT: dono OU familiar vinculado. Permite o RETURNING (.select().single())
-- e a leitura do status pelo familiar. Corrige cenário C.
drop policy if exists "fc_owner_select" on public.family_connections;
create policy "fc_owner_select" on public.family_connections
  for select to authenticated
  using ( auth.uid() = user_id or auth.uid() = family_user_id );

-- UPDATE: só o dono (renovar/ revogar convite).
drop policy if exists "fc_owner_update" on public.family_connections;
create policy "fc_owner_update" on public.family_connections
  for update to authenticated
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- VALIDAÇÃO PÓS-PATCH:
--   Re-rode C.2 com a conta de teste em trial e, no app, toque "Gerar código".
--   ESPERADO: o INSERT passa e o código de 6 dígitos é exibido inline.
--
-- NOTA DE FUNDO: adote public.effective_plan() em QUALQUER política futura que
--   filtre por plano, para nunca repetir o descompasso trial × plan.
-- =============================================================================
