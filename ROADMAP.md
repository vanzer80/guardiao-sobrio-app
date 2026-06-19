# Roadmap de Execução — O Guardião Sobrio (App)

> Do protótipo de design até o lançamento nas lojas (App Store + Google Play).
> Versão 1.0 — Junho 2026 · Owner: Luis Vanzer
>
> **Fonte de verdade de conteúdo/marca:** repositório `guardiao-sobrio-docs`.
> Este arquivo vive no repositório do **app** e governa a execução técnica.

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
| Offline | WatermelonDB **ou** MMKV *(decidir — DA2)* |
| Push | Expo Notifications + OneSignal |
| Build/CI | Expo EAS · GitHub Actions · Sentry (crash reports) |

### Decisões abertas (resolver antes do sprint indicado)
| # | Decisão | Opções | Prazo |
|---|---|---|---|
| DA1 | Gateway de pagamento | Stripe vs Pagar.me | antes do Sprint 5 |
| DA2 | Storage offline | WatermelonDB vs MMKV | antes do Sprint 1 |
| DA3 | Analytics | PostHog vs Mixpanel vs nenhum | antes da Fase 2 |
| DA4 | Comunidade | nativa vs Circle vs Discord | antes da Fase 3 |
| DA5 | Suporte in-app | chat vs email vs nenhum | antes da Fase 2 |

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

## FASE 0 — Preparação · Semanas 1–2
**Meta:** ambiente mobile pronto + design system validado.
**Entregável:** app em branco autenticando no Supabase, com schema aplicado.

- [ ] Projeto Supabase (produção + staging)
- [ ] Projeto Expo (TS + Expo Router)
- [ ] NativeWind configurado com tokens noir (cores, tipografia, espaçamento)
- [ ] Supabase Auth no app (email/senha)
- [ ] Schema inicial + migration (ver `06-modelo-de-dados`)
- [ ] **RLS em todas as tabelas** de dados de usuário
- [ ] GitHub Actions: lint + test no PR
- [ ] `.env.local` / `.env.production`
- [ ] Sentry configurado
- [ ] Importar `design/` (protótipo) como referência de UI
- [ ] Expo EAS configurado (builds iOS + Android)

---

## FASE 1 — MVP publicável · Semanas 3–8
**Meta:** app aprovado nas lojas com as features core.

### Sprint 1 (sem. 3–4) — Onboarding + Auth + Checklist
- [ ] Splash com identidade da marca
- [ ] Onboarding (3 perguntas → cadastro → boas-vindas personalizada)
- [ ] Cadastro/Login: email/senha + Google + **Sign in with Apple**
- [ ] Perfil salvo em `profiles`
- [ ] Home + contador de dias (de `sobriety_start`, função `calculate_sobriety_days`)
- [ ] Checklist diário (5 itens, save no DB, micro-animações)
- [ ] Notificação de lembrete diário (respeitando 23h–7h)
- **DoD:** checklist salvo no Supabase com RLS; contador correto; 1 checklist/dia (UNIQUE).

### Sprint 2 (sem. 5–6) — Protocolo de Emergência + Navegação
- [ ] Botão SOS flutuante (todas as telas, exceto onboarding/config)
- [ ] Fluxo PARE → RESPIRE (4-4-6) → CONTATO → MOVIMENTO → ESTRUTURA 72h
- [ ] Limite free (3/mês) **sem bloqueio em sessão ativa**
- [ ] Tab navigation (Hoje · Método · Protocolo · Perfil)
- [ ] Tela de Marco de dias
- [ ] Dark mode como padrão
- **DoD:** protocolo funciona **offline**; limite respeitado sem cortar crise.

### Sprint 3 (sem. 7–8) — Polimento + Publicação
- [ ] Perfil + Configurações
- [ ] PIN + biometria
- [ ] **Exclusão de conta (LGPD, 2 toques)**
- [ ] Links CVV (188) e CAPS nas telas de protocolo e config
- [ ] Aviso ético em todos os protocolos
- [ ] Testes em iOS e Android físicos
- [ ] **Submissão App Store + Google Play**
- [ ] Documentação de release (changelog, notas)
- **DoD:** app aprovado nas lojas · crash-free rate > 99,5% · startup < 2s.

---

## FASE 2 — Crescimento · Semanas 9–16
**Meta:** ativar monetização, aprofundar o método e iniciar a web.
**Nota:** Landing page (`guardiao-sobrio-web`, repo separado) pode começar em paralelo no Sprint 5, sem bloquear o mobile.

### Sprint 4 — Diário + Fundamentos
- [ ] Diário de Prompts (CRUD, 1 prompt/dia, mín. 50 chars, entradas não deletáveis)
- [ ] Rotação por pilar (ESPELHO seg/qui · TÁTICA ter/sex · ESCUDO qua/sáb · dom livre)
- [ ] 13 Fundamentos (lista + detalhe + "aplicado hoje")
- [ ] Fundamento do Dia

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
