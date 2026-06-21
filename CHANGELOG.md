# Changelog — O Guardião Sóbrio

Todas as mudanças notáveis neste projeto estão documentadas aqui.  
Formato: [Conventional Commits](https://www.conventionalcommits.org/). Data no padrão ISO 8601 (YYYY-MM-DD).

---

## [Unreleased]

---

## 2026-06-21 (fix/drift01-mo07-monetizacao)

### fix(db) — DRIFT-01 + MO-07: colunas de monetização aplicadas + histórico de migrations reparado

**Problema raiz:** A migration `20260619203119_add_monetization_schema` estava registrada em `schema_migrations` mas o DDL nunca havia executado. As colunas `profiles.plan`, `profiles.stripe_customer_id`, `subscriptions.stripe_subscription_id` e a tabela `subscription_audit_log` eram inexistentes no banco. Resultado: usuários pagantes via Stripe apareciam com plano `'free'` no app; o webhook retornava 500 ao tentar inserir no audit log inexistente.

**O que foi feito:**

- `supabase/migrations/20260621180000_repair_monetization_drift.sql` — migration corretiva idempotente:
  - `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (...)`
  - `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE`
  - `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE`
  - `CREATE TABLE IF NOT EXISTS subscription_audit_log (...)` com RLS + policies + índices + grants
  - RLS em `subscriptions` (policies `"Users view own subscription"` e `"Service role manages subscriptions"`)

- Reparo de histórico: migrations `20260621000000`, `20260621090000`, `20260621170000` registradas em `supabase_migrations.schema_migrations` via repair (tinham sido aplicadas via Management API mas não estavam registradas). Migration list: 11 Local = 11 Remote, nenhuma pendente.

- `lib/database.types.ts` — regenerado via `supabase gen types typescript --linked`. Mudanças:
  - `profiles.plan`: `string` → `string | null` (correto — sem NOT NULL no banco)
  - `subscription_audit_log.created_at`: `string` → `string | null`
  - Functions: `accept_family_invite`, `effective_plan`, `get_family_day_status` agora gerados automaticamente (não precisam de manutenção manual)
  - `graphql_public` schema adicionado (output padrão do Supabase CLI)

- `docs/auditoria/08-correcao-drift-mo07.md` — plano de remediação adicionado ao repo.
- `docs/adr/0001-fonte-de-verdade-do-plano.md` — ADR documentando a decisão (Opção A: restaurar colunas).

**Decisão (ADR-0001 — Opção A):** Restaurar as colunas faltantes em vez de migrar a fonte de verdade para `subscriptions.plan` (Opção B). Racional: menor delta de código, menor risco agora, fluxo Stripe já funciona com essa abordagem. Ver `docs/adr/0001-fonte-de-verdade-do-plano.md`.

**Gates:** typecheck ✅ · lint ✅ (1 warning pré-existente em perfil.tsx, não deste PR) · 81/81 testes ✅

**E2E pendente-dono:** validar com checkout real em Stripe test mode (cartão `4242 4242 4242 4242`) → confirmar `profiles.plan` e `subscriptions.plan` atualizados, audit log inserido sem erro, app refletindo plano pago na sessão.

---

## 2026-06-21

### fix — Achado 1: causa-raiz do módulo familiar corrigida em produção

**Contexto:** Rodada 4 da auditoria forense revelou que a hipótese das Rodadas 1–3 (RLS/plano) estava errada. A causa real era migration drift: a coluna `family_connections.invitation_expires_at` estava versionada e nos types, mas nunca havia sido executada no banco. Todo `createInvite` falhava com *"column does not exist"* antes de tocar a RLS.

**O que foi feito:**
- `ALTER TABLE family_connections ADD COLUMN invitation_expires_at TIMESTAMPTZ` — coluna da migration `20260619210313` aplicada no banco.
- `CREATE INDEX idx_family_connections_token` — índice de performance por token.
- `CREATE FUNCTION public.effective_plan(uid uuid)` — resolve plano efetivo via `profiles.trial_end` (trial) ou `subscriptions.plan` (pago), sem depender de `profiles.plan` (inexistente no DB).
- `CREATE POLICY fc_insert_requires_guardian_plan AS RESTRICTIVE FOR INSERT` — defense-in-depth via `effective_plan(auth.uid()) = 'guardian'`; RESTRICTIVE garante AND-ing com policies permissivas.
- Migration versionada: `supabase/migrations/20260621000000_rls_effective_plan_family_connections.sql`.

**Achados sistêmicos descobertos:**
- **DRIFT-01 (Alto):** `profiles.plan` e `profiles.stripe_customer_id` também ausentes no banco (mesma migration `20260619203119` não executada). Varredura completa pendente via `diagnostico-migration-drift.sql`.
- **MO-07 (Alto, PENDENTE-VERIFICAÇÃO):** cliente lê `profiles.plan` (`_layout.tsx`) e webhook escreve `profiles.plan` (Stripe); como a coluna não existe, o reflexo de plano pago pode estar quebrado. Verificar com conta Stripe teste.

**Validação e2e:** PENDENTE-DONO (tocar "Gerar código" com trial ativo → código de 6 dígitos).

**Commits:** branch `fix/escudo-paywall-reatividade` · rastreamento: `docs/auditoria/04-relatorio-rodada4-execucao.md`.

---

### fix — Achado 2: paywall indevido em cold-load (`escudo` e `programa30`)

**Contexto:** Em cold-load das telas `/escudo` e `/programa30`, o Zustand store ainda não tinha `trialEnd` populado. `getEffectivePlan()` retornava `'free'` → paywall mostrado para usuário com direito (trial ativo ou plano pago).

**O que foi feito:**
- `app/(tabs)/escudo.tsx` (commit `4613a2a`): subscrevem `usePlanStore((s) => s.plan)` e `usePlanStore((s) => s.trialEnd)` como selectors separados; `canAccessFamily` recalculado nos dois.
- `app/(tabs)/programa30.tsx` (commit `ecda1f9`): mesma correção de reatividade.

**Efeito:** quando o store hidrata com `trialEnd`, o componente re-renderiza imediatamente e o paywall some sem recarregar a tela.

---

### docs — Auditoria Rodada 4: execução, drift e orientações

**Novos arquivos:**
- `docs/auditoria/04-relatorio-rodada4-execucao.md` — registro completo da execução em produção.
- `docs/auditoria/ETAPA-A-supabase-passo-a-passo.md` — passo a passo mastigado para o dono no SQL Editor.
- `docs/auditoria/diagnostico-migration-drift.sql` — SQL read-only para varredura de migration drift.
- `docs/auditoria/ORIENTACAO-DEVS-proximos-passos.md` — próximos passos priorizados (P0–P4) com a regra permanente de atualizar docs+ROADMAP+CHANGELOG em todo PR.

**Atualizados:**
- `docs/auditoria/README.md` — score 72,9%, novos arquivos, Achados principais corrigidos.
- `docs/auditoria/03-relatorio-FINAL.md` — seção §0 (Rodada 4), FN-20 ✅, MO-07 adicionado, backlogs e evidence ledgers da Rodada 4.
- `ROADMAP.md` — Sprint 6: Fix Achado 1 e Fix Achado 2 marcados; DT9/DRIFT-01 e DT10/MO-07 adicionados à tabela de dívidas técnicas.
- `CHANGELOG.md` — este arquivo (criado agora).

**Regra de processo estabelecida:** toda correção atualiza, no mesmo PR, `docs/auditoria/` + `ROADMAP.md` + `CHANGELOG.md` (e ADR para decisões estruturais), mantendo `database.types.ts`/migrations sincronizados com o banco.
