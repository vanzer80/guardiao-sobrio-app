# Auditoria Forense — RODADA 4: Execução em Produção + Correção de Causa-Raiz

> Registro da execução das correções no banco (Supabase) e no app, em 2026-06-21.
> **Preserva o histórico:** não apaga as hipóteses anteriores — corrige-as com a evidência da execução. Toda revisão aqui deve ser refletida no `03-relatorio-FINAL.md`, no `ROADMAP` e no `CHANGELOG` do repo (ver §8).

---

## 1. O que foi executado em produção

| # | Ação no banco | Efeito |
|---|---|---|
| 1 | `ADD COLUMN invitation_expires_at TIMESTAMPTZ` em `family_connections` | **Fix raiz do Achado 1.** A coluna existia na migration `20260619210313` e em `database.types.ts`, mas nunca foi aplicada ao DB. `createInvite` falhava com *"column does not exist"* antes de tocar RLS. |
| 2 | `CREATE INDEX idx_family_connections_token` | Performance: busca por token sem full-scan. |
| 3 | `CREATE FUNCTION public.effective_plan(uid)` | Plano efetivo: `profiles.trial_end > now()` → `'guardian'`; senão `subscriptions.plan`. Corrige o C.4 original, que usava `profiles.plan` (coluna inexistente no DB). |
| 4 | `CREATE POLICY fc_insert_requires_guardian_plan AS RESTRICTIVE` | Defense-in-depth: bloqueia INSERT no DB para quem não é guardian (inclui trial via `effective_plan`). **RESTRICTIVE** (não PERMISSIVE como o C.4 previa) — a versão permissiva seria OR-ada com a policy de dono e não restringiria nada. |

Artefato versionado: `supabase/migrations/20260621000000_rls_effective_plan_family_connections.sql`.

---

## 2. Correção de causa-raiz do Achado 1 (epistemologia)

- **Hipótese inicial (Rodadas 1–3): REFUTADA.** Suspeitávamos que a RLS gatava por `plan='guardian'` e rejeitava o trial. Mantivemos essa hipótese como *não confirmada*, condicionada à query decisiva C.2 — e fizemos certo em não cravar.
- **Causa real (confirmada na execução):** a coluna `invitation_expires_at` **não existia no banco** (migration marcada como aplicada em `schema_migrations` sem ter rodado). Todo `createInvite` quebrava com *"column does not exist"*, **antes** de qualquer avaliação de RLS.
- **Lição:** o sintoma (UI vazia + erro opaco) era ambíguo; só a inspeção direta do banco decidiu. A correção epistêmica da Rodada 3 (parar de afirmar "0 linhas / é a RLS" e exigir a checagem decisiva) foi o que evitou um diagnóstico errado.
- **Status:** ✅ **causa eliminada** (coluna adicionada + índice + policy RESTRICTIVE de defesa). **Validação e2e no app pendente** (owner) — ver §6.

---

## 3. NOVO ACHADO — Migration Drift (DRIFT-01) · Severidade ALTA

Migrations **registradas como aplicadas mas nunca executadas** no banco — o `.sql` versionado está dessincronizado do estado real. Já confirmadas:

| Coluna esperada (código/types/migration) | Migration | No DB? |
|---|---|---|
| `family_connections.invitation_expires_at` | `20260619210313` | ❌ faltava → ✅ corrigida na Rodada 4 |
| `profiles.plan` | `20260619203119` | ❌ ausente |
| `profiles.stripe_customer_id` | `20260619203119` | ❌ ausente |

**Impacto:** o código e o `database.types.ts` assumem colunas que o banco não tem → erros em runtime difíceis de diagnosticar (exatamente o Achado 1). **Provavelmente há mais** colunas/tabelas nesse estado — exige varredura (ver `diagnostico-migration-drift.sql`). Este é o achado sistêmico que estava por trás de vários sintomas; supera, em prioridade, os itens cosméticos.

---

## 4. NOVO ACHADO / RISCO — Fonte de verdade do plano (MO-07) · Severidade ALTA · PENDENTE-VERIFICAÇÃO

O cliente lê **`profiles.plan`** — em `app/_layout.tsx` (`if (data?.plan) setPlan(...)`) e o webhook do Stripe escreve `profiles.plan` (`handle-stripe-webhooks → handleCheckoutCompleted: update({ plan })`). Mas `profiles.plan` **não existe no banco** (DRIFT-01), e a fonte real é **`subscriptions.plan`** (confirmado pela migration `20260620130000`).

**Consequência provável (a verificar):** o reflexo de **plano pago** pode não funcionar — o webhook tentaria gravar numa coluna inexistente e o cliente leria `undefined` → o usuário pagante permaneceria `free` no app. Hoje só o **trial** funciona, porque `trial_end` está em `profiles` e foi aplicado.

**Como confirmar:** ver `diagnostico-migration-drift.sql` (D.2) + teste com conta pagante (checklist do dono). **Não afirmar como fato até a verificação.**

---

## 5. Melhorias aplicadas sobre o pacote original (registrar)
- Policy criada como **RESTRICTIVE** (correção sobre o C.4, que previa permissive).
- `effective_plan()` usa **`subscriptions.plan`** (não `profiles.plan`).
Ambas devem constar no `03-relatorio-FINAL.md` e no ADR/decisões (§8).

---

## 6. Status atualizado dos achados

| Achado | Status |
|---|---|
| **FN-20** — "Gerar código" | ✅ Causa eliminada no banco (coluna+índice+policy). **Validação e2e no app: PENDENTE-DONO** (tocar "Gerar código" com trial ativo → código de 6 dígitos sem erro). |
| **Achado 2** — paywall cold-load | ✅ Corrigido (commit `4613a2a`, `escudo.tsx` linhas ~428–429; + `programa30.tsx`). |
| **DRIFT-01** — migration drift | 🔴 Parcial: `invitation_expires_at` corrigida; `profiles.plan` e `profiles.stripe_customer_id` ainda ausentes; varredura completa pendente. |
| **MO-07** — fonte de verdade do plano | ❓ PENDENTE-VERIFICAÇÃO (teste com conta pagante). |

---

## 7. Score recalculado (Rodada 4)

Base Rodada 3: ✅58 ⭐3 ⚠️15 ❌7 🔴1 ❓2 · total 86 · verificáveis 84 · conforme 61 · **72,6%**.
Mudanças: FN-20 🔴→✅ (+1 conforme, −1 quebrado); +DRIFT-01 (❌); +MO-07 (❓).

```
✅ 59 | ⭐ 3 | ⚠️ 15 | ❌ 8 | 🔴 0 | ❓ 3   →  total 88
Verificáveis = 88 − 3 = 85
Conforme (✅+⭐) = 62
Score = 62 ÷ 85 × 100 = 72,9%
```
Praticamente estável (72,6% → 72,9%): o conserto do FN-20 foi compensado pelo novo achado sistêmico (DRIFT-01). É o resultado honesto de uma execução que revelou um problema maior.

---

## 8. ⚠️ Regra permanente — atualizar documentação e roadmap (em TODA mudança)

Para **não perder histórico nem gerar retrabalho**, toda alteração de código/banco deve, no mesmo PR:
1. Atualizar `docs/auditoria/` (este conjunto) com o novo estado/veredito.
2. Atualizar o **`ROADMAP.md`** (item concluído / movido de fase / nova decisão Dxx).
3. Registrar no **`CHANGELOG.md`** (o que mudou e por quê).
4. Para decisões estruturais (ex.: fonte de verdade do plano = `subscriptions.plan`), criar um **ADR** curto em `docs/adr/NNNN-titulo.md` (contexto → decisão → consequências).
5. Manter `database.types.ts` e as migrations **sincronizados com o banco** (`supabase db pull`).

**Atualizar agora:** refletir no `03-relatorio-FINAL.md` a causa-raiz real do Achado 1 (§2), DRIFT-01 (§3) e MO-07 (§4); marcar FN-20/Achado 2 no `ROADMAP.md`; abrir ADR para a decisão `subscriptions.plan`.
