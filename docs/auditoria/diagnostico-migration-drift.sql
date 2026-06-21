-- =============================================================================
-- DIAGNÓSTICO DE MIGRATION DRIFT — O Guardião Sóbrio (Auditoria Rodada 4)
-- Objetivo: encontrar TODAS as migrations marcadas como aplicadas que não rodaram,
-- e TODAS as colunas/tabelas que o código/types esperam mas não existem no banco.
-- Tudo READ-ONLY. Rode no SQL Editor do Supabase (como postgres).
-- AO FINAL: atualize docs/auditoria, ROADMAP.md e CHANGELOG.md com o que achar.
-- =============================================================================

-- D.1 — Migrations registradas como aplicadas (histórico do Supabase)
-- ESPERADO: comparar esta lista com os arquivos em supabase/migrations/.
-- Toda migration listada aqui DEVERIA ter realmente executado seu SQL.
select version, name
from supabase_migrations.schema_migrations
order by version;

-- D.2 — Colunas-chave que o código/types ESPERAM: existem no banco?
-- ESPERADO: todas presentes. Qualquer linha com existe=false é DRIFT (corrigir).
with esperado(tabela, coluna) as (
  values
    ('profiles','plan'),
    ('profiles','stripe_customer_id'),
    ('profiles','trial_end'),
    ('profiles','trial_activated_at'),
    ('profiles','is_anonymous'),
    ('profiles','onboarding_motivo'),
    ('family_connections','invitation_expires_at'),
    ('family_connections','invitation_token'),
    ('family_connections','family_user_id'),
    ('subscriptions','plan'),
    ('subscriptions','status'),
    ('subscriptions','stripe_subscription_id')
)
select e.tabela, e.coluna,
       (c.column_name is not null) as existe_no_banco
from esperado e
left join information_schema.columns c
  on c.table_schema='public' and c.table_name=e.tabela and c.column_name=e.coluna
order by existe_no_banco, e.tabela, e.coluna;

-- D.3 — Dump completo das colunas reais das tabelas principais
-- ESPERADO: usar para um diff manual contra lib/database.types.ts (fonte do código).
-- Qualquer coluna que está no types e NÃO aqui = drift; o inverso também merece atenção.
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public'
  and table_name in (
    'profiles','subscriptions','subscription_audit_log','family_connections',
    'checklist_items','checklist_completions','diary_entries','user_triggers',
    'sobriety_records','emergency_contacts','user_settings','push_tokens','trigger_categories'
  )
order by table_name, ordinal_position;

-- D.4 — Onde o plano realmente vive (sustenta o achado MO-07)
-- ESPERADO: subscriptions.plan presente; profiles.plan AUSENTE (= mismatch com o cliente).
select
  exists(select 1 from information_schema.columns
         where table_schema='public' and table_name='subscriptions' and column_name='plan') as subscriptions_tem_plan,
  exists(select 1 from information_schema.columns
         where table_schema='public' and table_name='profiles' and column_name='plan') as profiles_tem_plan;

-- =============================================================================
-- CLI (terminal, fora do SQL Editor) — confirma e sincroniza a deriva
-- =============================================================================
-- 1) Ver diferença entre migrations locais x aplicadas no remoto:
--    supabase login
--    supabase link --project-ref huumwjwndsefdmgezohb
--    supabase migration list        # mostra Local x Remote lado a lado
--
-- 2) Trazer o schema REAL para o repo (resolve a causa de fundo do drift):
--    supabase db pull               # gera migração baseline com o estado atual
--    # revisar o diff, commitar em supabase/migrations/, e regenerar os types:
--    supabase gen types typescript --linked > lib/database.types.ts
--
-- DEPOIS DE QUALQUER CORREÇÃO: atualize docs/auditoria/, ROADMAP.md e CHANGELOG.md,
-- e abra um ADR se mudar a fonte de verdade do plano (profiles.plan x subscriptions.plan).
-- =============================================================================
