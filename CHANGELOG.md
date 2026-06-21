# Changelog — O Guardião Sóbrio

Todas as mudanças notáveis neste projeto estão documentadas aqui.  
Formato: [Conventional Commits](https://www.conventionalcommits.org/). Data no padrão ISO 8601 (YYYY-MM-DD).

---

## [Unreleased]

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
