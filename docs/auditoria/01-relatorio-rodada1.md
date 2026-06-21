# 🔍 Auditoria Forense de Conformidade — App "O Guardião Sóbrio"

> **Reconciliação de 3 vias:** DOCS (especificação) × CODE (implementação) × LIVE (runtime)
> **Data da auditoria:** 20–21 de junho de 2026
> **Auditor:** Claude (Cowork) · método: leitura integral de conteúdo de repositório + execução real do deploy
> **Regra-mãe:** nenhuma afirmação sem evidência citável. Incerteza vira `❓ NÃO VERIFICÁVEL`, nunca suposição.

---

## 1. Sumário Executivo

O aplicativo **existe, está no ar e funciona** em suas funções nucleares. O núcleo gratuito (contador de sobriedade, checklist diário de 5 itens, diário de reflexão, **Protocolo de Emergência SOS de 5 etapas**) foi verificado nas três vias e opera de ponta a ponta no deploy de produção. A identidade visual noir + ouro fosco e os limites éticos (disclaimers, CVV 188, CAPS, "nunca bloquear o SOS em crise", exclusão LGPD em 2 toques) estão presentes e consistentes em praticamente todas as telas.

Há, porém, divergências relevantes. A mais importante é um **defeito funcional confirmado em runtime**: o botão **"Gerar código"** do Módulo Familiar falha ao ser acionado na web (dispara um diálogo de erro e não gera o código de convite) — reproduzido duas vezes. Há ainda um **bug de reatividade de plano**: ao abrir/recarregar diretamente as rotas premium `/escudo` e `/programa30`, um usuário com direito de acesso (trial/Guardião) vê o *paywall* indevidamente, porque a checagem de plano não reage ao carregamento assíncrono do perfil. Funcionalidades especificadas para fases posteriores — **Comunidade O Escudo** e **Contatos de Confiança** — não estão implementadas (a tela de Contatos é um stub "em desenvolvimento").

Há também uma **contradição interna na própria documentação**: o PRD (`01-PRD.md`) descreve um app **Next.js** com landing page pública, login por *magic link*, painel admin e **produtos avulsos** (R$ 47/97/197); já `02-arquitetura.md`, `03-funcionalidades.md`, `05-fluxos` e `07-regras` descrevem um **app Expo/React-Native** com abas, login por e-mail/senha e **assinaturas** (Free/Essential/Guardião). **A implementação seguiu coerentemente o segundo modelo.** Onde o código diverge do PRD, frequentemente diverge *na direção da própria documentação técnica que o contradiz*.

### Score de Conformidade (derivado da tabela da Fase 4)

```
Score = (Σ ✅ CONFORME + Σ ⭐ DIVERGÊNCIA POSITIVA) ÷ (Total de requisitos VERIFICÁVEIS) × 100
Score = (54 + 3) ÷ 76 × 100 = 75,0%
```

| Métrica | Quantidade |
|---|---|
| ✅ Conforme | 54 |
| ⭐ Divergência positiva (manter) | 3 |
| ⚠️ Divergente-neutro | 12 |
| ❌ Faltando | 6 |
| 🔴 Quebrado (regressão runtime) | 1 |
| ❓ Não verificável (excluído do denominador) | 9 |
| **Total de requisitos catalogados** | **85** |
| **Verificáveis (denominador)** | **76** |
| **Conforme : Não conforme : Não verificável** | **57 : 19 : 9** |

> **Leitura honesta do score:** dos **19 "não conformes"**, **12 são `⚠️` divergências neutras/cosméticas** (ex.: ícones Phosphor→Ionicons, posição do botão SOS, tons de hover), **6 são `❌` ausências** em sua maioria de itens de Fase 2/3 ou da "visão Next.js" do PRD, e **apenas 1 é `🔴` defeito funcional** ("Gerar código"). Em termos de *funcionalidade crítica entregue*, o app está consideravelmente melhor do que os 75% sugerem isoladamente.

### Achados por severidade

| Severidade | Qtd | Itens |
|---|---|---|
| 🔴 Crítico | 0 | — |
| 🟠 Alto | 3 | `Gerar código` quebrado · paywall em cold-load de rotas premium · Comunidade ausente |
| 🟡 Médio | 6 | Contatos (stub) · fonte de corpo General Sans não carregada · etapa CONTATO do SOS ≠ spec · modelo de dados diverge do `06` · ausência de landing/admin (visão PRD) · preço anual divergente |
| 🔵 Baixo | 8 | tons de hover · ícones · posição SOS · modo claro · micro-animações · timer 5min do PARE · "aplicar fundamento" não persiste · emoji 🔒 como elemento |

### Veredito geral

**ATENDE PARCIALMENTE.** O produto cumpre seu núcleo gratuito e ético com qualidade e está fiel à *arquitetura técnica* especificada (Expo/Supabase/Stripe). As lacunas concentram-se em (a) um defeito de runtime no convite familiar, (b) reatividade de *paywall* em rotas premium, (c) funcionalidades de fases futuras ainda não construídas, e (d) descompassos herdados de uma documentação internamente contraditória.

---

## 2. Fase 0 — Manifesto de Acesso

> **Nota de capacidade e método (transparência total):** a clonagem via `git clone` no sandbox foi **bloqueada pelo proxy de rede** (`HTTP 403 from proxy after CONNECT`) e o `web_fetch` retornou corpo vazio para a API do GitHub e apenas a "casca" HTML do deploy (SPA client-rendered). Para cumprir as pré-condições do trabalho — *ler o conteúdo integral dos repositórios* e *carregar páginas web reais* — utilizei o navegador **Claude-in-Chrome**, que (1) leu a **API REST do GitHub** e os arquivos crus em `raw.githubusercontent.com` (conteúdo integral, não inferência) e (2) **executou o app real** com JavaScript no deploy de produção. Ambas as pré-condições foram, portanto, atendidas por caminho equivalente e verificável.

| Fonte | Acessível? | Branch | Commit SHA | Data (UTC) | Observação |
|---|---|---|---|---|---|
| **DOCS** | ✅ | `main` | `90c5d9540c1d292ff5b65b9f8e2803e4254d9b1c` | 2026-06-21 00:57:33 | Público. Último commit: *"feat: identidade visual completa — Análise jun/2026"*. 28 arquivos, ~180 KB. |
| **CODE** | ✅ | `main` | `2cbcf0a802b67fc523be8d790bca26f56875d722` | 2026-06-20 19:50:08 | Público. TypeScript/Expo. Último commit: merge do PR #3 *"fix(escudo): botão Gerar Código não funcionava na web"*. |
| **LIVE** | ✅ | — | — | — | `https://guardiao-sobrio-app.vercel.app` → **HTTP 200**, renderiza (SPA Expo-web). `web_fetch` retornou só a casca; Chrome renderizou o app completo. |

> **GATE:** as três fontes estão acessíveis. Auditoria autorizada a avançar.

---

## 3. Fase 1 — Inventário de Documentos (DOCS)

Repositório `guardiao-sobrio-docs` — 28 blobs. **Lidos integralmente** os documentos que especificam o app e a marca (marcados ✔). Os demais (estratégia de marketing/conteúdo) foram **lidos parcialmente / não constituem spec do app** — declarados explicitamente abaixo conforme a regra anti-fabricação.

| Caminho | Tamanho | Lido? | Papel na auditoria |
|---|---|---|---|
| `app/01-PRD.md` | 25.847 B | ✔ integral | Visão de produto (modelo Next.js/produtos avulsos) |
| `app/02-arquitetura.md` | 4.269 B | ✔ integral | Stack técnica (Expo/RN/Supabase) — **base canônica** |
| `app/03-funcionalidades.md` | 5.851 B | ✔ integral | Features por fase |
| `app/04-design-system.md` | 6.004 B | ✔ integral | Tokens visuais (cores/tipografia/ícones) — **canônico** |
| `app/05-fluxos-e-telas.md` | 4.557 B | ✔ integral | Abas, fluxos SOS/checklist/onboarding |
| `app/06-modelo-de-dados.md` | 5.597 B | ✔ integral | Esquema de dados (spec) |
| `app/07-regras-de-negocio.md` | 4.311 B | ✔ integral | Limites, planos, regras éticas |
| `app/08-roadmap-tecnico.md` | 4.845 B | ✔ integral | Sprints e DoD |
| `app/README.md` | 1.082 B | ⚠️ não lido | Índice da pasta (não-spec); baixo risco |
| `marca/manual-de-marca.md` | 11.037 B | ✔ integral | Identidade, voz, âncoras, interface digital |
| `marca/assets/paleta.md` | 5.541 B | ✔ integral | HEX/RGB canônicos |
| `marca/assets/tipografia.md` | 6.665 B | ✔ integral | Fontes por contexto |
| `marca/assets/logo-guidelines.md` | 6.907 B | ⚠️ não lido | Spec do logo/escudo; lido só o resumo citado no manual |
| `marca/diretrizes-video.md` | 7.770 B | ✖ não lido | Produção de vídeo (fora do escopo do app) |
| `marca/tom-visual-por-produto.md` | 6.928 B | ✖ não lido | Tom por produto (marketing) |
| `marca/briefing-executivo.md` | 2.448 B | ✖ não lido | Briefing (marketing) |
| `marca/manifesto.md` | 1.554 B | ✖ não lido | Manifesto de marca |
| `fundamentos/13-fundamentos.md` | 10.378 B | ✔ integral | Conteúdo dos 13 fundamentos (verificado contra o código) |
| `produtos/funil-de-produtos-v2.md` | 9.964 B | ✔ integral | Modelo de produtos/preços (avulsos) |
| `produtos/bundles-e-pacotes.md` | 4.554 B | ✖ não lido | Bundles (marketing) |
| `protocolos/*` (7 arquivos) | ~22 KB | ✖ não lidos (verif. indireta) | Conteúdo dos protocolos; o protocolo do app foi auditado contra `05-fluxos` e o código |
| `estrategia/*` (9 arquivos) | ~53 KB | ✖ não lidos | Estratégia de marketing/funil (não-spec do app) |
| `contexto/*` (2) · `planos/*` (3) | ~25 KB | ✖ não lidos | Contexto do criador e planos operacionais (não-spec do app) |
| `README.md` · `ROADMAP.md` (raiz) | 17.355 B | ⚠️ parcial | Índice e roadmap do repo |

**Justificativa das exclusões:** os arquivos de `estrategia/`, `contexto/`, `planos/`, `produtos/bundles`, e a maior parte de `marca/` (vídeo, tom, briefing, manifesto) e `protocolos/` descrevem **estratégia de marca, marketing e produção de conteúdo offline**, não o comportamento do aplicativo. A spec testável do *app* concentra-se em `app/*` (8 docs) + `marca/{manual,paleta,tipografia}` + `fundamentos/13-fundamentos.md` + `produtos/funil`, **todos lidos integralmente**.

---

## 4. Fase 1 — Registro de Requisitos (resumo)

IDs únicos usados na reconciliação (Fase 4). Critérios de aceite verificáveis. Fonte citada.

| ID | Categoria | Requisito (critério de aceite) | Fonte |
|---|---|---|---|
| IV-01 | Identidade Visual | Paleta noir: bg `#0e0d0c`, surface `#141312`, surface-2 `#1a1917`, text `#e8e6e2`, muted `#8a8782` | `04 §2` |
| IV-02 | Identidade Visual | Acento ouro fosco `#c8a84b` em CTAs/âncoras | `04 §2`, `paleta.md` |
| IV-03 | Identidade Visual | Emergência âmbar `#e07b2a` no botão SOS | `04 §2` |
| IV-04 | Identidade Visual | Tons de hover: primary `#b8942f`, emergency `#c96520` | `04 §2` |
| IV-05 | Identidade Visual | Display = Cormorant Garamond | `04 §3`, `tipografia.md` |
| IV-06 | Identidade Visual | Mono = JetBrains Mono (contadores) | `04 §3` |
| IV-07 | Identidade Visual | Corpo = General Sans | `04 §3` |
| IV-08 | Identidade Visual | Ícones = Phosphor Icons | `04 §8` |
| IV-09 | Identidade Visual | Botão SOS sempre visível, cor emergência, ícone escudo | `04 §6`, `03 F1.4` |
| IV-10 | Identidade Visual | SOS flutuante canto inferior direito, ⌀56px | `04 §6` |
| IV-11 | Identidade Visual | Modo escuro como padrão | `03`, `04` |
| IV-12 | Identidade Visual | Modo claro opcional (módulo familiar) | `03`, `04 §9`, `paleta.md` |
| IV-13 | Identidade Visual | Sem emojis como elementos de design | `01-PRD §5.1`, `04` |
| FN-01 | Funcionalidade | Onboarding 3 perguntas (motivo/tempo/desafio), ≤5 infos | `03 F1.1`, `05 §2` |
| FN-02 | Funcionalidade | Contador de dias editável + marcos | `03 F1.3`, `07 §1` |
| FN-03 | Regra de Negócio | Sem reset/streak punitivo | `07 §1`, `05 §4` |
| FN-04 | Funcionalidade | Contador em tempo real (dias/horas/min) | `01-PRD §5.3.1` |
| FN-05 | Funcionalidade | Checklist diário de 5 itens (sono/água/alimentação/movimento/conexão) | `03 F1.2` |
| FN-06 | Regra de Negócio | 1 checklist/dia, persiste no Supabase | `07 §2`, `06` |
| FN-07 | Identidade Visual | Micro-animação scale-bounce ao marcar | `04 §7`, `05 §4` |
| FN-08 | Funcionalidade | Protocolo SOS 5 etapas PARE/RESPIRE/CONTATO/MOVIMENTO/ESTRUTURA | `03 F1.4`, `05 §3` |
| FN-09 | Funcionalidade | Respiração 4-4-6 animada | `04 §6`, `05 §3` |
| FN-10 | Fluxo/UX | SOS acessível em ≤2 toques de qualquer tela | `01-PRD §13`, `03 F1.4` |
| FN-11 | Regra de Negócio | SOS free 3/mês; nunca bloqueado durante crise ativa | `07 §3`, `07 §7` |
| FN-12 | Fluxo/UX | Etapa CONTATO = acionar contatos de confiança (ligar/mensagem) | `05 §3`, `03 F1.4` |
| FN-13 | Fluxo/UX | Etapa PARE com "não decidir por 5 minutos" | `01-PRD §5.3.3`, `05 §3` |
| FN-14 | Funcionalidade | Diário de prompts: mín. 50 chars, editável-não-deletável, rotação por pilar | `03 F2.1`, `07 §4` |
| FN-15 | Funcionalidade | 13 Fundamentos com conteúdo fiel ao doc | `fundamentos/13-fundamentos.md` |
| FN-16 | Regra de Negócio | Free = 3 fundamentos; pago = 13 | `07 §6`, `03 F2.2` |
| FN-17 | Funcionalidade | Marcar fundamento "aplicado" (progresso persistente) | `03 F2.2` |
| FN-18 | Funcionalidade | Mapa de Gatilhos CRUD (Essential+Guardião) | `03 F2.3`, `07 §6` |
| FN-19 | Regra de Negócio | Familiar: código 6 díg/48h, 1 conexão, revogar imediato, vê só status | `07 §5`, `03 F2.4`, `06` |
| FN-20 | Funcionalidade | Botão "Gerar código" funciona no runtime web | `CODE` PR #3 |
| FN-21 | Funcionalidade | Programa 30 Dias progressivo (Guardião) | `03 F3.1` |
| FN-22 | Funcionalidade | Certificado ao concluir o Programa 30 | `03 F3.1` |
| FN-23 | Funcionalidade | Comunidade O Escudo (feed/reações/moderação) | `01-PRD §5.5`, `03 F3.2` |
| FN-24 | Funcionalidade | Estatísticas + relatório + export PDF | `03 F3.3` |
| FN-25 | Funcionalidade | Contatos de confiança (cadastro + acionar no SOS) | `05 §1/§3` (Perfil) |
| FN-26 | Funcionalidade | Lembrete diário configurável | `03 F1.5`, `07 §8` |
| FN-27 | Regra de Negócio | Sem notificações entre 23h e 7h | `07 §8` |
| FN-28 | Funcionalidade | Biometria/PIN para abrir o app | `03 transversais`, `05 §1` |
| FN-29 | Regra de Negócio | Exclusão de conta e dados em ≤2 toques (LGPD) | `07 §7`, `02 §3` |
| FN-30 | Funcionalidade | Autenticação (e-mail/senha) | `02 §1`, `03 F1.1` |
| FN-31 | Funcionalidade | Login Google/Apple (OAuth) | `02 §1`, `05 §2` |
| RN-01 | Regra de Negócio | Matriz de planos Free/Essential/Guardião | `07 §6` |
| RN-02 | Regra de Negócio | SOS ilimitado nos planos pagos | `07 §6` |
| RN-03 | Regra de Negócio | Histórico de checklist: free 7 dias / pago ilimitado | `07 §2` |
| RN-04 | Regra de Negócio | Diário: free 7 dias / pago ilimitado | `07 §4` |
| RN-05 | Regra de Negócio | 1 conexão familiar ativa por usuário | `07 §5` |
| RN-06 | Regra de Negócio | Código de convite expira em 48h | `07 §5` |
| RN-07 | Regra de Negócio | Familiar não vê diário/notas/detalhes | `07 §5` |
| ET-01 | Ética | Nenhuma promessa de cura/resultado milagroso | `07 §7`, `01-PRD §11` |
| ET-02 | Ética | Disclaimer "não substitui profissionais" em telas-chave | `01-PRD §12`, `07 §7` |
| ET-03 | Ética | CVV 188 + CAPS visíveis em protocolo e configurações | `07 §7` |
| ET-04 | Ética | SOS nunca bloqueado durante sessão de crise | `07 §7` |
| ET-05 | Ética | Exclusão de conta/dados em ≤2 toques | `07 §7` |
| ET-07 | Ética | RLS em todas as tabelas de usuário | `02 §3`, `06` |
| ET-08 | Ética | Dados de sobriedade não expostos sem consentimento | `07 §7` |
| RT-01..13 | Rota/Link | Rotas renderizam (HTTP 200) e links internos/externos válidos | `01-PRD §7`, `05 §1` |
| AR-01 | Arquitetura | Stack Expo/RN/expo-router/NativeWind/Zustand/Supabase/Stripe | `02 §1` |
| AR-02 | Arquitetura | Modelo de dados conforme `06` | `06` |
| AR-03 | Arquitetura | View segura `family_day_status` para acesso do familiar | `06 §2` |
| AR-04 | Arquitetura | RLS por usuário aplicada | `02 §3`, `06 §4` |
| AR-05 | NFR | Offline-first (checklist/diário/protocolos em cache) | `02 §5`, `01-PRD §13` |
| AR-06 | NFR | CI/CD (GitHub Actions) + cobertura de testes | `02 §1`, `08` |
| AR-07 | Arquitetura | Deploy Vercel (push main → produção) | `02 §1`, `08` |
| AR-08 | NFR | SSR/SEO da landing (Next.js) | `01-PRD §4.2` |
| MO-01 | Negócio | Assinaturas Free / Essential R$19,90 / Guardião R$39,90 | `07 §6`, `02 §4` |
| MO-02 | Negócio | Guardião anual R$299 | `02 §4` |
| MO-03 | Negócio | Produtos avulsos R$47/97/197 + mentoria R$997 | `01-PRD §5.4`, `funil` |
| MO-04 | Integração | Stripe checkout + webhook | `01-PRD §8.1`, `02 §4` |
| MO-05 | Negócio | (extra) Trial de 5 dias | `CODE` |
| MO-06 | Negócio | (extra) Modo anônimo/guest | `CODE` |

---

## 5. Fase 4 — Tabela de Reconciliação de 3 Vias

Legenda de veredito: `✅` conforme · `⚠️` divergente-neutro · `❌` faltando · `🔴` quebrado · `⭐` divergência positiva · `❓` não verificável. Severidade só para não-✅/⭐.

### 5.1 Identidade Visual

| ID | DOCS diz | CODE tem | LIVE mostra | Veredito | Sev | Evidência |
|---|---|---|---|---|---|---|
| IV-01 | Paleta noir (bg `#0e0d0c`…) | Tokens idênticos | Fundo noir renderizado | ✅ | — | `tailwind.config.js → colors`; `constants/Colors.ts`; LIVE `/` screenshot ss_03686 |
| IV-02 | Ouro `#c8a84b` | `gold:'#c8a84b'` | Âncora/CTAs em ouro | ✅ | — | `constants/Colors.ts → gold`; LIVE `/` |
| IV-03 | Emergência `#e07b2a` | `emergency:'#e07b2a'` | Botão SOS laranja | ✅ | — | `constants/Colors.ts`; `(tabs)/_layout.tsx → SosButton`; LIVE |
| IV-04 | hover `#b8942f`/`#c96520` | `goldDim:#a68a3a`/`emergencyDim:#b85f1f` | (n/a) | ⚠️ | Baixo | `constants/Colors.ts` |
| IV-05 | Cormorant Garamond | `useFonts({CormorantGaramond…})` | Renderiza serifada itálica | ✅ | — | `app/_layout.tsx → useFonts`; LIVE âncora/títulos |
| IV-06 | JetBrains Mono | `JetBrainsMono` carregada | Datas/contador em mono | ✅ | — | `app/_layout.tsx`; LIVE `/` data "SÁBADO·20 JUNHO" |
| IV-07 | Corpo = General Sans | `fontFamily.body:'GeneralSans'` **mas não carregada** | Cai p/ fonte do sistema | ❌ | Médio | `tailwind.config.js`/`constants/typography.ts` referenciam `GeneralSans`; `app/_layout.tsx useFonts` só carrega Cormorant+JetBrains; sem arquivo em `assets/fonts` |
| IV-08 | Phosphor Icons | `@expo/vector-icons` (Ionicons) | Ícones Ionicons | ⚠️ | Baixo | `(tabs)/_layout.tsx`, `index.tsx` → `Ionicons` |
| IV-09 | SOS sempre visível, emergência | Botão central pulsante, ícone `shield` | Visível em todas as abas | ✅ | — | `(tabs)/_layout.tsx → SosButton`; LIVE todas as telas |
| IV-10 | Flutuante inf. direito, 56px | Aba central, 58px | Centralizado | ⚠️ | Baixo | `(tabs)/_layout.tsx` |
| IV-11 | Modo escuro padrão | `userInterfaceStyle:'dark'` | App escuro | ✅ | — | `app.json`; LIVE |
| IV-12 | Modo claro opcional | Sem toggle; tema fixo | Sempre escuro | ❌ | Baixo | `app.json`; `user_settings.theme` existe sem UI |
| IV-13 | Sem emojis como design | Usa 🔒/✦/✓ como elementos | 🔒 em fundamentos | ⚠️ | Baixo | `(tabs)/metodo.tsx`; LIVE `/metodo` |

### 5.2 Funcionalidade & Fluxos

| ID | DOCS diz | CODE tem | LIVE mostra | Veredito | Sev | Evidência |
|---|---|---|---|---|---|---|
| FN-01 | Onboarding 3 perguntas | `(auth)/onboarding/{motivo,tempo,desafio}` + colunas | Conta já onboardada | ✅ | — | `database.types.ts → profiles.onboarding_*`; `welcome.tsx → /onboarding/motivo` |
| FN-02 | Contador + marcos | `lib/sobriety.ts daysSince`; `MILESTONE_LABELS` | "0 · Dias construindo" | ✅ | — | `lib/sobriety.ts`, `lib/protocolo.ts`; LIVE `/` |
| FN-03 | Sem reset punitivo | Texto "Sem streak punitiva" | Exibido no card | ✅ | — | `(tabs)/index.tsx`; LIVE `/` |
| FN-04 | Tempo real dias/horas/min | Só dias | Só "0" dias | ⚠️ | Baixo | `(tabs)/index.tsx`; `03 F1.3` só exige dias |
| FN-05 | Checklist 5 itens | `checklist_items` + completions | "3/5: Dormi bem, Me hidratei, Me alimentei bem, Me movimentei, Tive contato positivo" | ✅ | — | `(tabs)/index.tsx`; LIVE `/` |
| FN-06 | 1/dia, persiste | `checklist_completions` (UNIQUE date) | Toggle persiste | ✅ | — | `database.types.ts`; `index.tsx → toggleItem` |
| FN-07 | Bounce ao marcar | Só muda borda/cor | Sem bounce | ⚠️ | Baixo | `(tabs)/index.tsx` (sem Animated no item) |
| FN-08 | SOS 5 etapas | `protocolo.tsx` Step machine | PARE→RESPIRE→CONTATO→MOVIMENTO→ESTRUTURA→Concluído | ✅ | — | `(tabs)/protocolo.tsx`; LIVE ss_0957/ss_0088/ss_2519/ss_8439/ss_5574 |
| FN-09 | Respiração 4-4-6 | `BREATH_PHASES` 4/4/6 ×3 | "INSPIRE 4 · Inspire 4s·Segure 4s·Expire 6s" | ✅ | — | `(tabs)/protocolo.tsx`; LIVE ss_0088 |
| FN-10 | SOS ≤2 toques | 1 toque (aba central) | 1 toque abre `/protocolo` | ✅ | — | `(tabs)/_layout.tsx`; LIVE |
| FN-11 | Free 3/mês; nunca bloquear crise | `FREE_MONTHLY_LIMIT=3`; texto "jamais bloqueado" | "1/3 usos este mês" + frase | ✅ | — | `lib/protocolo.ts`; LIVE ss_0957 / `/plans` |
| FN-12 | CONTATO = acionar contatos | Etapa CONTATO = grounding 5-4-3-2-1 | "Nomeie: 5 coisas que VEJA…" | ⚠️ | Médio | `(tabs)/protocolo.tsx`; LIVE ss_2519 (não aciona contatos) |
| FN-13 | PARE "não decidir por 5 min" | PARE auto-avança em 4s, sem timer | "Avançando automaticamente…" | ⚠️ | Baixo | `(tabs)/protocolo.tsx → useEffect 4000ms` |
| FN-14 | Diário 50ch, edit-não-delete, rotação | `lib/diario.ts MIN_CHARS`; prompts por pilar | "/diario" lista; "editáveis, nunca excluíveis"; prompt ESCUDO (sábado) | ✅ | — | `(tabs)/index.tsx`, `lib/fundamentos.ts PROMPTS`; LIVE `/diario` ss_9825 |
| FN-15 | 13 fundamentos fiéis | `FUNDAMENTOS[13]` conteúdo idêntico | 13 listados (Identidade…Repetição) | ✅ | — | `lib/fundamentos.ts`; LIVE `/metodo` ss_5081 |
| FN-16 | Free=3 / pago=13 | `isFundamentoLocked id>3` | "10 fundamentos bloqueados" (free); 13 abertos (trial) | ✅ | — | `lib/fundamentos.ts`; LIVE `/metodo` free vs trial ss_5587 |
| FN-17 | "Aplicado" persistente | `useState` local (não salva) | Toggle visual | ⚠️ | Baixo | `(tabs)/metodo.tsx → aplicados:Set` |
| FN-18 | Mapa de Gatilhos CRUD | `lib/triggers.ts` + modal | Criei "Final de tarde (teste auditoria)" com sucesso | ✅ | — | `(tabs)/escudo.tsx`; LIVE ss_5392 |
| FN-19 | Familiar 6díg/48h/revoga/só-status | `lib/family.ts generateInviteCode` 6díg, 48h, `can_see_diary:false` | Form "código de 6 dígitos válido por 48h… sem diário" | ✅ | — | `lib/family.ts`; LIVE ss_7652 |
| FN-20 | "Gerar código" funciona (web) | Handler com wrapper web (PR #3) | **Falha: diálogo de erro, nenhum código gerado (2×)** | 🔴 | Alto | `(tabs)/escudo.tsx → handleInvite`; LIVE: clique trava a página em diálogo nativo; recuperação só via navegação |
| FN-21 | Programa 30 progressivo | `app/programa30.tsx` | "Progresso 0/30 · Dia 1 ativo · Dias 2-30 🔒" | ✅ | — | LIVE `/programa30` ss_8677 (via warm-nav) |
| FN-22 | Certificado ao concluir | Não evidenciado | Não verificado | ❓ | — | Não cheguei ao fim do programa; sem evidência no código lido |
| FN-23 | Comunidade O Escudo | Só flag `community` no FEATURE_MAP; sem UI | Inexistente | ❌ | Alto | `hooks/usePlanStore.ts`; nenhuma rota/feed de comunidade |
| FN-24 | Estatísticas + PDF | `app/stats.tsx` + `expo-print` | "/stats": Resumo, presença 28d, **Exportar PDF** | ✅ | — | LIVE `/stats` ss_1741 (PDF não acionado p/ não baixar) |
| FN-25 | Contatos de confiança | `app/contatos.tsx` = **stub**; `emergency_contacts` no DB sem UI | "Em breve… em desenvolvimento" | ❌ | Médio | LIVE `/contatos` ss_6747; não linkado no Perfil |
| FN-26 | Lembrete diário | `lib/notifications.ts scheduleDailyReminder(9,0)` | Toggle "Lembrete diário 09:00" | ✅ | — | `(tabs)/perfil.tsx`; LIVE `/perfil` |
| FN-27 | Sem notificações 23h-7h | `user_settings.quiet_hours_*`; agendamento fixo 09:00 | Push não testável na web | ❓ | — | `database.types.ts`; agendamento real não verificável em runtime web |
| FN-28 | Biometria/PIN | `expo-local-authentication` + `appLock` | Oculto na web (sem hardware) — correto | ✅ | — | `(tabs)/perfil.tsx`, `app/_layout.tsx`; LIVE `/perfil` |
| FN-29 | Exclusão LGPD ≤2 toques | `confirmDelete` → edge fn `delete-account` | "Excluir minha conta e todos os dados" | ✅ | — | `(tabs)/perfil.tsx`; LIVE `/perfil` |
| FN-30 | Auth e-mail/senha | `(auth)/{login,register,setup}` | `/login` redireciona autenticado p/ Home (guard ok) | ✅ | — | `app/_layout.tsx guard`; LIVE `/login`→`/` |
| FN-31 | OAuth Google/Apple | Sem botões OAuth em `welcome.tsx` | Não confirmado | ❓ | — | `welcome.tsx` só e-mail/guest; `login.tsx`/`register.tsx` não lidos integralmente |

### 5.3 Regras de Negócio

| ID | DOCS diz | CODE tem | LIVE mostra | Veredito | Sev | Evidência |
|---|---|---|---|---|---|---|
| RN-01 | Matriz Free/Essential/Guardião | `FEATURE_MAP`/`PLAN_FEATURES` | Tabela comparativa em `/plans` | ✅ | — | `types.monetization.ts`; LIVE `/plans` ss_4407 |
| RN-02 | SOS ilimitado nos pagos | `emergencyProtocol:-1` | "∞" em Essential/Guardião | ✅ | — | `types.monetization.ts`; LIVE `/plans` |
| RN-03 | Histórico checklist 7d/ilim | Não confirmado o corte de 7d | Não testado | ❓ | — | `app/historico.tsx` não lido; corte não exercido |
| RN-04 | Diário 7d/ilim | `diaryPrompts:7/-1` na matriz | Não testado o corte | ❓ | — | `types.monetization.ts`; corte não exercido em runtime |
| RN-05 | 1 conexão familiar | `createInvite` verifica existência | (bloqueado pela falha FN-20) | ✅ | — | `lib/family.ts` |
| RN-06 | Convite expira 48h | `expiresAt = now + 48h` | Form diz "válido por 48h" | ✅ | — | `lib/family.ts`; LIVE ss_7652 |
| RN-07 | Familiar não vê detalhes | `can_see_diary/sos/triggers:false` | "vê apenas: dia guardado" | ✅ | — | `lib/family.ts`, `getFamilyDayStatus` |

### 5.4 Ética & Conformidade

| ID | DOCS diz | CODE tem | LIVE mostra | Veredito | Sev | Evidência |
|---|---|---|---|---|---|---|
| ET-01 | Sem promessa de cura | Lista de "compromissos inegociáveis" | Sem promessas em nenhuma tela vista | ✅ | — | `app/sobre.tsx HARD_RULES`; LIVE |
| ET-02 | Disclaimer ubíquo | String repetida em todas as telas | "Este app não substitui psiquiatra…" em todas | ✅ | — | LIVE `/`,`/metodo`,`/escudo`,`/protocolo`,`/perfil` |
| ET-03 | CVV 188 + CAPS | `Linking tel:188` + caps.ms | Presente em protocolo, perfil, contatos | ✅ | — | `protocolo.tsx`,`perfil.tsx`; LIVE |
| ET-04 | SOS nunca bloqueado | "jamais bloqueado durante crise"; `saveSos` fire-and-forget | Texto exibido em `/plans` e `/protocolo` | ✅ | — | `lib/protocolo.ts`; LIVE |
| ET-05 | Exclusão ≤2 toques | confirm → edge fn | Botão presente | ✅ | — | `perfil.tsx`; LIVE `/perfil` |
| ET-07 | RLS por usuário | Queries escopadas por `user_id`; sem acesso ao DB | Não verificável diretamente | ❓ | — | `06 §4` exige; não há acesso ao painel Supabase para confirmar políticas |
| ET-08 | Dados não expostos | Familiar só vê status (flags false) | Design respeita | ✅ | — | `lib/family.ts` |

### 5.5 Rotas & Links (runtime)

| ID/Rota | Esperado | Status HTTP / Render | Veredito | Evidência |
|---|---|---|---|---|
| RT-01 `/` (Hoje) | Dashboard diário | 200 · renderiza | ✅ | ss_03686 |
| RT-02 `/metodo` | Pilares + 13 fundamentos | 200 · renderiza | ✅ | ss_5081 |
| RT-03 `/escudo` | Gatilhos + familiar | 200 · renderiza (com bug de paywall) | ✅ | ss_8426 |
| RT-04 `/protocolo` | SOS | 200 · fluxo completo | ✅ | ss_0957…ss_5574 |
| RT-05 `/perfil` | Config/planos/LGPD | 200 · renderiza | ✅ | ss_3138 |
| RT-06 `/plans` | Comparativo + trial | 200 · renderiza | ✅ | ss_4407 |
| RT-07 `/programa30` | Programa 30 | 200 · renderiza | ✅ | ss_4158/ss_8677 |
| RT-08 `/stats` | Estatísticas + PDF | 200 · renderiza | ✅ | ss_1741 |
| RT-09 `/diario` | Reflexões | 200 · renderiza | ✅ | ss_9825 |
| RT-10 `/contatos` | Contatos | 200 · **stub "em breve"** | ✅ (rota) | ss_6747 |
| RT-11 `/login` | Login | 200 · redireciona autenticado → `/` (guard) | ✅ | LIVE `/login`→`/` |
| RT-12 `/sobre`, `/privacidade`, `/historico` | Telas estáticas | Confirmadas no código + linkadas no Perfil; **runtime não aberto individualmente** | ❓ | `perfil.tsx → Mais`; `app/sobre.tsx`,`privacidade.tsx`,`historico.tsx` lidos/listados |
| RT-13 Links externos | `tel:188`, `caps.ms/onde-buscar-ajuda` | Configurados via `Linking.openURL` (destino não aberto p/ não sair do app) | ✅ | `protocolo.tsx`,`perfil.tsx`,`contatos.tsx` |

### 5.6 Arquitetura, Dados & NFR

| ID | DOCS diz | CODE tem | Veredito | Sev | Evidência |
|---|---|---|---|---|---|
| AR-01 | Expo/RN/router/NativeWind/Zustand/Supabase/Stripe | Exatamente isso | ✅ | — | `package.json` |
| AR-02 | Modelo de dados do `06` (daily_checklists item_1..5, journal_entries, triggers_map, emergency_log, sobriety_milestones) | Esquema **normalizado diferente** (checklist_items+completions, diary_entries, user_triggers, sos_activations, sobriety_records) | ⚠️ | Médio | `lib/database.types.ts` vs `06` |
| AR-03 | View segura `family_day_status` | Não há view; status via query cliente `getFamilyDayStatus` | ⚠️ | Médio | `lib/family.ts`; impacto RLS = ❓ |
| AR-04 | RLS em todas as tabelas | Não verificável sem acesso ao DB | ❓ | — | sem painel Supabase |
| AR-05 | Offline-first | `react-native-mmkv` presente (usado p/ appLock); sync offline não evidenciado | ❓ | — | `package.json`; comportamento offline não testável aqui |
| AR-06 | CI + testes | `.github/workflows/ci.yml` + 6 suites em `__tests__` | ⭐ | — | `__tests__/*.test.ts` (sobriety, protocolo, monetization, stripe, fundamentos, programa30dias) |
| AR-07 | Deploy Vercel | `vercel.json` (expo export web + rewrites SPA) | ✅ | — | `vercel.json`; LIVE 200 |
| AR-08 | SSR/SEO landing (Next.js) | SPA client-rendered, sem SSR/landing | ❌ | Médio | `vercel.json`; `web_fetch` retornou casca vazia |

### 5.7 Monetização

| ID | DOCS diz | CODE tem | LIVE mostra | Veredito | Sev | Evidência |
|---|---|---|---|---|---|---|
| MO-01 | Free/Essential R$19,90/Guardião R$39,90 | Idêntico | "R$ 19,90 / R$ 39,90 /mês" | ✅ | — | `types.monetization.ts PRICING`; LIVE `/plans` |
| MO-02 | Guardião anual R$299 (`02`) | `guardian.annual:399` | (não exibido o anual) | ⚠️ | Médio | `types.monetization.ts` vs `02 §4` |
| MO-03 | Produtos avulsos R$47/97/197 + mentoria (PRD/funil) | Não implementado (modelo é assinatura) | Só assinaturas | ❌ | Médio | DOCS internamente contraditório; código seguiu `07`/`02` |
| MO-04 | Stripe checkout + webhook | `lib/stripe.ts` + edge fns | Não exercido (seria compra) | ✅ | — | `supabase/functions/{create-checkout-session,handle-stripe-webhooks}` |
| MO-05 | (extra) Trial 5 dias | `activate_trial` RPC | "Período de teste ativo — 5 dias restantes" | ⭐ | — | `usePlanStore.ts`; LIVE `/plans` ss_5242 |
| MO-06 | (extra) Modo anônimo | `lib/anonymousAuth.ts`, banner | "Explorar sem cadastro" | ⭐ | — | `welcome.tsx`; `components/AnonymousBanner.tsx` |

---

## 6. Achados Detalhados (itens não conformes)

### 🟠 ACHADO 1 — `Gerar código` do Módulo Familiar falha no runtime web (FN-20) · 🔴 QUEBRADO · Alto

**O que deveria acontecer (spec/código):** com plano Guardião (ou trial), preencher o nome do familiar e tocar **"Gerar código"** deve criar a conexão e exibir inline um **código de 6 dígitos válido por 48h**.

**O que acontece (runtime):** o clique dispara um **diálogo de erro nativo** (`window.alert` do tratamento de erro), **nenhum código é gerado**, e a página fica travada até navegação. Reproduzido **2 vezes**. O caminho de sucesso (que renderiza o código inline, sem alert) não é alcançado — logo, `createInvite()` lançou exceção.

**Passos para reproduzir:**
1. Plano Guardião/trial ativo. Abrir `/plans`, aguardar carregar, tocar a aba **Escudo** (montagem com plano já carregado → desbloqueado).
2. Em **Módulo Familiar**, tocar **"Convidar familiar"**.
3. Digitar um nome (ex.: "Maria Teste") e tocar **"Gerar código"**.
4. Observado: diálogo de erro; sem código; página travada.

**Causa-raiz:** `❓ NÃO VERIFICÁVEL` com as ferramentas disponíveis — o diálogo nativo bloqueia a leitura de rede/console e a navegação para recuperar descarta o erro. **Hipótese plausível (não confirmada):** o `INSERT` em `family_connections` é rejeitado no servidor (ex.: política RLS que exige `profiles.plan = 'guardian'`, enquanto o usuário de trial permanece com `plan='free'` + `trial_end`). Reforça a hipótese o fato de o `INSERT` em `user_triggers` (mesmo contexto de trial) ter **funcionado** — sugerindo regra específica da tabela `family_connections`.

**Correção sugerida:** instrumentar `lib/family.ts → createInvite` para logar `error.message/details/code` no console (não só `showAlert`), reproduzir e inspecionar a resposta do PostgREST. Se for RLS por plano: alinhar a política de `family_connections` para aceitar usuários em trial (checar `trial_end > now()` além de `plan`), **ou** materializar o plano efetivo no perfil quando o trial é ativado. **Arquivo a alterar:** `lib/family.ts` (logging) + política RLS de `family_connections` no Supabase (e/ou `supabase/functions`/migração de RLS).

### 🟠 ACHADO 2 — Paywall indevido em cold-load de rotas premium (relativo a FN-18/FN-21/RT-03/RT-07) · Alto/Médio

**O que deveria acontecer:** um usuário Guardião/trial que abre/recarrega diretamente `/escudo` ou `/programa30` deve ver o conteúdo desbloqueado.

**O que acontece (runtime, confirmado):** em **cold-load** dessas rotas, aparece o **paywall** ("Recurso exclusivo" / "Plano Guardião") mesmo com trial ativo (confirmado simultaneamente em `/plans`: "Período de teste ativo"). Ao navegar `/plans` → aguardar → tocar a aba **Escudo** (nova montagem), desbloqueia. As telas `/metodo` e `/perfil` **não** sofrem disso.

**Causa-raiz (alta confiança, por leitura de código + reprodução):** `EscudoScreen` consome `usePlanStore((s) => s.canAccessFeature)` — seleciona a **função** (referência estável). Quando `trialEnd`/`plan` chega de forma assíncrona (perfil carregado em `app/_layout.tsx`), o seletor não muda → **o componente não re-renderiza** → `canAccessTriggers/Family` permanecem `false`. `/metodo` e `/perfil` selecionam o **valor** `trialEnd` e por isso reagem corretamente.

**Passos para reproduzir:** com trial ativo, abrir diretamente `https://guardiao-sobrio-app.vercel.app/escudo` (ou recarregar) → paywall persiste; idem `/programa30`.

**Correção sugerida:** em `(tabs)/escudo.tsx` e `app/programa30.tsx`, **não** selecionar o método do store; selecionar os valores reativos (`plan`, `trialEnd`, ou um seletor derivado `getEffectivePlan()` computado a partir de valores) e recalcular o acesso a cada render. Ex.: `const plan = usePlanStore(s=>s.plan); const trialEnd = usePlanStore(s=>s.trialEnd);` e derivar `canAccess` localmente (como já faz `metodo.tsx`). **Arquivos:** `app/(tabs)/escudo.tsx`, `app/programa30.tsx`, `hooks/usePlanStore.ts`.

### 🟠 ACHADO 3 — Comunidade "O Escudo" não implementada (FN-23) · Alto (Fase 3 planejada)

**Spec:** feed curado, reações ("Reconheço/Força/Obrigado"), moderação, posts anônimos (`01-PRD §5.5`, `03 F3.2`). **Código/Runtime:** existe apenas a flag `community` no `FEATURE_MAP` (`usePlanStore.ts`); **não há** rota, feed nem UI. **Correção:** implementar conforme `03 F3.2` ou atualizar o roadmap marcando explicitamente como Fase 3 não iniciada. **Arquivos:** novo módulo `app/(tabs)/comunidade` + tabelas `community_posts/reactions` (que constam no `01-PRD §6` mas não em `database.types.ts`).

### 🟡 ACHADO 4 — Fonte de corpo "General Sans" não é carregada (IV-07) · Médio

**Spec:** corpo em **General Sans** (`04 §3`). **Código:** `tailwind.config.js` e `constants/typography.ts` referenciam `GeneralSans`, mas `app/_layout.tsx → useFonts` carrega **apenas** Cormorant e JetBrains Mono; não há `.ttf` de General Sans em `assets/fonts` (só `SpaceMono-Regular.ttf`, resíduo do template). **Efeito:** todo texto `font-body`/`GeneralSans` cai para a fonte do sistema — a "âncora tipográfica" da marca para corpo não é cumprida. **Correção:** adicionar General Sans (Fontshare) via `expo-font`/arquivo local e incluí-la no `useFonts`. **Arquivo:** `app/_layout.tsx` + `assets/fonts/`.

### 🟡 ACHADO 5 — Etapa "CONTATO" do SOS diverge da especificação (FN-12) · Médio

**Spec (`05 §3`):** CONTATO = lista de **contatos de confiança** com **[Ligar] / [Mandar mensagem]**. **Código/Runtime:** a etapa CONTATO é um exercício de **grounding sensorial 5-4-3-2-1** (tecnicamente válido, porém **não aciona contatos**). Como `app/contatos.tsx` é stub, não há contatos para acionar. **Correção:** implementar contatos de confiança (Achado 6) e adicionar à etapa CONTATO um acesso rápido a eles, mantendo o grounding como passo complementar (ver Divergência Positiva ⭐-3). **Arquivo:** `app/(tabs)/protocolo.tsx`.

### 🟡 ACHADO 6 — "Contatos de Confiança" é um stub (FN-25) · Médio

**Spec:** cadastro de contatos no Perfil + acionar no SOS. **Runtime:** `/contatos` exibe **"Em breve… em desenvolvimento"**; a tabela `emergency_contacts` **existe** no banco (`database.types.ts`) mas **sem UI**; a rota **não está linkada** no Perfil (lista "Mais": Diário, Histórico, Planos, Privacidade, Sobre). **Correção:** construir o CRUD de `emergency_contacts` e linká-lo no Perfil e na etapa CONTATO. **Arquivo:** `app/contatos.tsx` + `(tabs)/perfil.tsx` (link).

### 🟡 ACHADO 7 — Modelo de dados implementado diverge do `06` (AR-02/AR-03) · Médio

**Spec `06`:** `daily_checklists` (item_1..5), `journal_entries`, `triggers_map`, `emergency_log`, `sobriety_milestones`, **view** `family_day_status`, função `calculate_sobriety_days`. **Código:** esquema **normalizado e mais flexível** — `checklist_items`+`checklist_completions`, `diary_entries`, `user_triggers`, `sos_activations`, `sobriety_records`; cálculo de dias em `lib/sobriety.ts`; status do familiar via query cliente (sem a **view segura**). Funcionalmente equivalente/superior, **mas** a ausência da view segura `family_day_status` transfere a proteção para regras de RLS que **não pude verificar** (ET-07/AR-04 = ❓). **Correção:** atualizar o `06` para refletir o esquema real **e** confirmar/implementar RLS que garanta que o familiar só leia o booleano do dia (idealmente via view `SECURITY DEFINER`). **Arquivos:** doc `app/06-modelo-de-dados.md` + políticas RLS.

### 🟡 ACHADO 8 — Ausência de Landing pública e Painel Admin (AR-08 / `01-PRD §5.1/§5.6`) · Médio (visão PRD)

**Spec (PRD, modelo Next.js):** landing pública (hero, prova social, produtos, "para familiares", footer) com SSR/SEO e `/admin` para o criador. **Código/Runtime:** o app Expo-web entra direto em **welcome → onboarding**; sem landing SSR nem `/admin`. **Observação:** isto decorre da contradição DOCS — `02-arquitetura` coloca a landing como projeto **Next.js separado** (não no app). **Correção:** decidir e documentar se a landing/admin serão um projeto web à parte; remover do escopo do app mobile ou planejar explicitamente. **Arquivo:** alinhar `01-PRD.md` × `02-arquitetura.md`.

### 🔵 Achados Baixos (resumo)

- **IV-04** tons de hover divergentes (`#a68a3a`/`#b85f1f` vs `#b8942f`/`#c96520`) — alinhar `constants/Colors.ts`.
- **IV-08** ícones Ionicons no lugar de Phosphor — decisão de manter ou trocar; atualizar `04 §8` se mantida.
- **IV-10** SOS centralizado na aba (vs flutuante inf. direito) — ver Divergência Positiva ⭐-1.
- **IV-12** modo claro opcional ausente — `user_settings.theme` existe sem UI.
- **IV-13** uso de 🔒/✦ como elementos — substituir por ícones monocromáticos.
- **FN-04** contador só em dias (PRD pedia tempo real) — `03` já só exige dias; baixo.
- **FN-07** sem micro-animação bounce no checklist.
- **FN-13** etapa PARE sem timer de 5 min (auto-avança em 4s).
- **FN-17** "aplicar fundamento" não persiste (estado local).
- **MO-02** preço anual Guardião R$399 (código) vs R$299 (`02`).

---

## 7. Divergências Positivas (⭐ manter e documentar)

| ⭐ | O que a implementação faz a mais/melhor | Doc a atualizar |
|---|---|---|
| ⭐-1 | **Botão SOS centralizado e pulsante na tab bar** — sempre visível em 1 toque em qualquer aba, melhor para web/desktop do que um FAB flutuante no canto | `04 §6` (registrar a decisão) |
| ⭐-2 | **Modo anônimo/guest + Trial de 5 dias** ("explorar sem cadastro" / "5 dias com tudo liberado, sem cartão") — reduz fricção de entrada, alinhado ao OKR de retenção; não estava no spec | `03`/`07` (adicionar) |
| ⭐-3 | **Grounding sensorial 5-4-3-2-1** na etapa CONTATO e **seletor de nível de fissura (1–10)** no SOS — adições clinicamente sólidas | `05 §3` (incorporar como passo, mas restaurar o acionamento de contatos — Achado 5) |
| ⭐-4 | **Esquema de dados normalizado** (checklist_items/completions) e **cálculo de dias à prova de fuso** (`lib/sobriety.ts atLocalMidnight`) — mais robusto que o spec | `06` (refletir) |
| ⭐-5 | **CI + 6 suites de teste** (`__tests__/`) e **edge functions** para checkout/webhook/exclusão de conta/limpeza de anônimos | `08` (registrar cobertura) |
| ⭐-6 | **Marcos extras** (3 e 21 dias) além dos do spec, reforçando reforço positivo precoce | `03 F1.3` |

> Recomendação: estas divergências **devem ser mantidas** e a documentação atualizada para refleti-las (em especial `04 §6`, `05 §3`, `06`, `08`).

---

## 8. Backlog Priorizado (severidade × esforço)

| # | Item | Sev | Esforço | Ação |
|---|---|---|---|---|
| 1 | Corrigir `Gerar código` (Achado 1) | 🟠 Alto | M | Instrumentar erro → ajustar RLS/plano efetivo de `family_connections` |
| 2 | Reatividade de plano em `/escudo` e `/programa30` (Achado 2) | 🟠 Alto | P | Selecionar `plan`/`trialEnd` por valor; não selecionar método do store |
| 3 | Carregar fonte **General Sans** (Achado 4) | 🟡 Médio | P | Adicionar fonte + `useFonts` |
| 4 | Implementar **Contatos de Confiança** + linkar no Perfil/SOS (Achados 5,6) | 🟡 Médio | M | CRUD `emergency_contacts` |
| 5 | Atualizar `06` ao esquema real + confirmar **RLS** do familiar (Achado 7) | 🟡 Médio | M | Doc + view/policy `SECURITY DEFINER` |
| 6 | Resolver contradição DOCS (PRD Next.js × app Expo; avulsos × assinatura; landing/admin) | 🟡 Médio | M | Alinhar `01-PRD` × `02`/`07`/`funil` |
| 7 | Construir **Comunidade O Escudo** ou marcar Fase 3 explicitamente (Achado 3) | 🟠 Alto | G | Módulo novo |
| 8 | Padronizar preço anual (R$299 × R$399) (MO-02) | 🔵 Baixo | P | Decidir e alinhar `02`/código |
| 9 | Ajustes visuais finos: hover, ícones Phosphor, emojis, modo claro, bounce (IV-04/08/12/13, FN-07) | 🔵 Baixo | P-M | Polimento de design-system |
| 10 | Timer 5 min no PARE; persistir "fundamento aplicado" (FN-13/FN-17) | 🔵 Baixo | P | Pequenos ajustes |

---

## 9. Registro de Evidências (Evidence Ledger)

### 9.1 Comandos executados (sandbox bash)

| Comando | Saída relevante |
|---|---|
| `git --version` | `git version 2.34.1` |
| `git clone https://github.com/vanzer80/guardiao-sobrio-docs.git` | `fatal: unable to access … 403 from proxy after CONNECT` (bloqueado) |
| `git clone https://github.com/vanzer80/guardiao-sobrio-app.git` | `fatal: … 403 from proxy after CONNECT` (bloqueado) |
| `web_fetch https://guardiao-sobrio-app.vercel.app/` | `Content-Type: text/html` + apenas `meta-viewport` (casca SPA, sem corpo) |
| `web_fetch api.github.com/repos/...` (×4) | Corpo vazio (não utilizável) → fallback para Chrome |

### 9.2 Fontes lidas via Chrome (GitHub API / raw.githubusercontent.com)

**Metadados/commits/árvores:** `api.github.com/repos/vanzer80/guardiao-sobrio-docs` (e `/commits`, `/git/trees/main?recursive=1`); idem para `guardiao-sobrio-app`. Ambas as árvores `"truncated": false` (completas).

**DOCS — arquivos lidos integralmente (raw):** `app/01-PRD.md` (25.847 B), `app/02-arquitetura.md` (4.269), `app/03-funcionalidades.md` (5.851), `app/04-design-system.md` (6.004), `app/05-fluxos-e-telas.md` (4.557), `app/06-modelo-de-dados.md` (5.597), `app/07-regras-de-negocio.md` (4.311), `app/08-roadmap-tecnico.md` (4.845), `marca/manual-de-marca.md` (11.037), `marca/assets/paleta.md` (5.541), `marca/assets/tipografia.md` (6.665), `fundamentos/13-fundamentos.md` (10.378), `produtos/funil-de-produtos-v2.md` (9.964).

**CODE — arquivos lidos integralmente (raw):** `package.json`, `app.json`, `vercel.json`, `tailwind.config.js`, `global.css`, `constants/Colors.ts`, `constants/typography.ts`, `lib/database.types.ts`, `lib/sobriety.ts`, `lib/protocolo.ts`, `lib/fundamentos.ts`, `lib/family.ts`, `lib/stripe.ts`, `lib/types.monetization.ts`, `hooks/usePlanStore.ts`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/protocolo.tsx`, `app/(tabs)/escudo.tsx`, `app/(tabs)/metodo.tsx`, `app/(tabs)/perfil.tsx`, `app/(tabs)/plans.tsx`, `app/(auth)/welcome.tsx`, `app/contatos.tsx`, `app/sobre.tsx`.

**CODE — listados na árvore mas NÃO lidos integralmente (declarados):** `app/(auth)/{login,register,setup,ativacao,convert,callback}.tsx`, `app/(auth)/onboarding/{motivo,tempo,desafio}.tsx`, `app/{diario,historico,stats,programa30,privacidade,planos}.tsx`, `app/plans/{success,cancel}.tsx`, `app/+html.tsx`, `app/+not-found.tsx`, `components/*`, `lib/{diario,triggers,notifications,supabase,appLock,anonymousAuth,...}.ts`, `supabase/functions/*`, `supabase/migrations/*`, `__tests__/*`, `docs/features/{AUDIT_REPORT,anonymous-mode}.md`. Comportamento de várias dessas telas foi verificado **em runtime** (ver 9.3).

### 9.3 Rotas testadas em runtime (LIVE) + screenshots

| URL | Status/Render | Screenshot |
|---|---|---|
| `/` (Hoje) | 200 · contador, checklist 5 itens, âncora, reflexão, disclaimer | ss_03686 |
| `/metodo` | 200 · pilares, 13 fundamentos (free=3/trial=13), Programa 30 | ss_5081, ss_5587 |
| `/escudo` (free) | 200 · paywall gatilhos+familiar | ss_8426 |
| `/escudo` (trial, warm) | 200 · gatilhos+familiar desbloqueados; criação de gatilho OK | ss_9291, ss_5392 |
| `/escudo` (trial, cold) | 200 · **paywall indevido (bug)** | ss_2972 |
| `/protocolo` (SOS) | 200 · fluxo 5 etapas completo + limite 3/mês + CVV | ss_0957, ss_0088, ss_2519, ss_8439, ss_5574 |
| `/perfil` | 200 · plano Gratuito, config, LGPD, CVV/CAPS | ss_3138 |
| `/plans` | 200 · 3 tiers + trial; ativação de trial OK | ss_4407, ss_5242 |
| `/programa30` (cold) | 200 · paywall indevido | ss_4158 |
| `/programa30` (warm) | 200 · programa progressivo 0/30 | ss_8677 |
| `/stats` | 200 · resumo + Exportar PDF | ss_1741 |
| `/diario` | 200 · reflexões editáveis-não-excluíveis | ss_9825 |
| `/contatos` | 200 · **stub "em breve"** | ss_6747 |
| `/login` | 200 · redireciona autenticado → `/` (guard) | — |
| Módulo Familiar → "Gerar código" | **Falha: diálogo de erro, sem código (2×)** | ss_7652 (form) + travamento |

**Conta de teste usada:** `audit.guardiao.2026@mailinator.com` (nome "Auditor", plano Gratuito), claramente provisionada para auditoria. **Ações de escrita realizadas (transparência):** (1) ativação do **trial de 5 dias** (necessária para exercitar features Guardião e o `Gerar código`); (2) criação de **1 gatilho** "Final de tarde (teste auditoria)"; (3) **2 tentativas** de gerar convite familiar (falharam, nada persistido). Nenhuma compra, nenhuma exclusão de conta, nenhum dado pessoal real inserido.

**Console (runtime):** apenas avisos benignos `Animated: useNativeDriver is not supported … Falling back to JS-based animation` (animações do SOS/respiração caem para JS na web — sem quebra; nota de performance baixa). Nenhum erro de servidor capturável (o erro do convite é exibido via `window.alert`, que bloqueia a introspecção da página).

---

## 10. GATE FINAL — Autoauditoria

- [x] Li integralmente os documentos de *spec do app* do repo DOCS (e listei explicitamente os não lidos e o motivo — §3).
- [x] Mapeei os requisitos para `REQ-ID` com critério de aceite verificável (§4).
- [x] Inventariei o código e liguei cada requisito ao artefato de implementação (§5, §9.2).
- [x] **Carreguei o app ao vivo** e testei cada rota/aba e as funções nucleares com status/observação registrados (não deduzidos) — §5.5, §9.3.
- [x] Toda linha da reconciliação tem evidência citável (arquivo/símbolo ou URL/screenshot).
- [x] O score foi **calculado** a partir da tabela, com números absolutos (§1): 57/76 = 75,0%.
- [x] Itens incertos marcados `❓ NÃO VERIFICÁVEL` com justificativa (FN-22, FN-27, FN-31, RN-03, RN-04, ET-07, AR-04, AR-05, RT-12) — nenhuma lacuna preenchida por suposição.
- [x] Evidence Ledger completo: comandos, arquivos lidos/não lidos, rotas testadas, screenshots, console.

**Limitações declaradas (honestidade da missão):** (a) sem acesso ao painel Supabase, **RLS e a segurança real do acesso do familiar não foram verificáveis** (ET-07/AR-04/AR-03); (b) a **causa-raiz** da falha do `Gerar código` não pôde ser isolada porque o diálogo nativo bloqueia a introspecção (FN-20 root cause = ❓, mas a **falha em si está verificada**); (c) algumas telas estáticas (`/sobre`, `/privacidade`, `/historico`) foram confirmadas no código e estão linkadas, mas **não abertas individualmente** no runtime (RT-12 = ❓); (d) fluxos que exigiriam ações proibidas/irreversíveis (compra Stripe, exclusão de conta, OAuth, push real) **não foram executados** por política de segurança.

> Auditoria concluída com as ressalvas acima explicitadas. Sucesso reportado **somente** onde há evidência no ledger.

