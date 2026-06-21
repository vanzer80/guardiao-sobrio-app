# Orientação aos Devs — Próximos Passos da Auditoria (O Guardião Sóbrio)

Estado atual: Achado 1 ("Gerar código") teve a **causa-raiz real** corrigida no banco (coluna `invitation_expires_at` não aplicada — não era a RLS, era migration drift). Achado 2 (paywall) já corrigido em código (`4613a2a`). Surgiram dois achados sistêmicos: **DRIFT-01** (migrations não aplicadas) e **MO-07** (fonte de verdade do plano). Detalhes em `04-relatorio-rodada4-execucao.md`.

---

## ⚠️ REGRA PERMANENTE (vale para TODOS os passos abaixo)

**Nenhuma mudança é considerada concluída sem atualizar a documentação e o roadmap — no mesmo PR.** Isso evita perda de histórico e retrabalho. Em todo PR:
1. Atualizar `docs/auditoria/` (estado/veredito do item).
2. Atualizar `ROADMAP.md` (item concluído / fase / decisão `Dxx`).
3. Registrar em `CHANGELOG.md` (o quê e por quê).
4. Decisão estrutural → criar **ADR** em `docs/adr/NNNN-titulo.md` (contexto → decisão → consequências).
5. Manter `lib/database.types.ts` + `supabase/migrations/` **sincronizados com o banco** (`supabase db pull` / `gen types`).

Cada passo abaixo já termina com "📝 Documentar" — não pule.

---

## Prioridade 0 — Validar o que já foi corrigido
- **P0.1** No app, conta com trial ativo → Módulo Familiar → "Gerar código": deve sair o código de 6 dígitos sem erro (fecha o e2e do Achado 1).
- **P0.2** Confirmar o paywall: abrir `/escudo` e `/programa30` direto (cold-load) com trial/Guardião → conteúdo liberado, sem paywall indevido.
- 📝 Documentar: marcar FN-20 e Achado 2 como **FECHADOS (e2e)** em `docs/auditoria/03-relatorio-FINAL.md` e no `ROADMAP.md`.

## Prioridade 1 — Migration drift (DRIFT-01) — sistêmico, mais urgente
- **P1.1** Rodar `docs/auditoria/diagnostico-migration-drift.sql` (D.1–D.4) e `supabase migration list` → listar TODAS as colunas/tabelas/migrations dessincronizadas (não só as 3 já achadas).
- **P1.2** Sincronizar o baseline: `supabase db pull` + `supabase gen types typescript --linked > lib/database.types.ts`. Revisar o diff com cuidado.
- **P1.3** Para cada coluna realmente necessária que falta (ex.: decidir se `profiles.plan`/`stripe_customer_id` devem existir — ver P2), criar migration corretiva e aplicar (`supabase db push`).
- 📝 Documentar: registrar o inventário de drift e a correção em `docs/auditoria/` + `CHANGELOG.md`; atualizar `ROADMAP.md`.

## Prioridade 2 — Fonte de verdade do plano (MO-07)
- **P2.1** Verificar com **conta pagante** (cartão de teste Stripe) se o webhook reflete o plano no app. Hoje o cliente lê `profiles.plan` (ausente no DB) e a verdade está em `subscriptions.plan`.
- **P2.2** Decidir a fonte única de verdade e alinhar:
  - Opção A: aplicar `profiles.plan` de fato e manter o webhook/cliente como estão; ou
  - Opção B (recomendada): cliente (`_layout.tsx`/`usePlanStore`) e webhook passam a usar `subscriptions.plan`. O `effective_plan()` do banco já segue esta linha.
- 📝 Documentar: **ADR** registrando a decisão (A ou B) + atualizar `03-relatorio-FINAL.md`, `ROADMAP.md`, `CHANGELOG.md`.

## Prioridade 3 — Achados de produto pendentes (PRs próprios)
| Item | Achado | Ação |
|---|---|---|
| Fonte General Sans | IV-07 | Baixar na Fontshare → `assets/fonts/` → entrada no `useFonts` de `app/_layout.tsx` |
| Contatos de Confiança | FN-25/FN-12 | CRUD em `emergency_contacts` (já existe no DB) + religar à etapa CONTATO do SOS e ao Perfil |
| View segura `family_day_status` | AR-03 | Criar view `SECURITY DEFINER` expondo só `{owner,date,completed}` |
| Comunidade O Escudo | FN-23 | Construir ou marcar explicitamente como Fase 3 no `ROADMAP.md` |
| Cortes free×pago | RN-03/04 | Aplicar limite de histórico/diário (7 dias) ou remover a regra do spec |
| Preço anual / cópia notificação / visuais | MO-02 / VOZ-01 / IV-* | Alinhar R$299×R$399; trocar "Um dia de cada vez"; hover/ícones/modo claro |
- 📝 Documentar cada PR: veredito do achado em `docs/auditoria/`, item no `ROADMAP.md`, linha no `CHANGELOG.md`.

## Prioridade 4 — Prevenir recorrência do drift (processo)
- **P4.1** No CI (`.github/workflows/ci.yml`), adicionar checagem que falha se houver migration não aplicada / types dessincronizados (ex.: `supabase db diff` em ambiente de staging).
- **P4.2** Padronizar: nenhuma migration é "concluída" sem confirmação de execução no ambiente-alvo.
- 📝 Documentar o processo em `docs/` e referenciar no `ROADMAP.md`.

---

## Padrão de trabalho (todos os PRs)
- Uma branch por correção; **Conventional Commits** citando o ID do achado (ex.: `fix(db): aplica invitation_expires_at [DRIFT-01]`).
- Gates antes do commit: `npm run typecheck && npm run lint && npm test` (tudo verde).
- PR com preview do Vercel; **sem merge** sem revisão.
- E, repetindo: **docs + ROADMAP + CHANGELOG atualizados no mesmo PR** — sempre.
