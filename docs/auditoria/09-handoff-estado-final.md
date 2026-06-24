# Handoff — Estado Final e Pendências (repo guardiao-sobrio-app)

> Documento de encerramento desta fase de trabalho no **app**, para consulta futura.
> Data: 2026-06-21 · `main` em `8001203` (antes dos merges pendentes abaixo).
> A fonte de verdade da marca é o repo **guardiao-sobrio-docs** — a próxima fase é atualizá-lo
> para refletir a realidade encontrada aqui (ver §7).

---

## 1. O que foi feito (resumo das Rodadas 1–5 + execução)
- **Auditoria forense de 3 vias** (DOCS × CODE × LIVE) com regras anti-fabricação, score derivado e Evidence Ledger. Relatórios `01`–`05`.
- **Achado 1 — "Gerar código" (Módulo Familiar):** 3 camadas de causa, todas corrigidas e validadas e2e:
  1. coluna `invitation_expires_at` não aplicada (migration drift) → adicionada;
  2. recursão de RLS `42P17` → `effective_plan()` SECURITY DEFINER trata `is_anonymous`; policy recursiva removida (PR #6);
  3. policy `fc_insert_requires_guardian_plan` RESTRICTIVE honra trial via `effective_plan()`.
- **Achado 2 — paywall em cold-load** (`/escudo`, `/programa30`): corrigido (PR #5, commits `4613a2a` + `ecda1f9`).
- **DRIFT-01 — migration drift:** diagnóstico (`07`) + correção (PR #8): colunas `profiles.plan`, `profiles.stripe_customer_id`, `subscriptions.stripe_subscription_id` e tabela `subscription_audit_log` aplicadas; histórico de migrations reparado (11/11 Local=Remote). Migração `20260621180000_repair_monetization_drift`.
- **MO-07 — fonte de verdade do plano:** schema corrigido (colunas existem; fix vivo no banco). Decisão: **Opção A** (ADR `0001`).
- **Lado do familiar (Achado 6):** UI + RPCs `accept_family_invite` / `get_family_day_status` construídos (PR #7); RPCs aplicadas no banco.
- **Skill de auditoria** empacotada (`forensic-compliance-audit`) com as lições aprendidas.

## 2. Estado por achado
| Achado | Status | Evidência |
|---|---|---|
| Achado 1 — Gerar código | ✅ Fechado (validado e2e) | PR #6 / RPCs / "gerou o código sem erros" |
| Achado 2 — paywall cold-load | ✅ Fechado | PR #5 |
| DRIFT-01 — migration drift | ✅ Corrigido no banco | PR #8 (mergeado) |
| MO-07 — plano pago | 🟡 Schema corrigido; **e2e pendente** | PR #8 + ADR 0001 |
| Achado 6 — lado do familiar | 🟡 Construído; **deploy + e2e pendentes** | PR #7 |

## 3. PENDÊNCIAS — execução e validação imediatas
1. ~~**Mergear PR #8**~~ ✅ Mergeado (commit `7d56661`).
2. **Mergear + deployar PR #7** (lado do familiar). Sem deploy, a tela de aceitar convite não chega à produção.
3. **Validar MO-07 e2e (Stripe test mode, cartão 4242 4242 4242 4242):** confirmar `profiles.plan`/`subscriptions.plan` atualizados pelo webhook, `subscription_audit_log` sem 500, e o app refletindo plano pago sem relogin.
4. **Validar Módulo Familiar e2e (2 contas reais):** dono gera → familiar aceita → familiar vê só "Dia guardado/Em jornada" → dono vê "CONECTADO" → revogar.
5. **Conferir PRs pendentes** em `https://github.com/vanzer80/guardiao-sobrio-app/pulls` (PR #7 familiar, branches docs/auditoria-sync e docs/diagnostico-drift).

## 4. PENDÊNCIAS — achados de produto ainda abertos (da auditoria original)
Priorizar por impacto; cada um vira um PR próprio (com docs/roadmap atualizados):
- **🟡 IV-07** — Fonte de corpo **General Sans não carregada** (cai para fonte do sistema). Precisa baixar a fonte (Fontshare) e incluir no `useFonts`.
- **🟡 FN-25 / FN-12** — **Contatos de Confiança** é stub ("em breve") e a etapa **CONTATO** do SOS não aciona contatos reais (faz grounding 5-4-3-2-1).
- **🟡 AR-03** — view segura do familiar: resolvida na prática via RPC `get_family_day_status` (SECURITY DEFINER); confirmar que substitui a view planejada.
- **🟠 FN-23** — **Comunidade O Escudo** não implementada (Fase 3) — construir ou marcar explicitamente como fase futura no ROADMAP.
- **🔵 RN-03 / RN-04** — cortes free×pago (histórico/diário 7 dias) **não impostos** (todos recebem 90 dias / ilimitado).
- **✅ MO-02** — preço anual alinhado: código agora `R$299` (= doc). Resolvido.
- **🔵 MO-03** — produtos avulsos do PRD/funil **não implementados** (o app é por assinatura) — decidir e alinhar docs.
- **🔵 VOZ-01** — notificação usa "Um dia de cada vez" (frase de AA que a marca removeu — D2). Trocar.
- **🔵 AR-08** — landing pública / SSR (visão PRD) inexistente (app é SPA). Decidir escopo.
- **🔵 Diversos visuais** — IV-04 (tons hover), IV-08 (ícones Phosphor×Ionicons), IV-10 (posição SOS), IV-12 (modo claro), IV-13 (emojis), FN-04 (contador h/m), FN-07 (micro-animação), FN-13 (timer 5 min do PARE), FN-17 ("aplicado" não persiste).

## 5. PENDÊNCIAS — processo (evitar recorrência)
- **Anti-drift no CI:** adicionar checagem que falha se houver migration não aplicada / types dessincronizados (ex.: `supabase db diff` / `supabase migration list` em staging). Nenhuma migration é "concluída" sem confirmação de execução no ambiente-alvo.
- **Manter sincronizados** `lib/database.types.ts` ↔ migrations ↔ banco (`supabase db pull` / `gen types`).
- **MO-07 longo prazo:** reavaliar a **Opção B** (fonte única `subscriptions.plan`) — registrada no ADR `0001`.
- **Regra permanente:** toda mudança atualiza, no mesmo PR, `docs/auditoria/` + `ROADMAP.md` + `CHANGELOG.md` (+ ADR para decisões estruturais).

## 6. Índice dos documentos da auditoria (`docs/auditoria/`)
`README.md` (índice) · `01`–`02` (rodadas 1–2) · `03-relatorio-FINAL.md` (consolidado) · `04` (execução rodada 4) · `05` (recursão RLS) · `06` (módulo familiar incompleto + spec) · `07` (diagnóstico drift) · `08` (correção drift/MO-07) · `09` (este handoff) · `RUNBOOK.md` · `ETAPA-A-supabase-passo-a-passo.md` · `pacote-diagnostico-banco.sql` · `diagnostico-migration-drift.sql` · `ORIENTACAO-DEVS-proximos-passos.md`.

## 7. Ponte para o repo guardiao-sobrio-docs (próxima fase)
O repo de docs é a **fonte de verdade da marca** e ficou desatualizado em relação ao app real. A próxima fase deve refletir lá as divergências confirmadas nesta auditoria, entre elas:
- **Modelo de monetização:** o app usa **assinaturas** (Free/Essential R$19,90/Guardião R$39,90), não os **produtos avulsos** do PRD/funil (R$47/97/197). Alinhar a doc à realidade (ou registrar a decisão).
- **Stack/arquitetura:** Expo/React Native + Supabase + Stripe (não o "Next.js" do PRD §4.2). A landing/admin do PRD não existem.
- **Modelo de dados:** o schema real (normalizado) diverge do `06-modelo-de-dados.md` (que cita `daily_checklists` item_1..5, view `family_day_status` etc.). Atualizar para o schema atual + RPCs `effective_plan`/`accept_family_invite`/`get_family_day_status`.
- **Identidade visual:** tokens reais (cores/hover), ícones (Ionicons), fonte de corpo (General Sans ainda pendente), botão SOS central. Conciliar com `04-design-system.md` e `marca/*`.
- **Fonte de verdade do plano:** documentar a decisão (Opção A) e o `effective_plan()`.
- **Lições de processo:** migration drift, RLS recursion, validar e2e — registrar para não repetir.

> Trabalho no **app** encerrado nesta fase. Próximo: atualizar **guardiao-sobrio-docs**.
