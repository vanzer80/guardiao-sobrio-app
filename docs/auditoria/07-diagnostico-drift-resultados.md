# Diagnóstico de Drift — Resultados (DRIFT-01 + MO-07)

**Data:** 2026-06-21  
**Branch:** `docs/diagnostico-drift`  
**Método:** read-only — apenas SELECT/consultas no banco via Management API  
**Escopo:** migrations registradas × executadas; colunas em `database.types.ts` × banco real; fonte de verdade do plano (MO-07)  
**Constraint:** Nenhum DDL, INSERT, UPDATE ou `supabase db push` foi executado.

---

## D.1 — Migrations: Registradas vs Locais

### Registradas em `supabase_migrations.schema_migrations` (remote)

| version | name |
|---------|------|
| 20260619203119 | add_monetization_schema |
| 20260619210313 | add_family_invitation_expires_at |
| 20260619220000 | add_onboarding_context |
| 20260620120000 | add_trial_to_profiles |
| 20260620130000 | fix_activate_trial_column_reference |
| 20260620140000 | anonymous_mode |
| 20260620150000 | cron_cleanup_anonymous |

**Total: 7 registradas.**

### Arquivos locais em `supabase/migrations/`

| Arquivo | Registrado? |
|---------|-------------|
| 20260619203119_add_monetization_schema.sql | ✅ |
| 20260619210313_add_family_invitation_expires_at.sql | ✅ |
| 20260619220000_add_onboarding_context.sql | ✅ |
| 20260620120000_add_trial_to_profiles.sql | ✅ |
| 20260620130000_fix_activate_trial_column_reference.sql | ✅ |
| 20260620140000_anonymous_mode.sql | ✅ |
| 20260620150000_cron_cleanup_anonymous.sql | ✅ |
| **20260621000000_rls_effective_plan_family_connections.sql** | ❌ NÃO REGISTRADO |
| **20260621090000_fix_family_connections_rls.sql** | ❌ NÃO REGISTRADO |
| **20260621170000_fix_family_connections_rls_recursion.sql** | ❌ NÃO REGISTRADO |

### Análise

**Drift direto (3 arquivos locais não registrados):** As migrations `20260621000000`, `20260621090000` e `20260621170000` foram aplicadas ao banco via Management API (SQL direto) durante as correções das Rodadas 4–5, mas nunca registradas em `schema_migrations`. Isso significa:

- `supabase migration list` não as vê como aplicadas
- `supabase db push` tentará aplicá-las novamente numa futura execução → risco de conflito (políticas e funções já existem no banco)

**Drift inverso (migration registrada mas DDL não executado):** A migration `20260619203119_add_monetization_schema` está registrada em `schema_migrations` mas várias de suas colunas **não existem no banco** (ver D.2 abaixo). Esta é a causa-raiz do DRIFT-01.

---

## D.2 — Colunas-Chave: DB vs Esperado

Resultado bruto da query D.2:

| tabela | coluna | existe_no_banco |
|--------|--------|----------------|
| profiles | **plan** | **false** |
| profiles | **stripe_customer_id** | **false** |
| subscriptions | **stripe_subscription_id** | **false** |
| family_connections | family_user_id | true |
| family_connections | invitation_expires_at | true |
| family_connections | invitation_token | true |
| profiles | is_anonymous | true |
| profiles | onboarding_motivo | true |
| profiles | trial_activated_at | true |
| profiles | trial_end | true |
| subscriptions | plan | true |
| subscriptions | status | true |

**3 colunas ausentes no banco, todas da migration `20260619203119_add_monetization_schema`.**

---

## D.3 — Diff Completo: `database.types.ts` × DB Real

### profiles

| Coluna | types.ts | DB |
|--------|----------|----|
| id | ✅ | ✅ |
| full_name | ✅ | ✅ |
| avatar_url | ✅ | ✅ |
| sobriety_start_date | ✅ | ✅ |
| substance_focus | ✅ | ✅ |
| timezone | ✅ | ✅ |
| is_premium | ✅ | ✅ |
| onboarding_completed | ✅ | ✅ |
| created_at | ✅ | ✅ |
| updated_at | ✅ | ✅ |
| onboarding_motivo | ✅ | ✅ |
| onboarding_tempo | ✅ | ✅ |
| onboarding_desafio | ✅ | ✅ |
| trial_activated_at | ✅ | ✅ |
| trial_end | ✅ | ✅ |
| is_anonymous | ✅ | ✅ |
| anonymous_created_at | ✅ | ✅ |
| **plan** | **✅ (string)** | **❌ AUSENTE** |
| **stripe_customer_id** | **✅ (string\|null)** | **❌ AUSENTE** |

### subscriptions

| Coluna | types.ts | DB |
|--------|----------|----|
| id | ✅ | ✅ |
| user_id | ✅ | ✅ |
| plan | ✅ | ✅ |
| status | ✅ | ✅ |
| provider | ✅ | ✅ |
| provider_subscription_id | ✅ | ✅ |
| current_period_start | ✅ | ✅ |
| current_period_end | ✅ | ✅ |
| trial_end | ✅ | ✅ |
| created_at | ✅ | ✅ |
| updated_at | ✅ | ✅ |
| **stripe_subscription_id** | **✅ (string\|null)** | **❌ AUSENTE** |

### subscription_audit_log

| Status | Detalhe |
|--------|---------|
| **Ausente da D.3** | A tabela foi incluída na query D.3 mas **não retornou nenhuma linha** em `information_schema.columns`. Isso indica que a tabela provavelmente **não existe** no schema `public`. Ela era criada por `20260619203119` (a mesma migration do DRIFT-01). |

> **Atenção:** Se `subscription_audit_log` não existe, o webhook Stripe falha com exceção não tratada em todo evento que tenta inserir no audit log (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`) → retorna HTTP 500 → Stripe retenta por 72h sem sucesso.

### Demais tabelas (sem drift confirmado)

As tabelas abaixo tiveram colunas retornadas por D.3 e são consistentes com `database.types.ts`:

- `checklist_completions` ✅
- `checklist_items` ✅
- `diary_entries` ✅
- `emergency_contacts` ✅
- `family_connections` ✅ (inclui `invitation_expires_at` adicionada manualmente em 21/06)
- `push_tokens` ✅
- `sobriety_records` ✅
- `trigger_categories` ✅
- `user_settings` ✅
- `user_triggers` ✅

**Tabelas não verificadas por D.3 (fora do escopo da query):**
- `sos_activations` — presente em `database.types.ts` (linhas 326–358), não incluída na query D.3. Status: **não verificado**.

---

## D.4 — MO-07: Fonte de Verdade do Plano

### Resultado da query D.4

```
subscriptions_tem_plan:          true
profiles_tem_plan:               false
profiles_tem_stripe_customer_id: false
```

### Análise do fluxo completo

#### Lado do cliente — como o plano é lido

**`app/_layout.tsx` linhas 113–133:**
```tsx
supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  .then(({ data }) => {
    setProfile(data);
    if (data?.plan) setPlan(data.plan as PlanType);  // ← PROBLEMA
    setTrialEnd(data?.trial_end ?? null);             // ← funciona (coluna existe)
    setTrialActivatedAt(data?.trial_activated_at ?? null); // ← funciona
  });
```

- `select('*')` retorna apenas colunas que EXISTEM. Como `profiles.plan` não existe, o objeto `data` não tem propriedade `plan`.
- `if (data?.plan)` → `undefined` → falso → `setPlan()` nunca é chamado.
- `usePlanStore` mantém o default: `plan: 'free'`.

**`hooks/usePlanStore.ts` linha 81–85 — `getEffectivePlan()`:**
```tsx
if (isAnonymous) return 'guardian';                    // funciona
return state.isInTrial() ? 'guardian' : state.plan;   // state.plan = 'free' sempre
```

- **Usuários em trial:** plano correto (`guardian`) via `trial_end` ✅
- **Usuários anônimos:** plano correto (`guardian`) ✅
- **Usuários pagantes (Stripe):** sempre `'free'` ❌

#### Lado do webhook — como o plano é escrito

**`supabase/functions/handle-stripe-webhooks/index.ts`**

**`handleCheckoutCompleted` (linha 96–161):**

| Operação | Resultado real |
|----------|----------------|
| `SELECT plan FROM profiles WHERE id = userId` | ❌ PostgREST 400 — coluna `plan` não existe. Erro swallowed, `oldPlan = 'free'`. |
| `UPDATE profiles SET plan = X WHERE id = userId` | ❌ PostgREST 400 — coluna `plan` não existe. Erro não verificado, silencioso. |
| `UPSERT subscriptions { ..., stripe_subscription_id: X }` | ❌ PostgREST 400 — coluna `stripe_subscription_id` não existe. Erro não verificado. `subscriptions.plan` NÃO é atualizado. |
| `INSERT INTO subscription_audit_log { ... }` | ❌ Provavelmente falha (tabela provavelmente não existe) → exceção propagada → HTTP 500 |

**`handlePaymentFailed` (linha 262–299):**
```ts
const { data: profile } = await supabase
  .from('profiles').select('id, plan').eq('stripe_customer_id', customerId).single();
if (!profile) { console.warn('...'); return; }
```
- `stripe_customer_id` não existe → PostgREST 400 → erro swallowed → `profile = null` → retorno precoce.
- Falhas de pagamento são **completamente ignoradas**.

---

## Veredito

### DRIFT-01 — **CONFIRMADO, ALTO**

A migration `20260619203119_add_monetization_schema` está registrada como "aplicada" em `schema_migrations`, mas **3 colunas do seu DDL nunca foram criadas no banco**:

- `profiles.plan` — ausente
- `profiles.stripe_customer_id` — ausente
- `subscriptions.stripe_subscription_id` — ausente

E possivelmente a tabela inteira `subscription_audit_log` também não existe.

Causa provável: a migration foi registrada manualmente em `schema_migrations` sem executar o SQL, ou o SQL foi executado fora de uma transação e falhou parcialmente (o `CREATE TABLE subscription_audit_log` pré-existia de outra forma ou a ordem de statements causou rollback parcial).

**Risco adicional:** 3 arquivos locais de migration recentes (`20260621000000`, `20260621090000`, `20260621170000`) foram aplicados via Management API e **não estão registrados** em `schema_migrations`. Um `supabase db push` futuro os reaplicará, causando erros de "policy already exists" / "function already exists".

### MO-07 — **CONFIRMADO: QUEBRADO, ALTO**

| Caminho | Status | Impacto |
|---------|--------|---------|
| Trial users — plano via `trial_end` | ✅ Funciona | Nenhum |
| Usuários anônimos — plano forçado 'guardian' | ✅ Funciona | Nenhum |
| Stripe checkout → `profiles.plan` | ❌ Falha silenciosa | Usuário pago fica como 'free' no app |
| Stripe checkout → `subscriptions.plan` | ❌ Falha (stripe_subscription_id ausente) | Registro de assinatura não criado |
| Stripe webhook → audit_log | ❌ Provavelmente 500 | Stripe retenta por 72h |
| Falha de pagamento → lookup por stripe_customer_id | ❌ Falha silenciosa | Inadimplência não detectada |

**Veredito MO-07: usuários que pagam via Stripe e que não ativaram o trial VERÃO O APP COMO PLANO FREE.** O único path funcional de plano premium é o trial (via `profiles.trial_end`).

---

## Achados Adicionais (fora do escopo inicial)

### A1 — Webhook usa `stripe_subscription_id` mas DB tem `provider_subscription_id`

O banco tem a coluna `provider_subscription_id` (genérica, para qualquer provider). O webhook usa `stripe_subscription_id` (específica para Stripe). São colungas **diferentes** com nomes diferentes. O webhook nunca escreve em `provider_subscription_id`.

### A2 — `handleSubscriptionDeleted` filtra por coluna inexistente

```ts
supabase.from('subscriptions').update({ status: 'canceled', ... }).eq('stripe_subscription_id', sub.id);
```
`stripe_subscription_id` não existe → query falha → cancelamento de assinatura nunca é registrado no banco.

### A3 — Migrations RLS não registradas criam risco de re-apply

Se alguém rodar `supabase db push` sem checar, as policies e funções criadas via Management API (`effective_plan()`, políticas de `family_connections`) serão reaplicadas. Isso vai falhar com "already exists" e pode bloquear a aplicação de outras migrations.

---

## Próximos Passos (diagnóstico apenas — não aplique sem decisão do dono)

> **Esta seção é diagnóstico, não prescrição.** Nenhuma das ações abaixo foi executada.

| Prioridade | Ação | Arquivo |
|------------|------|---------|
| P0 | Verificar se `subscription_audit_log` existe em algum schema | Query `SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'subscription_audit_log'` |
| P0 | Verificar se `sos_activations` existe | Idem para `sos_activations` |
| P1 | Aplicar as 3 colunas ausentes ao banco (`profiles.plan`, `profiles.stripe_customer_id`, `subscriptions.stripe_subscription_id`) | Nova migration idempotente |
| P1 | Criar `subscription_audit_log` se ausente | Nova migration |
| P1 | Registrar migrations `20260621*` em `schema_migrations` (ou recriar como migration única) | `supabase db pull` ou INSERT manual |
| P2 | Corrigir webhook para usar `provider_subscription_id` OR adicionar `stripe_subscription_id` ao banco | `handle-stripe-webhooks/index.ts` + migration |
| P2 | Corrigir `_layout.tsx`: após restaurar `profiles.plan`, validar que `setPlan()` é chamado | `app/_layout.tsx:120` |
| P2 | Alternativa estrutural: cliente lê plano de `subscriptions` (não `profiles`) | Zustand + `_layout.tsx` |

---

*Diagnóstico produzido em 2026-06-21. Nenhum dado foi alterado. Próximo passo: decisão do dono sobre qual path de correção seguir (P1 migrations vs refactor do path de leitura).*
