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
| # | Decisão | Opções | Prazo |
|---|---|---|---|
| DA1 | Gateway de pagamento | Stripe vs Pagar.me | antes do Sprint 5 |
| ~~DA2~~ | ~~Storage offline~~ | **MMKV** *(resolvida em 19/06/2026)* | ✅ |
| DA3 | Analytics | PostHog vs Mixpanel vs nenhum | antes da Fase 2 |
| DA4 | Comunidade | nativa vs Circle vs Discord | antes da Fase 3 |
| DA5 | Suporte in-app | chat vs email vs nenhum | antes da Fase 2 |

> **Fonte de verdade de conteúdo:** [guardiao-sobrio-docs](https://github.com/vanzer80/guardiao-sobrio-docs) (público).
> Consultar antes de implementar qualquer conteúdo, protocolo ou regra de negócio.

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
- [ ] Google OAuth — botão pendente (requer config OAuth no Supabase Dashboard)
- [ ] Sign in with Apple — pendente (requer `expo-apple-authentication` + Apple Dev Account) ⚠️ obrigatório antes da submissão
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

### Sprint 3 (sem. 7–8) — Polimento + Publicação ⏳ EM ANDAMENTO (19/06/2026)
- [x] Perfil + Configurações (nome editável, email, plano, foco, data)
- [x] PIN + biometria (`expo-local-authentication` + lock screen ao voltar do fundo)
- [x] **Exclusão de conta (LGPD, 2 toques)** — Edge Function `delete-account` via admin API
- [x] Links CVV (188) e CAPS tappable em Perfil e Protocolo
- [x] Aviso ético em todos os protocolos
- [ ] Testes em iOS e Android físicos ⚠️ **PENDENTE** — requer dispositivo físico
- [ ] **Submissão App Store + Google Play** ⚠️ **PENDENTE** — requer Apple/Google Developer account
- [ ] Documentação de release (changelog, notas) ⚠️ **PENDENTE**
- **DoD:** app aprovado nas lojas · crash-free rate > 99,5% · startup < 2s.

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

### Sprint 5 — Monetização
- [ ] Gateway (DA1) + webhook Supabase Edge → `profiles.plan`
- [ ] Planos: Essencial R$ 19,90/mês · Guardião R$ 39,90/mês · Anual R$ 299
- [ ] **Paywall suave** (acesso limitado + upgrade claro, nunca bloqueio agressivo)
- [ ] Tela de planos com comparativo

### Sprint 6 — Mapa de Gatilhos + Módulo Familiar
- [ ] CRUD de gatilhos (horário/situação/emoção → resposta planejada)
- [ ] Alerta de horário de risco
- [ ] Módulo Familiar: convite (código 6 dígitos, expira 48h) + view segura (só "dia guardado: sim/não")
- [ ] Revogar acesso (imediato, sem confirmação do familiar)

### Sprint 7 — Estatísticas
- [ ] Relatório semanal · gráficos de progresso (sem gamificação punitiva)
- [ ] Exportar PDF (para compartilhar com terapeuta)

---

## FASE 3 — Comunidade & Retenção · Semanas 17+
- [ ] Programa 30 Dias (conteúdo diário sequenciado + certificado)
- [ ] Comunidade O Escudo (feed curado, posts anônimos, moderação do criador)
- [ ] Notificações de comunidade (opt-in)
- [ ] Analytics anonimizados (DA3)
- [ ] A/B test: onboarding e paywall

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
| Cobertura de testes (negócio) | > 60% |
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
