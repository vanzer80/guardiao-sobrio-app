# Auditoria Forense — RODADA 5: 2ª camada do Achado 1 (recursão de RLS 42P17)

> Registro datado (2026-06-21). Preserva histórico — não substitui as rodadas anteriores.
> Achado 1 agora **FECHADO e validado e2e** no app. PR #6 mergeado, `main` em `8001203`.

---

## 1. Sintoma observado (runtime)
Console do app, ao tocar "Gerar código":
```
rest/v1/family_connections?select=*  → 500 (Internal Server Error)
[createInvite] falha ao gerar convite: Object        (log que adicionamos no Achado 1)
Animated: `useNativeDriver` is not supported ...      (aviso BENIGNO na web — animação cai p/ JS)
```
O log `[createInvite]` (PR #5) foi o que tornou o erro visível e acelerou o diagnóstico — exatamente o propósito daquele commit.

## 2. Causa-raiz — recursão circular de RLS (PostgreSQL 42P17)
Não era bug de código nem de schema; era um ciclo entre políticas:
```
INSERT family_connections
 → policy "Anônimos não podem criar conexões" (NOT EXISTS SELECT FROM profiles — SEM security definer)
   → dispara as policies de SELECT de profiles
     → family_select_profile: EXISTS (SELECT FROM family_connections ...)
       → dispara as policies de SELECT de family_connections
         → ciclo detectado → 42P17 → HTTP 500
```

## 3. Fix aplicado em produção
1. `effective_plan()` passou a retornar `'free'` quando `is_anonymous = true`, **dentro da função `SECURITY DEFINER`** — que bypassa a RLS de `profiles` e **quebra o ciclo**.
2. Policy "Anônimos não podem criar conexões de família" **removida** (redundante: `effective_plan='free'` já bloqueia via `fc_insert_requires_guardian_plan`).

**Verificação (PostgREST autenticado, conta de auditoria, trial ativo):**
- `INSERT family_connections` → **201** ✅
- `effective_plan()` = `'free'` para anônimos ✅
- 4 policies restantes, nenhuma recursiva ✅
- **No app:** "Gerar código" gerou o código de 6 dígitos **sem erro** ✅

## 4. Status consolidado do Achado 1 (3 camadas)
| Camada | Causa | Fix | Status |
|---|---|---|---|
| 1 | `invitation_expires_at` não aplicada (migration drift) | coluna adicionada (Rodada 4) | ✅ |
| 2 | recursão de RLS 42P17 (policy anônimos ↔ profiles ↔ family_connections) | `effective_plan()` checa `is_anonymous` (SECURITY DEFINER) + policy recursiva removida | ✅ |
| — | (hipótese inicial: gate de `plan` na RLS) | — | ❌ refutada |
**Achado 1: FECHADO (e2e validado).**

## 5. Lições (incorporar à prática e à skill de auditoria)
- **Causa-raiz em camadas:** corrigir uma revela a próxima — re-testar e2e após cada fix; não declarar vitória cedo.
- **A remediação pode introduzir regressão:** policies adicionadas na correção contribuíram para a recursão. Validar após cada mudança de RLS.
- **RLS que referencia outras tabelas protegidas por RLS pode recorrer (42P17):** quebrar o ciclo com função `SECURITY DEFINER`; remover policies redundantes.
- **`useNativeDriver` na web é aviso benigno** (animação cai para JS); não é erro.

## 6. ⚠️ Atualizar documentação/roadmap (regra permanente)
Entradas sugeridas (já parcialmente feitas pelos devs — conferir):
- **CHANGELOG.md:** `fix(db): quebra recursão de RLS 42P17 em family_connections (effective_plan trata is_anonymous; policy redundante removida) — Achado 1 camada 2 [PR #6]`.
- **ROADMAP.md:** Achado 1 → concluído (e2e); registrar decisão "RLS cross-table usa SECURITY DEFINER para evitar 42P17".
- **docs/adr/:** ADR curto "Quebra de recursão de RLS via effective_plan SECURITY DEFINER".
- **03-relatorio-FINAL.md (§0):** FN-20 → ✅ e2e validado; remover o "validação e2e pendente"; citar a 2ª camada (42P17).
- Manter `lib/database.types.ts` e `supabase/migrations/` sincronizados (`supabase db pull` / `gen types`).

## 7. Pendências que seguem abertas (não confundir com o Achado 1)
- **DRIFT-01** (Alto): varredura completa de migrations não aplicadas (`diagnostico-migration-drift.sql`); `profiles.plan` e `profiles.stripe_customer_id` ainda ausentes.
- **MO-07** (Alto, verificar): cliente lê `profiles.plan` (inexistente) vs verdade em `subscriptions.plan` → testar plano pago.
