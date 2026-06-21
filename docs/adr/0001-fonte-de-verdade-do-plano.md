# ADR-0001 — Fonte de Verdade do Plano de Assinatura

**Data:** 2026-06-21  
**Status:** Aceito  
**Contexto:** DRIFT-01 + MO-07 (ver `docs/auditoria/07-diagnostico-drift-resultados.md`)

---

## Contexto

O diagnóstico de 2026-06-21 revelou que `profiles.plan` e `profiles.stripe_customer_id` não existiam no banco (migration `20260619203119` registrada mas DDL não executado). O webhook Stripe (`handle-stripe-webhooks`) escreve em `profiles.plan`; o cliente (`_layout.tsx`) lê `profiles.plan`. Como a coluna estava ausente, qualquer usuário pagante via Stripe aparecia com plano `'free'` no app.

## Opções consideradas

**Opção A — Restaurar as colunas faltantes (adotada)**

Aplicar as colunas ausentes (`profiles.plan`, `profiles.stripe_customer_id`, `subscriptions.stripe_subscription_id`) e criar `subscription_audit_log`. O código existente volta a funcionar sem alteração: o webhook já escreve em `profiles.plan` e o cliente já lê dali. A função `effective_plan()` (RLS) usa `subscriptions.plan` como fonte primária — tudo permanece consistente.

**Opção B — Migrar fonte de verdade para `subscriptions.plan`**

Remover `profiles.plan` como cópia de plano. Reescrever `_layout.tsx` e `usePlanStore` para lerem de `subscriptions`. Reescrever o webhook para não escrever em `profiles`. Mais código, mais surface de risco na refatoração no momento atual.

## Decisão

**Opção A** — restaurar as colunas ausentes via migration corretiva idempotente.

**Racional:**
1. Menor delta de código → menor risco de regressão agora.
2. O webhook já está escrito para atualizar `profiles.plan` E `subscriptions.plan` em paralelo; restaurar a coluna desbloqueia imediatamente os pagantes sem tocar no fluxo de cobrança.
3. `effective_plan()` (usada em RLS de `family_connections`) já usa `subscriptions.plan` como verdade autoritativa para o banco — não há inconsistência de authorização.
4. Opção B pode ser feita como refatoração isolada num sprint dedicado quando a monetização estiver validada com tráfego real.

## Consequências

- `profiles.plan` existe no banco e é atualizado pelo webhook Stripe em cada evento de checkout/update/cancel.
- O cliente (`_layout.tsx`) lê `profiles.plan` e propaga para `usePlanStore` — funciona corretamente após a restauração.
- `subscription_audit_log` existe e o webhook pode registrar eventos de cobrança sem lançar exceções.
- Risco residual: `profiles.plan` e `subscriptions.plan` podem divergir se um evento webhook falhar parcialmente. Monitorar via `subscription_audit_log` e alertas de erro no Supabase.
- **E2E pendente-dono:** validar com checkout real em Stripe test mode (cartão `4242 4242 4242 4242`) para confirmar que `profiles.plan` é atualizado e o app reflete o plano pago após a sessão.

## Referências

- `supabase/migrations/20260621180000_repair_monetization_drift.sql`
- `docs/auditoria/07-diagnostico-drift-resultados.md` — diagnóstico completo
- `docs/auditoria/08-correcao-drift-mo07.md` — plano de remediação
- `supabase/functions/handle-stripe-webhooks/index.ts` — webhook Stripe
- `app/_layout.tsx:120` — leitura de `profiles.plan`
