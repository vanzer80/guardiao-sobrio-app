# 🧩 Auditoria Forense — RELATÓRIO FINAL CONSOLIDADO — App "O Guardião Sóbrio"

> Consolida Rodadas 1–3. Reconciliação de 3 vias: **DOCS × CODE × LIVE**, mais o que só o **dono** pode fechar via SQL.
> **Commits:** CODE `main@2cbcf0a` · DOCS `main@90c5d95` (inalterados nas 3 rodadas).
> **Acompanha:** `pacote-diagnostico-banco.sql` (diagnóstico + patch para o dono executar).
> **Regra-mãe:** nenhuma afirmação sem evidência citável (`arquivo:linha` · `URL→status` · `query→resultado esperado`). Nada de suposição.

---

## 1. Veredito e Score (reconciliado e fechando aritmeticamente)

**ATENDE PARCIALMENTE.** Núcleo gratuito + ético sólido e no ar; arquitetura fiel ao spec técnico (Expo/Supabase/Stripe). Pendências: 1 defeito funcional (convite familiar, causa-raiz isolada), reatividade de paywall em cold-load, funcionalidades de Fase 2/3 não construídas, e a camada de segurança (RLS) não versionada — cuja verificação definitiva é do dono.

```
Score = (✅ CONFORME + ⭐ POSITIVA) ÷ VERIFICÁVEIS × 100
Score = (58 + 3) ÷ 84 × 100 = 61 ÷ 84 × 100 = 72,6%
```

| Veredito | Qtd | Conta por categoria (Vis·Func·Reg·Étc·Rot·Arq·Mon·Voz) |
|---|---|---|
| ✅ Conforme | **58** | 7 · 23 · 5 · 6 · 13 · 2 · 2 · 0 |
| ⭐ Divergência positiva | **3** | 0 · 0 · 0 · 0 · 0 · 1 · 2 · 0 |
| ⚠️ Divergente-neutro | **15** | 4 · 5 · 2 · 1 · 0 · 1 · 1 · 1 |
| ❌ Faltando | **7** | 2 · 2 · 0 · 0 · 0 · 2 · 1 · 0 |
| 🔴 Quebrado | **1** | 0 · 1 · 0 · 0 · 0 · 0 · 0 · 0 |
| ❓ Pendente-Dono (excluído do denominador) | **2** | 0 · 0 · 0 · 0 · 0 · 2 · 0 · 0 |
| **TOTAL** | **86** | 13·31·7·7·13·8·6·1 |

**Verificação aritmética:** 58+3+15+7+1+2 = **86** ✓ · Verificáveis = 86−2 = **84** · Conforme = 58+3 = **61** · Não conforme = 15+7+1 = **23** · 61+23 = **84** ✓.

> **Correção da Rodada 2:** a R2 publicou 71,4% (tinha contado ✅=57 e total 84≠86). O recont correto é **✅=58, ❌=7 ⇒ conforme 61 ⇒ 72,6%**. Este é o número oficial.

> **Por que "fechar lacunas" baixou o score (75,0% → 72,6%):** aprofundar revelou mais divergências (cortes de retenção não impostos, RLS só parcialmente versionada, view ausente, cópia de notificação banida) do que conformidades. Honesto. Das 23 não-conformidades, **15 são `⚠️` baixas/neutras**, **7 `❌`** (Fase 2/3 ou visão PRD), **1 `🔴`**.

---

## 2. Estado de Cada Item (FECHADO / PENDENTE-DONO)

Legenda de status: **FC** = Fechado (código) · **FR** = Fechado (runtime) · **PD** = Pendente-Dono (query do pacote).

### Identidade Visual
| ID | Requisito | Veredito | Status |
|---|---|---|---|
| IV-01 | Paleta noir (tokens) | ✅ | FR ss_03686 + `tailwind.config.js` |
| IV-02 | Ouro `#c8a84b` | ✅ | FC `constants/Colors.ts → gold` |
| IV-03 | Emergência `#e07b2a` | ✅ | FC/FR |
| IV-04 | Tons de hover | ⚠️ Baixo | FC (`goldDim #a68a3a` ≠ `#b8942f`) |
| IV-05 | Cormorant (display) | ✅ | FC/FR `_layout.tsx useFonts` |
| IV-06 | JetBrains Mono | ✅ | FC/FR |
| IV-07 | General Sans (corpo) **não carregada** | ❌ Médio | FC (referenciada, não importada) |
| IV-08 | Ícones Phosphor → Ionicons | ⚠️ Baixo | FC |
| IV-09 | SOS sempre visível/cor | ✅ | FR |
| IV-10 | SOS posição 56px inf. dir. | ⚠️ Baixo | FC (aba central) |
| IV-11 | Modo escuro padrão | ✅ | FC/FR `app.json` |
| IV-12 | Modo claro opcional | ❌ Baixo | FC (ausente) |
| IV-13 | Sem emojis como design (🔒) | ⚠️ Baixo | FR `/metodo` |

### Funcionalidade & Fluxos
| ID | Requisito | Veredito | Status |
|---|---|---|---|
| FN-01 | Onboarding 3 perguntas | ✅ | FC `register.tsx`+colunas; perfil ao vivo populado (Foco "drogas") |
| FN-02 | Contador + marcos | ✅ | FR |
| FN-03 | Sem reset punitivo | ✅ | FR |
| FN-04 | Contador tempo-real h/m | ⚠️ Baixo | FC (só dias) |
| FN-05 | Checklist 5 itens | ✅ | FR |
| FN-06 | 1/dia, persiste | ✅ | FR |
| FN-07 | Micro-animação bounce | ⚠️ Baixo | FC |
| FN-08 | SOS 5 etapas | ✅ | FR ss_0957…5574 |
| FN-09 | Respiração 4-4-6 | ✅ | FR ss_0088 |
| FN-10 | SOS ≤2 toques | ✅ | FR |
| FN-11 | SOS 3/mês, nunca bloqueia crise | ✅ | FR/FC |
| FN-12 | CONTATO = acionar contatos | ⚠️ Médio | FR (é grounding 5-4-3-2-1) |
| FN-13 | PARE timer 5 min | ⚠️ Baixo | FC (auto-avança 4s) |
| FN-14 | Diário 50ch/edit-não-delete/rotação | ✅ | FR `/diario` |
| FN-15 | 13 fundamentos fiéis | ✅ | FC/FR |
| FN-16 | Free=3 / pago=13 | ✅ | FR |
| FN-17 | "Aplicado" persiste | ⚠️ Baixo | FC (estado local) |
| FN-18 | Mapa de Gatilhos CRUD | ✅ | FR (criação OK) |
| FN-19 | Familiar 6díg/48h/revoga/só-status | ✅ | FC `lib/family.ts` |
| FN-20 | "Gerar código" funciona (web) | 🔴 Alto | **mecanismo confirmado; operação INSERT×SELECT → PD (query C.2)** |
| FN-21 | Programa 30 progressivo | ✅ | FR ss_8677 |
| FN-22 | Certificado Prog. 30 | ✅ | FC `programa30.tsx → Certificado` |
| FN-23 | Comunidade O Escudo | ❌ Alto | FC (só flag; sem UI) |
| FN-24 | Estatísticas + PDF | ✅ | FR (PDF não exercido) |
| FN-25 | Contatos de confiança | ❌ Médio | FR (stub "em breve") |
| FN-26 | Lembrete diário | ✅ | FR/FC |
| FN-27 | Sem notif 23h–7h | ✅ | FC (clamp em `notifications.ts`); push e2e → PD (C5 device) |
| FN-28 | Biometria/PIN | ✅ | FC (oculto na web, correto) |
| FN-29 | Exclusão LGPD ≤2 toques | ✅ | FC (edge `delete-account` service_role) |
| FN-30 | Auth e-mail/senha | ✅ | FC/FR |
| FN-31 | OAuth Google/Apple | ✅ | FC `login.tsx`/`register.tsx → signInWithOAuth`; e2e → PD (C9) |

### Regras de Negócio
| ID | Requisito | Veredito | Status |
|---|---|---|---|
| RN-01 | Matriz de planos | ✅ | FC/FR |
| RN-02 | SOS ilimitado pago | ✅ | FC/FR |
| RN-03 | Histórico 7d free | ⚠️ Baixo | FC/FR (90d p/ todos) |
| RN-04 | Diário 7d free | ⚠️ Baixo | FC (sem corte) |
| RN-05 | 1 conexão familiar | ✅ | FC |
| RN-06 | Convite 48h | ✅ | FC/FR |
| RN-07 | Familiar não vê detalhes | ✅ | FC |

### Ética & Conformidade
| ID | Requisito | Veredito | Status |
|---|---|---|---|
| ET-01 | Sem promessa de cura | ✅ | FR `/sobre` |
| ET-02 | Disclaimer ubíquo | ✅ | FR (todas as telas) |
| ET-03 | CVV 188 + CAPS | ✅ | FR |
| ET-04 | SOS nunca bloqueado | ✅ | FR/FC |
| ET-05 | Exclusão ≤2 toques | ✅ | FC |
| ET-07 | RLS por tabela (declarada) | ⚠️ Médio | FC parcial (só `subscriptions`/`audit_log` versionadas); produção → PD (C.1) |
| ET-08 | Dados não expostos sem consentimento | ✅ | FC (flags `can_see_*` false); mecanismo de view → PD (C.1.6) |

### Rotas & Links (todas renderizam, HTTP 200)
| ID | Rota | Status |
|---|---|---|
| RT-01..11 | `/`,`/metodo`,`/escudo`,`/protocolo`,`/perfil`,`/plans`,`/programa30`,`/stats`,`/diario`,`/contatos`,`/login` | ✅ FR |
| RT-12 | `/sobre`,`/privacidade`,`/historico` | ✅ FR (ss_8788/1762/4701) |
| RT-13 | Links externos `tel:188` · `caps.ms` | ✅ FC |

### Arquitetura, Dados & NFR
| ID | Requisito | Veredito | Status |
|---|---|---|---|
| AR-01 | Stack Expo/Supabase/Stripe | ✅ | FC `package.json` |
| AR-02 | Modelo de dados conforme `06` | ⚠️ Médio | FC (normalizado, diverge) |
| AR-03 | View segura `family_day_status` | ❌ Médio | FC (ausente do versionamento); produção → PD (C.1.6) |
| AR-04 | RLS ativa em produção | ❓ → **PD** | **query C.1** |
| AR-05 | Offline-first | ❓ → **PD** | **device (C5)** |
| AR-06 | CI + testes | ⭐ | FC (4 suítes confirmadas por conteúdo) |
| AR-07 | Deploy Vercel | ✅ | FC/FR |
| AR-08 | SSR/SEO landing (PRD) | ❌ Médio | FC (SPA, sem landing) |

### Monetização
| ID | Requisito | Veredito | Status |
|---|---|---|---|
| MO-01 | Free/Essential 19,90/Guardião 39,90 | ✅ | FC/FR |
| MO-02 | Guardião anual R$299 | ⚠️ Médio | FC (código R$399) |
| MO-03 | Produtos avulsos (PRD/funil) | ❌ Médio | FC (modelo é assinatura) |
| MO-04 | Stripe checkout + webhook | ✅ | **FC (R3)** — ver §3; e2e → PD (C7) |
| MO-05 | Trial 5 dias | ⭐ | FC/FR |
| MO-06 | Modo anônimo | ⭐ | FC/FR |
| VOZ-01 | Voz da marca na notificação | ⚠️ Baixo | FC ("Um dia de cada vez" reintroduzido) |

> **Nenhum `❓` solto:** os 2 únicos não-verificáveis (AR-04, AR-05) estão como **PD** com a ação exata.

---

## 3. Achado 1 — `Gerar código` (Módulo Familiar) — epistemologia corrigida

**Veredito:** 🔴 QUEBRADO · **mecanismo CONFIRMADO** · **operação exata (INSERT vs SELECT) PENDENTE da query C.2.**

### 3.1 O que está confirmado (mecanismo + assimetria de plano)
- **Assimetria de promoção de plano (confirmada em R3, `arquivo:linha`-símbolo):**
  - **Pagante** → `supabase/functions/handle-stripe-webhooks/index.ts → handleCheckoutCompleted`: `supabase.from('profiles').update({ plan }).eq('id', userId)` — o webhook **escreve `profiles.plan='guardian'`**.
  - **Trial** → `supabase/migrations/20260620130000_…activate_trial.sql`: a RPC seta só `trial_end`, **nunca `plan`** → permanece `plan='free'`.
  - Logo, **a coluna `profiles.plan` (fonte de verdade no servidor) é promovida apenas para pagantes.** O `getEffectivePlan()` do cliente honra o trial, mas o **servidor não**.
- **Sintoma reproduzido** (R1, 2×): tocar "Gerar código" dispara erro (`window.alert`) e nenhum código aparece. A mensagem do PR #3 (`16f2c52`) confirma: *"Erros do Supabase ao criar convite somem sem feedback algum"* — o fix tornou o erro visível, não o corrigiu.
- **A chamada exata** (`lib/family.ts → createInvite`): `supabase.from('family_connections').insert({...}).select().single()` seguido de `if (error) throw error`. **`.single()` lança tanto se o INSERT for negado quanto se o SELECT do RETURNING retornar 0 linhas.**

### 3.2 O que NÃO está provado (correção da R2)
A R2 afirmou "0 linhas persistiram" com base na UI vazia — **isso é insuficiente.** Uma UI vazia é compatível com dois cenários mutuamente exclusivos:
- **(A/B) INSERT rejeitado** pela política `WITH CHECK` / falta de policy de INSERT → 0 linhas. A teoria "trial não promove plan" se sustenta como causa.
- **(C) INSERT aceito, SELECT do RETURNING bloqueado** → a linha existe, mas `.select().single()` não a recebe → erro no cliente, UI vazia. Aqui o `plan` é pista falsa **para este bug**; o conserto é a política de `SELECT` (ou o cliente não exigir o retorno).

O discriminador "gatilho persistiu × familiar não" (R2) prova **apenas** que a RLS de `family_connections` difere da de `user_triggers` — **não isola INSERT vs SELECT.** Só a **contagem direta no banco com bypass de RLS** decide → **query C.2** do `pacote-diagnostico-banco.sql`.

### 3.3 Correção (cobre ambos os cenários)
Patch SQL pronto em `pacote-diagnostico-banco.sql → C.4`: função `effective_plan()` (honra trial) + `fc_owner_insert` (cenário A/B) + `fc_owner_select` (cenário C) + `fc_owner_update`. Mais: instrumentar `lib/family.ts → createInvite` para logar `error.code/message/details`. **Ordem:** rodar **C.1 + C.2** → ler o `count` → se `=0` o foco é INSERT, se `>0` o foco é SELECT → aplicar **C.4** → revalidar.

---

## 4. Pacote do Dono — `pacote-diagnostico-banco.sql`

Entregue à parte. **Ordem de execução:**
1. **C.1** (read-only) — estado de RLS por tabela, políticas, e existência da view do familiar. *Esperado:* RLS=true em todas; nenhuma tabela sem RLS/sem policy; políticas escopadas por `auth.uid()`.
2. **C.2** (read-only, decisiva) — `count(*)` real de `family_connections` da conta de teste (isola INSERT×SELECT) + estado `plan/trial` (esperado `plan='free'` + `trial_ativo=true`).
3. **C.3** (terminal) — `supabase db pull` para **versionar schema+RLS** (corrige a causa de fundo).
4. **C.4** (escrita) — patch da RLS de `family_connections`, aplicar **após** interpretar C.1/C.2.

Itens que **só o dono** fecha (entregues como ação executável, não suposição): **C1** política viva do convite · **C2/AR-04** RLS em produção · **C3/AR-03** view do familiar · **C4** push 23h-7h em device · **C5** offline/sync · **C6** certificado e2e · **C7** Stripe e2e · **C8** exclusão LGPD e2e · **C9** OAuth e2e.

---

## 5. Backlog Final (prioridade)

| # | Item | Sev | Esforço |
|---|---|---|---|
| 1 | Rodar C.1+C.2 e aplicar C.4 (corrige `Gerar código`) | 🟠 Alto | P-M |
| 2 | Reatividade de plano em `/escudo` e `/programa30` (selecionar valores, não o método `canAccessFeature`) | 🟠 Alto | P |
| 3 | Versionar schema-base + RLS (C.3) | 🟠 Alto | M |
| 4 | Fonte General Sans (IV-07) | 🟡 Médio | P |
| 5 | Contatos de Confiança + religar à etapa CONTATO do SOS (FN-25/FN-12) | 🟡 Médio | M |
| 6 | View segura `family_day_status` (AR-03) | 🟡 Médio | P-M |
| 7 | Comunidade O Escudo ou marcar Fase 3 (FN-23) | 🟠 Alto | G |
| 8 | Cortes free×pago (RN-03/04) · preço anual (MO-02) · cópia notificação (VOZ-01) · visuais (IV-04/08/10/12/13, FN-07/13/17) | 🔵 Baixo | P |

---

## 6. Evidence Ledger — Rodada 3

**Arquivos lidos (raw):**
- `supabase/functions/handle-stripe-webhooks/index.ts` (9.441 B) — webhook valida HMAC, `handleCheckoutCompleted` faz `update({plan})` em profiles + upsert subscriptions + audit log; `subscription.deleted` reverte para `'free'`.
- `supabase/functions/create-checkout-session/index.ts` (4.682 B) — JWT-auth, valida `plan∈{essential,guardian}`+`billing`, cria/reusa Stripe customer, Checkout Session (subscription mode) com metadata `{supabase_user_id, plan}`.
- `lib/family.ts` (5.237 B, reconfirmado) — `createInvite` → `.insert(...).select().single()` (linha do bug).

**Não lidos (declarado, não alteram veredito):** `__tests__/{stripe,programa30dias,db.profiles_onboarding_columns}.test.ts` (AR-06 já ⭐ por 4 suítes); `supabase/functions/{cleanup-anonymous-users}` (MO-06/cron).

**Runtime R3:** nenhuma rota nova aberta nesta rodada (resíduo era de código); estado da conta inalterado desde R2 (trial ativo, 1 gatilho, 0 conexões familiares).

**Bloco B (runtime opcional) — não executado:** o walkthrough de onboarding via guest e a visualização dos botões OAuth exigiriam logout da sessão "Auditor" (sem senha p/ re-login). Decisão: **preservar a sessão**; FN-01/FN-31 repousam em evidência de código forte + dados ao vivo, com e2e no Bloco C (C9). Trade-off declarado.

**Artefatos produzidos nesta rodada:** `pacote-diagnostico-banco.sql` (C.1 read-only, C.2 decisiva, C.3 versionamento, C.4 patch) · este `relatorio-auditoria-guardiao-sobrio-FINAL.md`.

---

## 7. GATE FINAL — Rodada 3
- [x] Edge functions do Stripe lidas; **MO-04 = ✅ (código)** e **assimetria de promoção de plano confirmada** (webhook escreve `profiles.plan` × `activate_trial()` não escreve) — `handle-stripe-webhooks/index.ts → handleCheckoutCompleted`.
- [x] Narrativa do Achado 1 corrigida: parei de afirmar "0 linhas"; declarei **INSERT-vs-SELECT pendente da query C.2**; mecanismo + assimetria confirmados.
- [x] `pacote-diagnostico-banco.sql` produzido (C.1/C.2 read-only com "resultado esperado", C.3 versionamento, C.4 patch).
- [x] Score reconciliado e **fechando**: 58✅+3⭐+15⚠️+7❌+1🔴+2❓ = 86; verificáveis 84; **72,6%**.
- [x] Todo item aberto está **FECHADO** ou **PENDENTE-DONO** com query/ação exata — nenhum `❓` sem destino.
- [x] Evidence Ledger completo.

> O que só o dono pode fechar está entregue como **ações executáveis** (SQL com resultado esperado), não como suposição. Sucesso reportado somente com evidência no ledger.
