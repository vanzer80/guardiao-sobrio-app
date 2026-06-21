# Auditoria Forense — O Guardião Sóbrio

Auditoria de conformidade de 3 vias (**DOCS × CODE × LIVE**) realizada em 20–21/06/2026 sobre `guardiao-sobrio-app` (`main@2cbcf0a`) e `guardiao-sobrio-docs` (`main@90c5d95`).

**Veredito:** ATENDE PARCIALMENTE · **Score de conformidade: 72,6%** (61 conformes / 84 verificáveis).

## Arquivos desta pasta

| Arquivo | O que é |
|---|---|
| `03-relatorio-FINAL.md` | **Comece por aqui.** Relatório consolidado: estado de cada item (FECHADO/PENDENTE-DONO), score reconciliado, causa-raiz do Achado 1 e backlog priorizado. |
| `RUNBOOK.md` | Guia passo a passo de execução das correções (banco + código), com comandos, resultado esperado e validação. |
| `pacote-diagnostico-banco.sql` | Pacote SQL para o dono rodar no Supabase: diagnóstico de RLS (C.1), query decisiva do bug do convite (C.2), versionamento (C.3) e patch (C.4). |
| `01-relatorio-rodada1.md` | Auditoria inicial completa (manifesto de acesso, inventário, registro de requisitos, reconciliação, evidence ledger). |
| `02-relatorio-rodada2.md` | Fechamento de lacunas: leitura das migrações, isolamento da causa-raiz, vereditos atualizados. |

## Achados principais

- 🔴 **Achado 1 — `Gerar código` (Módulo Familiar) quebrado.** Causa-raiz isolada: `activate_trial()` não promove `profiles.plan` (trial fica `plan='free'`), enquanto o webhook do Stripe promove para pagantes; a RLS de `family_connections` rejeita o usuário em trial. Patch em `supabase/migrations/20260621090000_fix_family_connections_rls.sql` (a operação exata INSERT×SELECT é decidida pela query `C.2`).
- 🟠 **Achado 2 — Paywall indevido em cold-load** de `/escudo` e `/programa30` para usuários com direito (trial/Guardião): a checagem de plano não reage ao carregamento assíncrono do perfil.
- 🟡 Fonte de corpo **General Sans não carregada**; **Contatos de Confiança** é stub; **view segura `family_day_status`** ausente do versionamento; RLS versionada só parcialmente.

## Correção da causa de fundo

O schema-base e a RLS das tabelas de usuário **não estão versionados** (as migrações só fazem `ALTER` em tabelas pré-existentes). Rodar `supabase db pull` (RUNBOOK, Etapa A.3) traz tudo para `supabase/migrations/`.
