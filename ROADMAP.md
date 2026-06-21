# Roadmap de Execução — O Guardião Sobrio (App)

> Do protótipo de design até o lançamento nas lojas (App Store + Google Play).
> Versão 1.0 — Junho 2026 · Owner: Luis Vanzer
>
> **Fonte de verdade de conteúdo/marca:** [`guardiao-sobrio-docs`](https://github.com/vanzer80/guardiao-sobrio-docs) (repositório público).
> Este arquivo vive no repositório do **app** e governa a execução técnica.

---

## Repositório de Documentação — Fonte de Verdade

> **URL:** https://github.com/vanzer80/guardiao-sobrio-docs (público, acesso via `gh` CLI)

O repositório `guardiao-sobrio-docs` é a **única fonte autorizada** de conteúdo, regras de negócio e identidade de marca.
Deve ser consultado **antes de implementar** qualquer um dos itens abaixo:

| O que implementar | Onde consultar no docs |
|---|---|
| Textos dos 13 Fundamentos (insight, ação mínima, frase de âncora) | `fundamentos/13-fundamentos.md` |
| Prompts diários por pilar (ESPELHO / TÁTICA / ESCUDO / LIVRE) | `fundamentos/13-fundamentos.md` |
| Protocolo de Emergência 72h (PARE → RESPIRE → CONTATO → MOVIMENTO → ESTRUTURA) | `protocolos/protocolo-emergencia-72h.md` |
| Protocolo Perímetro 24h e Segurança 24h | `protocolos/` |
| Protocolo de Recaída | `protocolos/protocolo-recaida.md` |
| Regras de planos (free / Essential / Guardião) e limites de acesso | `app/07-regras-de-negocio.md` |
| Fluxos de telas e navegação | `app/05-fluxos-e-telas.md` |
| Especificação de features | `app/03-funcionalidades.md` |
| Tom de voz, copy, o que é proibido dizer | `marca/manual-de-marca.md` |
| Posicionamento e proposta de valor | `marca/briefing-executivo.md` |

**Como acessar via CLI:**
```bash
gh api repos/vanzer80/guardiao-sobrio-docs/contents/<caminho> --jq '.content' | base64 -d
```

---

## 0. Princípios inegociáveis (Hard Rules)

Estas regras **não podem** ser quebradas por nenhuma demanda de negócio ou pressão de conversão. Auditar antes de **cada** release.

- ❌ Nenhuma tela, notificação ou copy que prometa **cura**, sobriedade garantida ou resultado milagroso.
- ❌ Nunca pressionar o usuário a **não** procurar ajuda profissional.
- ❌ Nunca expor dados de sobriedade de um usuário a outro sem consentimento explícito.
- ❌ Nunca bloquear o **Protocolo de Emergência** no meio de uma sessão ativa, mesmo com limite atingido.
- ✅ Link para **CVV (188)** e **CAPS** visível em Configurações e na tela de protocolo.
- ✅ Aviso em todos os protocolos: *"Este app não substitui psiquiatra, psicólogo ou grupos de apoio."*
- ✅ **Exclusão de conta e dados** funcionando em no máximo **2 toques** (LGPD).
- ✅ Sem notificações entre **23h e 7h**. Tom sempre direto, sem pressão, sem exclamação excessiva.

---

## 1. Stack (decidido)

| Camada | Escolha |
|---|---|
| Mobile | React Native (Expo) + TypeScript + Expo Router |
| UI | NativeWind (tokens do design system noir) |
| Estado | Zustand · Formulários: React Hook Form + Zod |
| Web | Next.js 15 (landing/PWA) + Tailwind v4 · Deploy Vercel |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions + Realtime) |
| Offline | MMKV *(DA2 resolvida — em uso no cliente Supabase)* |
| Push | Expo Notifications + OneSignal |
| Build/CI | Expo EAS · GitHub Actions · Sentry (crash reports) |

### Decisões abertas (resolver antes do sprint indicado)
| # | Decisão | Opções | Status |
|---|---|---|---|
| ~~DA1~~ | ~~Gateway de pagamento~~ | **STRIPE** *(resolvida em 19/06/2026)* | ✅ |
| ~~DA2~~ | ~~Storage offline~~ | **MMKV** *(resolvida em 19/06/2026)* | ✅ |
| DA3 | Analytics | PostHog vs Mixpanel vs nenhum | antes da Fase 2 |
| DA4 | Comunidade | nativa vs Circle vs Discord | antes da Fase 3 |
| DA5 | Suporte in-app | chat vs email vs nenhum | antes da Fase 2 |

> **Fonte de verdade de conteúdo:** [guardiao-sobrio-docs](https://github.com/vanzer80/guardiao-sobrio-docs) (público).
> Consultar antes de implementar qualquer conteúdo, protocolo ou regra de negócio.

---

## Decisão Arquitetônica — DA1 Resolvida (19/06/2026)

### Gateway de Pagamento: **STRIPE** (vs Pagar.me)

**Critérios de decisão:**

| Aspecto | Stripe | Pagar.me | Vencedor |
|---|---|---|---|
| **Latência API** | <200ms | ~300–400ms | Stripe |
| **Documentação RN** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Stripe |
| **Integração Supabase** | Madura + webhook direto | Em construção | Stripe |
| **Suporte em PT** | Suporte global | Nativo em PT | Pagar.me |
| **Escalabilidade** | Global-ready | Local-first | Stripe |
| **Taxa Brasil** | 2,9% + R$0,30 | 2,9% | Pagar.me (leve) |

**Decisão sênior:** **STRIPE**

**Porquê:**
1. Latência crítica em UX (SOS, renovação de plano) — Stripe em <200ms vs 300–400ms
2. SDK `@stripe/stripe-react-native` é estável e bem documentado
3. Webhooks + Supabase Edge Function integration é battle-tested
4. Escalabilidade global (se futura)
5. Custo de integração < economia da menor latência

**Trade-off aceitável:** Taxa 0,3 centavos maior por transação, mas dev-time economia compensa.

---

## 2. Estrutura de repositórios

```
guardiao-sobrio-docs   → base de conhecimento (marca, método, regras) — NÃO recebe código

guardiao-sobrio-app    → este repo (Expo + RN mobile)
 ├── app/               (telas e rotas)
 ├── components/        (UI)
 ├── lib/               (supabase, helpers, regras de negócio)
 ├── hooks/             (Zustand stores)
 ├── constants/         (design tokens)
 ├── assets/            (ícones, imagens, fontes)
 ├── design/            (protótipo HTML — referência viva)
 ├── ROADMAP.md         (este arquivo)
 ├── README.md
 ├── .env.example
 └── .gitignore

guardiao-sobrio-web    → repo separado (landing/PWA) — criado na Fase 2+
 ├── app/               (Next.js 15)
 ├── components/        (UI Tailwind)
 └── ...
```

> **MVP (Fase 1)** é 100% mobile. A web vira um **repo separado** quando entrar (Sprint 3+), sem compartilhamento de código por enquanto.

---

## FASE 0 — Preparação · Semanas 1–2 ✅ CONCLUÍDA (19/06/2026)
**Meta:** ambiente mobile pronto + design system validado.
**Entregável:** app em branco autenticando no Supabase, com schema aplicado.

- [x] Projeto Supabase criado (`huumwjwndsefdmgezohb`)
- [x] Projeto Expo (TS + Expo Router)
- [x] NativeWind configurado com tokens noir (cores, tipografia, espaçamento)
- [ ] Supabase Auth no app (email/senha) — *Sprint 1*
- [x] Schema completo — 13 tabelas aplicadas no Supabase
- [x] **RLS em todas as tabelas** de dados de usuário (28 políticas)
- [x] GitHub Actions: lint + test no PR
- [x] `.env.local` preenchido com credenciais do projeto
- [ ] Sentry configurado — *Sprint 3*
- [x] `design/` (protótipo HTML) importado como referência de UI
- [x] Expo EAS configurado (builds iOS + Android)
- [x] `lib/database.types.ts` gerado do schema real
- [x] `app/_layout.tsx` com guard de sessão (auth ↔ tabs)

---

## FASE 1 — MVP publicável · Semanas 3–8
**Meta:** app aprovado nas lojas com as features core.

### Sprint 1 (sem. 3–4) — Onboarding + Auth + Checklist ✅ CONCLUÍDO (19/06/2026)
- [x] Splash com identidade da marca (fundo #0e0d0c + cor ouro via app.json)
- [x] Onboarding 3 passos: nome → data de sobriedade → foco da substância
- [x] Login: email/senha funcional (`supabase.auth.signInWithPassword`)
- [x] Cadastro: email/senha + validação Zod (`supabase.auth.signUp`)
- [x] Google OAuth — botão implementado em `register.tsx` (Sprint 9, PKCE via WebBrowser); ⚠️ **config no Dashboard pendente** (ver Sprint 9)
- [x] Sign in with Apple — botão implementado em `register.tsx` via Supabase OAuth (iOS-only via `Platform.OS === 'ios'`); ⚠️ **config Apple Dev Account pendente** (ver Sprint 9)
- [x] Perfil salvo em `profiles` (trigger `handle_new_user` + update no onboarding)
- [x] Home + contador de dias (calculado de `sobriety_start_date`)
- [x] Checklist diário (5 itens padrão criados no onboarding, save no DB, toggle optimista)
- [x] Notificação de lembrete diário (respeitando hard rule 23h–7h)
- **DoD:** ✅ checklist salvo no Supabase com RLS · ✅ contador correto · ✅ 1 checklist/dia (UNIQUE constraint)

### Sprint 2 (sem. 5–6) — Protocolo de Emergência + Navegação ✅ CONCLUÍDO (19/06/2026)
- [x] Botão SOS flutuante (tab central laranja com glow, acessível em 2 toques)
- [x] Fluxo PARE → RESPIRE (4-4-6) → CONTATO → MOVIMENTO → ESTRUTURA 72h
- [x] Limite free (3/mês) **sem bloqueio em sessão ativa** — avisa, nunca corta
- [x] Tab navigation (Hoje · Método · SOS · Perfil) com SOS raised button
- [x] Tela de Marco de dias (card dourado em 1, 3, 7, 14, 21, 30, 60, 90, 180, 365 dias)
- [x] Dark mode como padrão (design noir #0e0d0c em todas as telas)
- [x] Tela Método com pilares ESPELHO/TÁTICA/ESCUDO
- **DoD:** ✅ protocolo 100% offline · ✅ limite respeitado sem cortar crise · ✅ CVV/CAPS visíveis · ✅ disclaimer em todo o fluxo

### Sprint 3 (sem. 7–8) — Polimento + Publicação ⏳ PARALELO (19/06/2026)
**Status:** Código pronto · Operacional em paralelo com Sprint 5.

- [x] Perfil + Configurações (nome editável, email, plano, foco, data)
- [x] PIN + biometria (`expo-local-authentication` + lock screen ao voltar do fundo)
- [x] **Exclusão de conta (LGPD, 2 toques)** — Edge Function `delete-account` via admin API
- [x] Links CVV (188) e CAPS tappable em Perfil e Protocolo
- [x] Aviso ético em todos os protocolos
- [ ] **Teste E2E OAuth** (Google + Apple) — fluxo PKCE implementado mas não testado; requer providers configurados no Dashboard ⚠️ obrigatório antes da submissão
- [ ] Testes em iOS e Android físicos ⚠️ **CRÍTICO** — requer dispositivo + Apple/Google account
- [ ] **Submissão App Store + Google Play** ⚠️ **CAMINHO CRÍTICO** — obrigatório antes da monetização entrar em produção
- [ ] Documentação de release (changelog, notas) ⚠️ **PENDENTE**
- **DoD:** app aprovado nas lojas · crash-free rate > 99,5% · startup < 2s.

**Bloqueadores operacionais (fora do dev):**
- [ ] Apple Developer Account criada (US$ 99/ano)
- [ ] Google Play Developer Account criada (US$ 25, único)
- [ ] Política de Privacidade + Termos publicados (URL pública)
- [ ] Sign in with Apple implementado (obrigatório se há Google OAuth)

---

## FASE 2 — Crescimento · Semanas 9–16
**Meta:** ativar monetização, aprofundar o método e iniciar a web.
**Nota:** Landing page (`guardiao-sobrio-web`, repo separado) pode começar em paralelo no Sprint 5, sem bloquear o mobile.

### Sprint 4 — Diário + Fundamentos ✅ CONCLUÍDO (19/06/2026)
- [x] Diário de Prompts (1 prompt/dia, mín. 50 chars, editável mas não deletável, salvo em `diary_entries`)
- [x] Rotação por pilar (ESPELHO seg/qui · TÁTICA ter/sex · ESCUDO qua/sáb · dom livre) — dinâmico por dia da semana
- [x] 13 Fundamentos com conteúdo definitivo do `guardiao-sobrio-docs` (insight, descrição, ação mínima, armadilha, frase de âncora)
- [x] Fundamento do Dia (rotação por dias de sobriedade % 13)
- [x] Lock free: apenas fundamentos 1–3 desbloqueados no plano gratuito (4–13 com cadeado)
- [x] Prompts por pilar alinhados com os fundamentos reais
- **Fonte de verdade:** `guardiao-sobrio-docs` (público) — consultado a cada sprint para conteúdo e regras

### Sprint 5 — Monetização ⏳ EM ANDAMENTO (a partir de 19/06/2026)

#### Semana 1 (19/06) — Schema + Types + Stripe SDK ✅ CONCLUÍDA
- [x] Migration Supabase: `profiles.plan` + `stripe_customer_id`
- [x] Migration: `subscriptions.stripe_subscription_id`
- [x] Nova tabela: `subscription_audit_log` (RLS obrigatória)
- [x] Instalar `@stripe/stripe-react-native`
- [x] Types: `PlanType`, `SubscriptionStatus`, `PLAN_FEATURES`, `PRICING`
- [x] Hook Zustand: `usePlanStore` (gerencia plano do usuário)
- [x] Helpers Stripe: `initializeStripe()`, `createCheckoutSession()`
- [x] Componente `PlansComparison` (feature matrix: Free vs Essential vs Guardian)
- [x] Tela stub `PlansScreen` (integração ao checkout pronta)
- [x] Variáveis de ambiente (`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- [x] Hard rules auditadas (zero cura, disclaimer, paywall suave)
- **DoD:** ✅ typecheck verde · ✅ lint verde · ✅ RLS em todas as tabelas

#### Semana 2 — Edge Functions + Webhooks ✅ CÓDIGO PRONTO (19/06/2026)
- [x] Edge Function `create-checkout-session` — cria/recupera customer Stripe, retorna `{ sessionId, url }` para abertura via `Linking.openURL`
- [x] Edge Function `handle-stripe-webhooks` — valida HMAC, trata 4 eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [x] Audit log: `subscription_audit_log` populado pelo webhook em upgrade/downgrade
- [ ] **Deploy Edge Functions** ⚠️ requer `supabase login` + `supabase link` (externo ao dev)
- [ ] **Secrets no Supabase** Dashboard: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs

#### Semana 3 (em andamento) — Deploy + Configuração
- [x] Deep link handler `guardiaosobrio://plans/success` (poll plano + feedback visual)
- [x] Deep link handler `guardiaosobrio://plans/cancel` (retorno gracioso)
- [x] Sincronização de plano no login (`_layout.tsx` → `usePlanStore`)
- [x] Tipos TypeScript alinhados com migration (profiles.plan, subscription_audit_log)
- [x] `app.json` — scheme `guardiaosobrio` alinhado nas Edge Functions
- [ ] **Deploy Edge Functions** no Supabase ⚠️ requer `supabase login` + `supabase link`
- [ ] **Configurar secrets** no Supabase Dashboard (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, price IDs)
- [ ] **Aplicar migration** no banco remoto (`profiles.plan`, `stripe_customer_id`, audit log)
- [ ] **Registrar webhook** no Stripe Dashboard → `https://huumwjwndsefdmgezohb.supabase.co/functions/v1/handle-stripe-webhooks`
- [ ] **Criar produtos Stripe** (Essential Monthly/Annual, Guardian Monthly/Annual)
- [ ] **Teste E2E** com cartão Stripe test mode (`4242 4242 4242 4242`)
- [x] **Teste gratuito 5 dias** — migration `20260620120000_add_trial_to_profiles.sql`; RPC `activate_trial()` (one-shot guard via `trial_activated_at IS NULL`, `RETURNS TIMESTAMPTZ`); `usePlanStore.activateTrial()` atualiza store em-sessão sem page reload; banner + botão trial em `PlansComparison.tsx` e `plans.tsx`
- [x] Hotfix `20260620130000_fix_activate_trial_column_reference.sql` — BUG-001: `AND plan = 'free'` removido (coluna inexistente em profiles); `RETURNS TIMESTAMPTZ` restaurado; `RAISE EXCEPTION 'trial_already_used'` para guard one-shot; `GRANT EXECUTE` re-aplicado
- **DoD trial:** ✅ trial testado em produção (QA 20/06/2026) — 10/10 itens aprovados · ativação, alert, banner, unlock de 4 módulos (gatilhos, familiar, programa30, stats) e one-shot todos funcionando imediatamente em-sessão
- **Planos:** Essencial R$ 19,90/mês · Guardião R$ 39,90/mês · Anual R$ 299
- **Paywall:** suave (avisa, nunca bloqueia SOS)

### Sprint 6 — Mapa de Gatilhos + Módulo Familiar ✅ CONCLUÍDO (19/06/2026)
- [x] CRUD de gatilhos (título, descrição, risco 1–5, estratégias de enfrentamento, soft-delete)
- [x] Categorias de gatilho (sistema + custom via `trigger_categories`)
- [x] Módulo Familiar: convite código 6 dígitos, expira 48h (`invitation_expires_at`)
- [x] Vista do familiar: apenas "dia guardado" (sim/não) — sem diário, detalhes ou contador
- [x] Revogar acesso: imediato, sem confirmação do familiar
- [x] Nova tab "Escudo" na navegação (Mapa de Gatilhos + Familiar)
- [x] Paywall suave por feature (Essential para gatilhos, Guardião para familiar)
- [x] Migration: `family_connections.invitation_expires_at`
- [x] **Fix Achado 1 (Rodada 4 — 2026-06-21):** coluna `invitation_expires_at` nunca foi aplicada ao banco (migration drift) → `createInvite` falhava com *"column does not exist"*. Aplicada diretamente + `effective_plan()` + policy `RESTRICTIVE`. Validação e2e: PENDENTE-DONO.
- [x] **Fix Achado 2 (commits `4613a2a` + `ecda1f9`):** paywall indevido em cold-load de `/escudo` e `/programa30` — selecionar `plan` E `trialEnd` como stores separadas para reatividade.
- **DoD:** ✅ typecheck verde · ✅ lint verde · ✅ hard rules auditadas

### Sprint 7 — Estatísticas ✅ CONCLUÍDO (19/06/2026)
- [x] Cards resumo: dias em jornada, checklist 28d, diário 30d, SOS mês
- [x] Grid 28 dias: checklist (verde) e diário (ouro) separados — sem punição por faltas
- [x] Barra de progresso: presença no checklist (sem destaque negativo)
- [x] SOS este mês: exibido com tom de autocuidado, não de fraqueza
- [x] Exportar PDF: expo-print + expo-sharing → compartilhar com terapeuta
- [x] Paywall suave para plano free (link para planos)
- [x] Navegação: link "Ver estatísticas" em Perfil → tela /stats
- **DoD:** ✅ typecheck verde · ✅ lint verde · ✅ zero gamificação punitiva

---

## FASE 3 — Comunidade & Retenção · Semanas 17+

### Programa 30 Dias ✅ CONCLUÍDO (19/06/2026)
- [x] `lib/programa30dias.ts` — 30 dias de conteúdo progressivo (fundamento do ciclo de 13 + protocolo preventivo diário + prompt de reflexão)
- [x] Desbloqueio sequencial: dia N só disponível após conclusão do dia N-1
- [x] Barra de progresso (X/30 com percentual visual)
- [x] Certificado digital ao concluir 30 dias (sem expor conteúdo de sobriedade externamente)
- [x] `app/programa30.tsx` — tela completa com overlay de detalhe por dia e botão "Concluir dia N"
- [x] Paywall Guardian: tela exibe card de upgrade para planos inferiores
- [x] Disclaimer hard-rule em toda view ("não substitui psiquiatra...")
- [x] Persiste progresso via `diary_entries` (entrada especial `programa30-dia-N`)
- [x] Acesso via cards dedicados em Método e Perfil (Guardian: dourado; free: aponta paywall)
- [x] 68 testes unitários cobrindo toda a lógica de negócio do app (sobriety, protocolo, fundamentos, monetização, stripe, programa30dias)
- **DoD:** ✅ typecheck verde · ✅ lint verde · ✅ 68/68 testes passando · ✅ hard rules auditadas

### Sprint 8 — Design Polish ✅ CONCLUÍDO (19/06/2026)

- [x] **Font loading corrigido** — CormorantGaramond e JetBrainsMono eram referenciados mas nunca carregados; adicionado `useFonts` no root layout com `@expo-google-fonts/cormorant-garamond` + `@expo-google-fonts/jetbrains-mono`; splash bloqueado até fontes carregarem
- [x] **expo-linear-gradient** instalado (first-party Expo SDK); gradients nos cards do design
- [x] **@expo/vector-icons** (Ionicons) instalado; ícones Ionicons em todas as tabs
- [x] **Colors.ts** — tokens `mutedDark: '#524f4c'` e `mutedLight: '#a8a39c'` adicionados
- [x] **Tela Hoje (index.tsx)** redesenhada conforme protótipo:
  - Saudação + data no formato "QUARTA · 18 JUNHO" em JetBrains Mono
  - Contador de dias: card horizontal com `LinearGradient`, círculo 96px com JetBrains Mono SemiBold 38px, ícone shield sobreposto, shadow real
  - Âncora do Dia: card novo com fundo `rgba(gold,0.07)`, borda `rgba(gold,0.18)`, label JetBrains Mono 9px, frase em Cormorant Garamond Italic 22px
  - Checklist: header com label JetBrains Mono + contador ouro `X/Y`, barra de progresso 4px
- [x] **SOS (_layout.tsx)** redesenhado:
  - Botão 58px com ícone shield (Ionicons) substituindo texto "SOS"
  - Ring pulsante em loop (Animated.loop, 1.2s, `useNativeDriver: true`)
  - Ícones Ionicons em todos os 4 tabs regulares (home, book, shield-outline, person)
- [x] **Protocolo (protocolo.tsx)** com tipografia do protótipo:
  - `bigWord`: General Sans system font 64px bold (removido CormorantGaramond das palavras de ação)
  - `stepLabel`: JetBrains Mono 11px letter-spacing 3, cor emergency
  - `stepInstruction`: Cormorant Garamond Italic 22px cor mutedLight
  - `fieldLabel` (idle): JetBrains Mono 11px letter-spacing 2
- **DoD:** ✅ typecheck verde · ✅ lint verde · ✅ 68/68 testes passando · ✅ hard rules auditadas · ✅ zero promessas de cura

### Sprint 9 — Fluxo de Entrada Premium + Auth Polish ✅ CONCLUÍDO (19/06/2026)

- [x] **6 novas telas de entrada** seguindo o fluxo Welcome → onboarding (3 passos) → register → setup → ativacao → (tabs):
  - `app/(auth)/welcome.tsx` — hero foto full-bleed com LinearGradient noir, eyebrow "DA TRINCHEIRA", título serifado + "É construção." em itálico ouro
  - `app/(auth)/onboarding/motivo.tsx` — passo 1/3: motivo da jornada (3 opções), barra de progresso segmentada
  - `app/(auth)/onboarding/tempo.tsx` — passo 2/3: tempo em sobriedade (4 opções), params encadeados
  - `app/(auth)/onboarding/desafio.tsx` — passo 3/3: principal desafio (4 opções), botão "Criar minha conta"
  - `app/(auth)/ativacao.tsx` — celebração pós-setup: ring dourado animado (Animated.spring entrada + Animated.loop pulsante), contador de dias, redirect para (tabs)
  - `app/(auth)/onboarding/_layout.tsx` — Stack aninhado para o sub-grupo de onboarding
- [x] **`app/(auth)/onboarding.tsx` renomeado para `setup.tsx`** — evita conflito entre arquivo e diretório de mesmo nome no Expo Router
- [x] **`app/(auth)/register.tsx` reescrito** — OAuth Google + Apple (PKCE via WebBrowser + exchangeCodeForSession), confirm email state inline ("Já confirmei" polling getSession), eyebrow + título serifado, disclaimers CVV/CAPS; params motivo/tempo/desafio encadeados do onboarding
- [x] **`app/(auth)/login.tsx` polido** — eyebrow "BEM-VINDO DE VOLTA", título "O Guardião / Sóbrio" em CormorantGaramond regular + itálico ouro, disclaimers CVV/CAPS
- [x] **`components/PlansComparison.tsx` reescrito** — removidos todos os `className` NativeWind; inline styles com tokens `Colors.*`; SafeAreaView, plan cards com borderColor ouro no plano atual, tabela comparativa com fundo alternado, disclaimer completo
- [x] **Guard `app/_layout.tsx` atualizado** — redirect inicial para `/(auth)/welcome` (era login); `isSetup` e `isAtivacao` como exceções no guard pós-onboarding; `<Stack.Screen name="plans" />` órfão removido (eliminava warning "No route named 'plans'")
- [x] **`lib/database.types.ts`** — colunas `onboarding_motivo`, `onboarding_tempo`, `onboarding_desafio` adicionadas em Row/Insert/Update de profiles
- [x] **Migration aplicada** — `supabase/migrations/20260619220000_add_onboarding_context.sql` (3 colunas TEXT nullable em public.profiles)
- [x] **Teste de integração** `__tests__/db.profiles_onboarding_columns.test.ts` — 4 testes verificam as 3 colunas via PostgREST com `node:https` (bypass do fetch stub do jest-expo/winter); **4/4 passando**
- **DoD:** ✅ typecheck verde · ✅ lint verde · ✅ 72 testes passando · ✅ hard rules auditadas · ✅ OAuth estruturado (pendente config providers no Dashboard)

**Pendente de configuração externa (não-dev):**
- [ ] Google OAuth: habilitar no Dashboard → Authentication → Providers + Client ID/Secret do Google Cloud
- [ ] Apple OAuth: Service ID + private key da Apple Developer Account
- [ ] Redirect URL `guardiaosobrio:///` adicionada em Authentication → URL Configuration

### Sprint 11 — Modo Visitante (Acesso Sem Cadastro) ✅ CONCLUÍDO (20/06/2026)

- [x] **`signInAnonymously()`** — sessão real no Supabase (`is_anonymous = true`), user_id UUID preservado na conversão
- [x] **Acesso completo por 5 dias** — `getEffectivePlan()` retorna `'guardian'` para anônimos; sem bloqueio de nenhuma feature
- [x] **Fluxo de entrada** — botão "Explorar sem cadastro" em `welcome.tsx`; param `mode=guest` encadeado pelo onboarding (motivo → tempo → desafio); `signInAsGuest()` em `lib/anonymousAuth.ts`
- [x] **`AnonymousBanner`** — countdown de dias restantes, oculto na tela de protocolo SOS em qualquer circunstância
- [x] **`convert.tsx`** — `updateUser({ email, password })` preserva 100% dos dados (mesmo `user_id`); `linkIdentity()` para Google/Apple; disclaimer obrigatório + CVV/CAPS
- [x] **Modal de expiração** — `AnonymousExpiredModal` após 5 dias; degrada para free (nunca deleta dados); nunca aparece sobre o protocolo SOS
- [x] **Migration `20260620140000`** — colunas `is_anonymous` + `anonymous_created_at` em `profiles`, índice de cleanup aplicado em produção
- [x] **Edge Function `cleanup-anonymous-users`** — deleta perfis anônimos > 7 dias sem conversão; contagem de erros por item; deployada com `--no-verify-jwt`
- [x] **Cron job `0 3 * * *`** — pg_cron + pg_net habilitados; cleanup automático diário às 3h UTC
- [x] **Anonymous Sign-ins habilitado** no Supabase Auth (`external_anonymous_users_enabled: true`) via Management API
- [x] **Auditoria RLS** — `emergency_contacts`: policy `owner_all_emergency_contacts` (PERMISSIVE, ALL) permite acesso SOS para anônimos ✅ — `family_connections`: policy `Anônimos não podem criar conexões de família` é **RESTRICTIVE** (AND-ado com permissivas), bloqueio de INSERT confirmado ✅
- **DoD:** ✅ typecheck verde · ✅ lint verde · ✅ hard rules auditadas · ✅ banner oculto no SOS · ✅ RLS auditado · ✅ migration + Edge Function + cron em produção

**Pendente de QA em device físico (antes do merge final):**
- [ ] Testar `linkIdentity` Google e Apple em iOS/Android físico
- [ ] Verificar que banner some imediatamente após conversão bem-sucedida
- [ ] Confirmar que push token não é registrado para usuário anônimo

---

### Sprint 10 — Auth Bugfixes ✅ CONCLUÍDO (20/06/2026)

- [x] **OAuth callback (web):** `useLocalSearchParams` retornava `code=undefined` no primeiro render de hidratação; guard agora aguarda o re-render com o valor real (`if (code === undefined) return`) em vez de redirecionar imediatamente para `/login`; ref `attempted` previne dupla troca; timeout de 10s como fallback — `app/(auth)/callback.tsx`
- [x] **Logout (web):** `Alert.alert` na web delega para `window.confirm()`, que browsers modernos bloqueiam em handlers assíncronos do React (botão aparecia inerte); substituído por `window.confirm()` síncrono no branch `Platform.OS === 'web'` — `app/(tabs)/perfil.tsx`
- [x] **Logout — stores explícitos:** `setSession(null)` agora chamado diretamente em `handleSignOut` (além de depender do `onAuthStateChange`), eliminando risco de estado inconsistente se o evento atrasar
- [x] **Logout — scope:** `signOut({ scope: 'global' })` explícito (server-side revocation)
- **DoD:** ✅ typecheck verde · ✅ lint verde · ✅ 81/81 testes passando · ✅ hard rules auditadas

### Pendentes
- [ ] Comunidade O Escudo (feed curado, posts anônimos, moderação do criador) — DA4 aberta
- [ ] Notificações de comunidade (opt-in)
- [ ] Analytics anonimizados — DA3 aberta
- [ ] A/B test: onboarding e paywall

---

## Dívidas Técnicas Abertas

| # | Dívida | Arquivo(s) | Impacto | Resolver em |
|---|---|---|---|---|
| DT1 | `jest-expo/winter` sobrescreve `fetch` global — testes de integração com `@supabase/supabase-js` retornam `{ message: undefined }` em vez de resposta real | `__tests__/*.test.ts` | Qualquer teste futuro que use `supabase.from(...)` vai falhar silenciosamente; usar `node:https` como workaround | Antes de novos testes de integração |
| DT2 | `saveOnboardingContext` em `register.tsx` é non-blocking (`try/catch` vazio) — se falhar, contexto pré-onboarding (motivo/tempo/desafio) é perdido sem log | `app/(auth)/register.tsx:47` | Edge case: usuário cadastrado sem contexto de onboarding; não bloqueia fluxo mas perde dado de personalização | Sprint 10 |
| DT3 | Usuário que usa OAuth (Google/Apple) entra no fluxo de `setup.tsx` sem passar pelas telas de onboarding — `onboarding_motivo/tempo/desafio` ficam nulos | `app/(auth)/register.tsx` handleOAuth | Personalização ausente para usuários OAuth; aceitável no MVP mas idealmente o OAuth também deve capturar o contexto | Sprint 10 |
| DT4 | Supabase MCP plugin (`mcp.supabase.com`) usa OAuth browser — ainda não autenticado; migrations e queries diretas precisam ser feitas via Dashboard ou CLI | Dev tooling | Impacta produtividade: sem aplicação automática de migrations via IA | Configurar OAuth no Claude Code Settings |
| DT5 | TypeScript types em `lib/database.types.ts` são gerados manualmente — qualquer nova migration exige atualização manual dos types | `lib/database.types.ts` | Risco de divergência entre schema real e types usados no app | Automatizar via `supabase gen types` no CI (Sprint 10) |
| DT6 | BUG-002 — `metodo.tsx` bloqueia fundamentos com checagem direta de plano em vez de `canAccessFeature()`; durante trial (plano efetivo = guardian) 10/13 fundamentos aparecem travados | `app/(tabs)/metodo.tsx` | Médio — usuário com trial ativo não acessa fundamentos 4–13 | Sprint 10 |
| DT7 | BUG-003 — Frontend exibe Alert genérico em falha do RPC `activate_trial()`; exceção `trial_already_used` existe no banco mas não é tratada especificamente no cliente | `app/(tabs)/plans.tsx` | Baixo — UX confusa em tentativa de reativação | Sprint 10 |
| DT8 | BUG-004 — Rota `/planos` retorna 404; tela de Planos (`/plans`) não tem link na navegação principal — acessível apenas via paywalls | `app/(tabs)/` + navegação | Baixo — confirmar se ausência de link direto é design intencional | Sprint 10 |
| DT9 / DRIFT-01 | Migrations marcadas como aplicadas (em `schema_migrations`) mas não executadas: `profiles.plan`, `profiles.stripe_customer_id` ausentes no banco; varredura completa pendente | `supabase/migrations/` vs DB real | **Alto** — código/types assumem colunas inexistentes → erros runtime difíceis de diagnosticar (exatamente o Achado 1) | Imediato: rodar `diagnostico-migration-drift.sql` + `supabase db pull` + `supabase gen types` |
| DT10 / MO-07 | Cliente lê `profiles.plan` (inexistente no DB); fonte real é `subscriptions.plan` — reflexo de plano pago pode estar quebrado (usuário pagante permanece `free` no app) | `app/_layout.tsx` · `supabase/functions/handle-stripe-webhooks/` | **Alto** · PENDENTE-VERIFICAÇÃO | Verificar com conta pagante (cartão Stripe teste) antes de qualquer sprint de monetização |

---

## 3. Matriz de planos

| Feature | Free | Essencial (R$19,90) | Guardião (R$39,90) |
|---|:--:|:--:|:--:|
| Checklist diário | ✓ | ✓ | ✓ |
| Contador de dias | ✓ | ✓ | ✓ |
| Protocolo emergência | 3/mês | ∞ | ∞ |
| Diário de prompts | 7 dias | ∞ | ∞ |
| 13 Fundamentos | 3 primeiros | todos | todos |
| Mapa de gatilhos | — | ✓ | ✓ |
| Estatísticas | — | ✓ | ✓ |
| Módulo familiar | — | — | ✓ |
| Programa 30 Dias | — | — | ✓ |
| Comunidade | — | — | ✓ |

---

## 4. Checklist de lançamento nas lojas

### Contas & jurídico
- [ ] Apple Developer Program (US$ 99/ano)
- [ ] Google Play Developer (US$ 25, único)
- [ ] Política de Privacidade + Termos publicados (URL pública)
- [ ] CNPJ/MEI para recebimento (se monetizar)

### Conformidade (apps de saúde — área sensível)
- [ ] **Sign in with Apple** presente (obrigatório se há login social Google)
- [ ] **Exclusão de conta no app** (Apple + Google exigem)
- [ ] Privacy **Nutrition Labels** (Apple) + **Data Safety form** (Google)
- [ ] Classificação etária ~**17+** (referências a álcool/dependência)
- [ ] **Sem claims médicos/cura** em nenhuma tela ou metadado da loja
- [ ] Recursos de crise (CVV 188 / CAPS) visíveis no app
- [ ] Disclaimer "não substitui profissional" em todos os protocolos

### Build & assets
- [ ] Builds via Expo EAS (iOS + Android)
- [ ] Teste em dispositivos físicos (iOS + Android)
- [ ] Ícone, splash, screenshots por dispositivo
- [ ] Descrição da loja sem promessas proibidas
- [ ] Landing page no ar com link de download

---

## 5. Critérios globais de qualidade

| Critério | Meta |
|---|---|
| Crash-free rate | > 99,5% |
| Startup (mid-range) | < 2s |
| Completar checklist | < 3 min |
| SOS acessível em | 2 toques |
| Cobertura de testes (negócio) | > 60% · **81 testes ativos** (sobriety, protocolo, fundamentos, monetização, stripe, programa30 + 4 integração banco) |
| LGPD: excluir conta | 2 toques |
| Acessibilidade | WCAG AA |
| Promessas de cura | zero (auditoria por release) |

---

## 6. Linha do tempo (resumo)

```
Sem 1–2    Fase 0   Preparação
Sem 3–8    Fase 1   MVP → 1ª submissão às lojas
Sem 9–16   Fase 2   Diário, Fundamentos, Pagamento, Gatilhos, Familiar, Stats
Sem 17+    Fase 3   Programa 30 Dias, Comunidade
```

> Estimativa realista: **~8 semanas** até a primeira submissão, com 1 dev focado.
> Toda decisão técnica prioriza **privacidade do usuário, simplicidade operacional e custo gerenciável por 1–2 devs.**
