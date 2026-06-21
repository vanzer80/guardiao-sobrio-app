# Auditoria Forense — O Guardião Sóbrio

Auditoria de conformidade de 3 vias (**DOCS × CODE × LIVE**) realizada em 20–21/06/2026 sobre `guardiao-sobrio-app` (`main@2cbcf0a`) e `guardiao-sobrio-docs` (`main@90c5d95`).

**Veredito:** ATENDE PARCIALMENTE · **Score (Rodada 4): 72,9%** (62 conformes / 85 verificáveis) · Rodadas 1–3: 72,6%. Execução em produção: ver `04-relatorio-rodada4-execucao.md`.

## Arquivos desta pasta

| Arquivo | O que é |
|---|---|
| `03-relatorio-FINAL.md` | **Comece por aqui.** Relatório consolidado: estado de cada item (FECHADO/PENDENTE-DONO), score reconciliado, causa-raiz do Achado 1 e backlog priorizado. |
| `RUNBOOK.md` | Guia passo a passo de execução das correções (banco + código), com comandos, resultado esperado e validação. |
| `pacote-diagnostico-banco.sql` | Pacote SQL para o dono rodar no Supabase: diagnóstico de RLS (C.1), query decisiva do bug do convite (C.2), versionamento (C.3) e patch (C.4). |
| `01-relatorio-rodada1.md` | Auditoria inicial completa (manifesto de acesso, inventário, registro de requisitos, reconciliação, evidence ledger). |
| `02-relatorio-rodada2.md` | Fechamento de lacunas: leitura das migrações, isolamento da causa-raiz, vereditos atualizados. |
| `04-relatorio-rodada4-execucao.md` | **Execução em produção:** causa-raiz real do Achado 1 (refuta a hipótese), achados DRIFT-01 e MO-07, score recalculado (72,9%). |
| `ETAPA-A-supabase-passo-a-passo.md` | Passo a passo mastigado da Etapa A (Supabase): como ler cada resultado de C.1/C.2 e quando aplicar a migração. |
| `diagnostico-migration-drift.sql` | Diagnóstico (read-only) das migrations não aplicadas e colunas/tabelas faltantes no banco. |
| `ORIENTACAO-DEVS-proximos-passos.md` | Próximos passos priorizados para os devs (com a regra de sempre atualizar docs + ROADMAP + CHANGELOG). |
| `05-relatorio-rodada5-rls-recursion.md` | Rodada 5: diagnóstico e fix do erro 42P17 (recursão circular RLS em INSERT na `family_connections`). |
| `06-achado-modulo-familiar-incompleto.md` | Achado 6: lado do familiar sem UI + spec de correção (RPCs SECURITY DEFINER + tela aceitar-convite). |

## Achados principais

- ✅ **Achado 1 — `Gerar código` CORRIGIDO (causa-raiz real, Rodada 4).** A hipótese inicial (RLS/plano) foi **refutada** na execução: a coluna `family_connections.invitation_expires_at` nunca foi aplicada ao banco (migration drift) → `createInvite` falhava com *column does not exist* antes da RLS. Corrigido (coluna + índice + policy RESTRICTIVE + `effective_plan()`). Ver `04-relatorio-rodada4-execucao.md`.
- ✅ **42P17 — Recursão circular RLS em INSERT** CORRIGIDO (Rodada 5, PR #6). `effective_plan()` passou a retornar `'free'` para anônimos; policy recursiva removida. Ver `05-relatorio-rodada5-rls-recursion.md`.
- ✅ **Achado 6 — Módulo Familiar (lado do familiar)** IMPLEMENTADO (este PR). RPCs `accept_family_invite` + `get_family_day_status` aplicadas; tela `aceitar-convite.tsx`; links em `welcome.tsx` e `perfil.tsx`; vista "Familiar Vinculado" em `escudo.tsx`. Validação e2e: PENDENTE-DONO.
- 🔴 **NOVO — DRIFT-01 (Alto):** migrations registradas mas não executadas; faltam também `profiles.plan` e `profiles.stripe_customer_id`. Diagnóstico: `diagnostico-migration-drift.sql`.
- 🟠 **NOVO — MO-07:** o cliente lê `profiles.plan` (inexistente no DB); a verdade está em `subscriptions.plan` → reflexo de plano pago possivelmente quebrado (verificar com conta pagante).
- ✅ **Achado 2 — Paywall indevido em cold-load** FECHADO (commit `4613a2a`): `escudo.tsx` e `programa30.tsx` subscrevem `plan` E `trialEnd` para reatividade.
- 🟡 Fonte de corpo **General Sans não carregada**; **Contatos de Confiança** é stub; RLS versionada só parcialmente.

## Correção da causa de fundo

O schema-base e a RLS das tabelas de usuário **não estão versionados** (as migrações só fazem `ALTER` em tabelas pré-existentes). Rodar `supabase db pull` (RUNBOOK, Etapa A.3) traz tudo para `supabase/migrations/`.
