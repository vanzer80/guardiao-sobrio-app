# Correção — DRIFT-01 + MO-07 (plano de remediação)

> 2026-06-21. Baseado no diagnóstico `07-diagnostico-drift-resultados.md`.
> ⚠️ O histórico de migrations NÃO reflete a realidade — por isso a correção é cirúrgica
> (nada de `supabase db push` cego, que colidiria).

## 1. Estado real do banco
- `20260619203119_add_monetization_schema` → **registrada** em `schema_migrations`, mas o DDL **nunca rodou**. Faltam: `profiles.plan`, `profiles.stripe_customer_id`, `subscriptions.stripe_subscription_id`, e a tabela `subscription_audit_log` (com RLS/índices/policies).
- `20260621000000`, `20260621090000`, `20260621170000` → **aplicadas** (Management API) mas **não registradas** → um `db push` tentaria reaplicá-las e colidir.

## 2. Decisão (ADR) — fonte de verdade do plano
Há duas opções para o MO-07:
- **Opção A (recomendada, rápida):** aplicar as colunas que faltam (`profiles.plan`, `profiles.stripe_customer_id`, `subscriptions.stripe_subscription_id`) + criar `subscription_audit_log`. O código do cliente/webhook **volta a funcionar sem alteração** (o webhook já escreve `profiles.plan` E `subscriptions.plan`; o cliente lê `profiles.plan`). `effective_plan()` (RLS) já usa `subscriptions.plan` → tudo fica consistente.
- **Opção B (mais limpa, longo prazo):** fonte única = `subscriptions.plan`; reescrever cliente (`_layout.tsx`/`usePlanStore`) e webhook para não depender de `profiles.plan`. Mais código, mais risco agora.

**Recomendação:** **Opção A** para desbloquear pagantes já, registrando esta decisão como ADR. Reavaliar B depois.

> ⚠️ Não reexecutar o arquivo original `20260619203119` — ele usa `CREATE POLICY IF NOT EXISTS` (sintaxe inválida no Postgres) e provavelmente foi isso que o fez falhar. Em vez disso, aplicar a migração corretiva idempotente abaixo.

## 3. Migração corretiva (idempotente, sintaxe válida)
Arquivo: `supabase/migrations/20260621180000_repair_monetization_drift.sql`
```sql
begin;

alter table public.profiles
  add column if not exists plan text default 'free' check (plan in ('free','essential','guardian')),
  add column if not exists stripe_customer_id text unique;

alter table public.subscriptions
  add column if not exists stripe_subscription_id text unique;

alter table public.subscriptions enable row level security;

drop policy if exists "Users view own subscription" on public.subscriptions;
create policy "Users view own subscription" on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Service role manages subscriptions" on public.subscriptions;
create policy "Service role manages subscriptions" on public.subscriptions
  for all to service_role using (true) with check (true);

create index if not exists idx_subscriptions_stripe_id
  on public.subscriptions(stripe_subscription_id);

create table if not exists public.subscription_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  old_plan text,
  new_plan text,
  stripe_event_id text unique,
  details jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_subscription_audit_user_id
  on public.subscription_audit_log(user_id);
create index if not exists idx_subscription_audit_stripe_event
  on public.subscription_audit_log(stripe_event_id);

alter table public.subscription_audit_log enable row level security;

drop policy if exists "Users view own audit log" on public.subscription_audit_log;
create policy "Users view own audit log" on public.subscription_audit_log
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Service role writes audit log" on public.subscription_audit_log;
create policy "Service role writes audit log" on public.subscription_audit_log
  for insert to service_role with check (true);

grant usage on schema public to anon, authenticated;
grant select on public.subscriptions to anon, authenticated;
grant select on public.subscription_audit_log to anon, authenticated;

commit;
```

## 4. Reparar o histórico de migrations (para `db push` futuro ser seguro)
```bash
# Marca como aplicadas as 3 que rodaram via Management API mas não estão registradas:
supabase migration repair --status applied 20260621000000
supabase migration repair --status applied 20260621090000
supabase migration repair --status applied 20260621170000
# (Deixar 20260619203119 como 'applied' — será superada pela 20260621180000.)
# Conferir:
supabase migration list      # Local x Remote devem bater; só a 20260621180000 fica pendente
```

## 5. Ordem de execução
1. Criar o arquivo `20260621180000_repair_monetization_drift.sql` (§3).
2. Rodar os `migration repair` (§4) e conferir com `migration list`.
3. Aplicar **só** a corretiva: `supabase db push` (deve aplicar apenas a 20260621180000) — ou executar o SQL direto.
4. Verificar (read-only): as 3 colunas e a tabela existem; `select` em `subscription_audit_log` ok.
5. Validar MO-07 e2e: checkout com **cartão de teste Stripe** → conferir `profiles.plan`/`subscriptions.plan` atualizados, sem 500 no webhook, e app refletindo plano pago. (Passo do dono — exige Stripe test mode.)
6. `supabase gen types typescript --linked > lib/database.types.ts` (sincroniza types).

## 6. ⚠️ Documentação/roadmap (regra permanente — mesmo PR)
Atualizar `docs/auditoria/` (fechar DRIFT-01/MO-07 quando validados), `ROADMAP.md`, `CHANGELOG.md`, e ADR `docs/adr/NNNN-fonte-de-verdade-do-plano.md` (decisão Opção A). Manter `database.types.ts` sincronizado.
