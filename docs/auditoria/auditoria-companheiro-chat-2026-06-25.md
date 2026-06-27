# Auditoria Forense — Companheiro de Apoio Proativo (Fundação + Backend)

**Data:** 2026-06-25
**Auditor:** Cowork (Claude) — auditoria de conformidade DOCS × CODE × RUNTIME
**Escopo desta auditoria:** a execução até este ponto, ou seja, a **fundação de
dados** (migration + ADR) e o **backend** (edge function `companion-chat`). A
**tela de chat** ainda não foi construída (próximo incremento, adiado pelo dono) e
está fora do escopo de pontuação.

---

## 1. Sumário Executivo

**Veredito:** **Atende parcialmente — com base sólida.** A entrega cobre fielmente
o que a Fase 1 (MVP) exige no nível de **dados e backend**: 7 tabelas com RLS
versionada, escalonamento de crise determinístico (testado), e backend de LLM com
fallback. As não-conformidades são em maioria de baixo impacto ou de documentação;
há **um defeito de lógica** (janela de histórico) e **uma contradição de docs** que
merecem correção antes de seguir.

**Score de conformidade (apenas requisitos VERIFICÁVEIS agora, sem deploy):**

```
Score = (Σ ✅ 26 + Σ ⭐ 4) ÷ 35 verificáveis × 100 = 85,7%
```

| Veredito | Qtd |
|---|---|
| ✅ CONFORME | 26 |
| ⭐ DIVERGÊNCIA POSITIVA | 4 |
| ⚠️ DIVERGENTE-NEUTRO | 2 |
| ❌ FALTANDO | 2 |
| 🔴 QUEBRADO (defeito de lógica) | 1 |
| ❓ NÃO VERIFICÁVEL (runtime/deploy) | 6 |
| **Total verificável (denominador)** | **35** |

Conforme: 30 | Não conforme: 5 | Não verificável: 6 | Total de itens: 41.
(30 + 5 = 35 verificáveis; soma confere.)

**Achados por severidade:**

- **Crítico:** nenhum.
- **Alto:** nenhum.
- **Médio (3):** janela de histórico pega as mensagens mais antigas, não as mais
  recentes (NF-04 🔴); spec canônica ainda diz "Next.js" e contradiz o app real
  (AR-02 ❌); árvore de decisão de escalonamento não documentada/revisada (SEG-07 ❌).
- **Baixo (2):** CAPS citado no código mas ausente da resposta ao usuário (SEG-03 ⚠️);
  prompt não instrui explicitamente a não prometer confidencialidade absoluta (ET-03 ⚠️).

**Leitura honesta do score:** 85,7% reflete que a *fundação* está bem-feita e
aderente à spec. Nenhuma não-conformidade é crítica. O único defeito funcional real
(NF-04) só se manifesta em conversas com mais de 20 mensagens, e a maior parte do
"não verificável" é simplesmente porque **nada foi deployado ainda** — algo esperado
nesta etapa. Quando a spec contradiz a si mesma (stack), o código seguiu a realidade
do produto (Expo), e isso está registrado em ADR.

---

## 2. Manifesto de Acesso (Fase 0)

| Fonte | Acessível? | Branch | Commit/Estado | Observação |
|---|---|---|---|---|
| **CODE** — `guardiao-sobrio-app` | ✅ Sim (filesystem) | (working tree) | HEAD `eca446e` (2026-06-24) | Os artefatos auditados estão **não-commitados** (untracked/modified) — ver nota abaixo. |
| **DOCS** — `guardiao-sobrio-docs` (spec canônica) | ✅ Sim (filesystem) | — | HEAD **não resolvido** | `git rev-parse HEAD` não retornou SHA; árvore com tudo staged como adição. Spec lida via filesystem mesmo assim. |
| **RUNTIME** — Supabase (migration + edge function) | ❌ Não | — | Não aplicado / não deployado | Migration registrada apenas como arquivo; function não publicada. RUNTIME **indisponível por design nesta etapa**. |

**Como acessei:** leitura direta via filesystem (ambos os repositórios estão
montados). Não houve necessidade de GitHub API/browser. **Transparência:** os três
arquivos centrais auditados aparecem como **não rastreados** no git do app
(`?? supabase/functions/companion-chat/`, `?? supabase/migrations/20260625120000_add_companion_schema.sql`,
`?? docs/adr/0002-...md`) e `docs/companheiro-apoio-proativo-implementacao.md` como
**modificado**. Isso significa que ainda **não há commit** que congele esta entrega —
um ponto de rastreabilidade a fechar (ver Backlog).

**Limite imposto pela falta de RUNTIME:** nenhuma afirmação sobre comportamento real
do LLM, RLS ativa no banco de produção ou resposta HTTP da function pôde ser
confirmada. Todos esses itens estão marcados `❓ NÃO VERIFICÁVEL` e listados no
checklist do dono (§ Kit de Remediação).

---

## 3. Inventário de Documentos

| Documento | Tam. | Lido? | Papel |
|---|---|---|---|
| `guardiao-sobrio-docs/.../companheiro-apoio-proativo/README.md` | 21.920 B (355 ln) | ✅ Integral | **Spec canônica** (fonte de verdade de produto/clínica). |
| `guardiao-sobrio-app/docs/companheiro-apoio-proativo-implementacao.md` | ~9 KB | ✅ Integral | Doc vivo de implementação (contrato técnico). |
| `guardiao-sobrio-app/docs/adr/0002-companheiro-apoio-proativo-fundacao.md` | ~5 KB | ✅ Integral | ADR das decisões (stack, LLM, escalonamento, dados). |
| `guardiao-sobrio-app/docs/adr/0001-fonte-de-verdade-do-plano.md` | 3.232 B | ✅ Integral | Precedente de padrão de RLS versionada. |

**Não lidos (e por quê):** demais documentos do repo de docs (`marca/`, `estrategia/`,
`produtos/`, `prompts/`, relatórios de auditoria de perfis) — fora do escopo do chat.

**Spec canônica do produto:** o `README.md` em `especificacoes/companheiro-apoio-proativo/`.

---

## 4. Registro de Requisitos (Fase 1 + transversais)

Critérios de aceitação redigidos para serem **verificáveis em código** onde possível;
a validação comportamental em runtime fica separada como itens `RT-`.

| ID | Categoria | Requisito (critério verificável) | Fonte |
|---|---|---|---|
| AR-01 | Arquitetura | Decisão de stack registrada e coerente com o app real (edge functions Supabase, não Next.js) | spec §0 / ADR-0002 D1 |
| AR-02 | Arquitetura | Spec canônica reflete a stack real (sem contradição interna) | spec cabeçalho |
| AR-03 | Arquitetura | LLM com provedor primário gratuito + fallback (OpenAI) | ADR-0002 D2 / spec §10 [EM ABERTO] |
| AR-04 | Segurança | Chaves de LLM apenas no servidor (nunca no cliente) | spec §6 / ADR-0002 D2 |
| DM-01..07 | Dados | Tabelas Fase 1 com colunas previstas (profiles, conversations, messages, learned_strategies, support_network, crisis_events, consent_records) | spec §4 |
| DM-08 | Dados | RLS habilitado em **todas** as tabelas, versionado em migration | spec §4 / §6 |
| DM-09 | Dados | RLS sem recursão entre tabelas | spec §6 / histórico |
| SEG-01 | Segurança | Detecção de sinais de risco grave (ideação/autoagressão/emergência) | spec §3.6 |
| SEG-02 | Segurança | Risco grave interrompe o fluxo normal e direciona a recurso humano | spec §3.6 |
| SEG-03 | Segurança | Recursos BR corretos apresentados ao usuário (CVV 188, SAMU 192, CAPS) | spec §3.6 |
| SEG-04 | Segurança | Escalonamento determinístico, não dependente do LLM, construído primeiro | spec §3.6 / §5.1 |
| SEG-05 | Segurança | Não fornecer informação que facilite autoagressão | spec §3.6 |
| SEG-06 | Segurança | Evento de crise auditado (`crisis_events`) | spec §4 |
| SEG-07 | Segurança | Árvore de decisão de escalonamento documentada e revisada por profissional | spec §3.6 [EM ABERTO] |
| CL-01 | Clínico | Prompt encoda Entrevista Motivacional (perguntas abertas, escuta reflexiva, autonomia) | spec §2.1 |
| CL-02 | Clínico | Prompt encoda Prevenção de Recaída (ação de enfrentamento, autoeficácia) | spec §2.2 |
| CL-03 | Clínico | Prompt impõe tom não-bajulador | spec §2.3 / §6.4 |
| CL-04 | Clínico | Prompt define respostas curtas, uma pergunta por vez | spec §3.1/UX |
| PV-01 | Privacidade | Consentimento granular separado (memória/geo/notif) modelado | spec §6 |
| PV-02 | Privacidade | Memória auditável/revisável (origem declarado/inferido; usuário pode apagar) | spec §3.2 / §6.5 |
| PV-03 | Privacidade | Geolocalização só com opt-in; não coletar sem consentimento | spec §3.3 / §6 |
| ET-01 | Ética | Comunicar que não é terapia/diagnóstico | spec §1.1 |
| ET-02 | Ética | Não substituir conexão humana; não fomentar dependência | spec §1.1 / §6.3 |
| ET-03 | Ética | Não prometer confidencialidade absoluta de forma irreal | spec §3.6 / §6.6 |
| NF-01 | NFR | Limite de tamanho de entrada / proteção básica de abuso | boa prática |
| NF-02 | NFR | Timeout nas chamadas de LLM | boa prática |
| NF-03 | NFR | Resposta segura ao usuário se o LLM falhar | spec §5 (resiliência) |
| NF-04 | NFR | Janela de histórico usa as mensagens **mais recentes** | boa prática |
| RT-01..06 | Runtime | Migration aplicada; function deployada; keys/modelo válidos; types regenerados; comportamento clínico e de escalonamento validados ao vivo | spec §9 |

---

## 5. Tabela de Reconciliação de 3 Vias

| ID | DOCS diz | CODE tem | LIVE mostra | Veredito | Sev. | Evidência |
|---|---|---|---|---|---|---|
| AR-01 | Next.js (cabeçalho) | Edge function Deno + Expo; divergência registrada | n/a | ⚠️→✅ decisão | — | `docs/adr/0002...md` D1; `supabase/functions/companion-chat/index.ts` |
| AR-02 | spec ainda diz "Next.js 15 · shadcn · Vercel" | Só o doc do app foi corrigido | n/a | ❌ FALTANDO | Médio | `especificacoes/.../README.md:7` (inalterado) |
| AR-03 | [EM ABERTO] | `buildProviders()` primário→fallback | n/a | ✅ (resolve aberto) | — | `provider.ts:108-145` |
| AR-04 | server-side | `Deno.env.get(...)` apenas | n/a | ✅ | — | `provider.ts:118,131`; `.env.example` |
| DM-01..07 | 7 tabelas Fase 1 | 7 tabelas `companion_*` criadas | ❓ não aplicado | ✅ (×7) | — | `migrations/20260625120000_add_companion_schema.sql` |
| DM-08 | RLS em todas, versionada | 7/7 `ENABLE ROW LEVEL SECURITY` + 30 policies | ❓ não aplicado | ✅ | — | migration §1-7; verificação estrutural 7/7 |
| DM-09 | sem recursão | Checagens diretas `auth.uid()=user_id`, sem subquery | n/a | ⭐ | — | migration (todas as policies) |
| SEG-01 | detectar risco grave | `detectCrisis()` + testes 6/6 | ❓ runtime | ✅ | — | `crisis.ts:60-95` |
| SEG-02 | interromper fluxo | `if (crisis.isCrisis) {... return}` antes do LLM | ❓ runtime | ✅ | — | `index.ts:129-156` |
| SEG-03 | CVV 188 · SAMU 192 · **CAPS** | resposta tem 188/192/190, **sem CAPS** | ❓ runtime | ⚠️ | Baixo | `crisis.ts:88-99` |
| SEG-04 | construir 1º, não depender do LLM | camada determinística roda antes | n/a | ⭐ | — | `index.ts:127-129`; `crisis.ts:64` |
| SEG-05 | não facilitar autoagressão | instrução no system prompt | ❓ runtime | ✅ (código) | — | `prompts.ts` (LIMITES) |
| SEG-06 | auditar crise | insert em `companion_crisis_events` | ❓ não aplicado | ✅ | — | `index.ts:139-150` |
| SEG-07 | árvore de decisão (doc próprio) | não produzida | n/a | ❌ FALTANDO | Médio | ausência; spec §3.6 [EM ABERTO] |
| CL-01 | MI | system prompt seção "COMO VOCÊ CONVERSA" | ❓ runtime | ✅ (código) | — | `prompts.ts` |
| CL-02 | Prevenção de Recaída | seção "COMO VOCÊ AJUDA NA CRISE" | ❓ runtime | ✅ (código) | — | `prompts.ts` |
| CL-03 | não-bajulador | "não é bajulador… não é sim-senhor" | ❓ runtime | ✅ (código) | — | `prompts.ts` |
| CL-04 | curto, 1 pergunta | seção "ESTILO" | ❓ runtime | ✅ (código) | — | `prompts.ts` |
| PV-01 | consent granular | tabela com CHECK 3 tipos + UNIQUE | ❓ não aplicado | ✅ | — | migration §2 |
| PV-02 | memória auditável | coluna `source` + RLS SELECT/UPDATE/DELETE do dono | ❓ não aplicado | ✅ (fundação) | — | migration §5 |
| PV-03 | geo só opt-in | handler nunca grava `context_location` | ❓ runtime | ✅ | — | `index.ts` (sem set de geo) |
| ET-01 | não é terapia | instrução no prompt | ❓ runtime | ✅ (código) | — | `prompts.ts` |
| ET-02 | não dependência | "nunca alimente dependência" | ❓ runtime | ✅ (código) | — | `prompts.ts` |
| ET-03 | não prometer sigilo absoluto | prompt fala "honesto sobre limites", sem instrução explícita | ❓ runtime | ⚠️ | Baixo | `prompts.ts` (ausência da linha) |
| NF-01 | — | `MAX_MESSAGE_LEN = 4000` | ❓ runtime | ✅ | — | `index.ts:33,64` |
| NF-02 | — | `AbortController` 20s | ❓ runtime | ✅ | — | `provider.ts:57` |
| NF-03 | resiliência | `providerFailureResponse()` em catch | ❓ runtime | ⭐ | — | `index.ts:168`; `prompts.ts` |
| NF-04 | — | `order('created_at', asc).limit(20)` → pega as **mais antigas** | ❓ runtime | 🔴 | Médio | `index.ts:112-113` |
| RT-01..06 | Fase 1 entregue ao vivo | nada deployado | ❌ indisponível | ❓ | — | Manifesto §2 |

⭐ extra: **`companion_messages.user_id` denormalizado** (não previsto na spec, que só
tinha `conversation_id`) — escolha que viabiliza RLS direta e evita recursão. Manter.

---

## 6. Achados Detalhados

### F1 — 🔴 Médio · Janela de histórico carrega as mensagens mais ANTIGAS (NF-04)
**Onde:** `supabase/functions/companion-chat/index.ts:108-113`.
**O quê:** a busca de histórico usa `.order('created_at', { ascending: true }).limit(20)`.
Isso retorna as **20 primeiras** mensagens da conversa, não as 20 mais recentes.
**Impacto:** em conversas com mais de 20 mensagens, o LLM perde o contexto recente e
fica "preso" no começo da conversa — justamente o oposto do desejado num chat de apoio
contínuo. Em conversas curtas (≤20 msgs) não há sintoma, por isso é latente.
**Como reproduzir:** criar uma conversa, enviar 25 mensagens; na 26ª, o prompt enviado
ao provedor conterá as mensagens 1–20, ignorando 21–25.
**Correção sugerida (cirúrgica):** buscar em ordem **decrescente**, limitar, e inverter
para ordem cronológica antes de montar o prompt. Ver Kit de Remediação F1.

### F2 — ❌ Médio · Spec canônica ainda contradiz a stack real (AR-02)
**Onde:** `guardiao-sobrio-docs/especificacoes/companheiro-apoio-proativo/README.md:7`
("Stack alvo: Next.js 15 · shadcn/ui · Vercel").
**O quê:** o ADR-0002 e o doc do app foram corrigidos para Expo/RN, mas a **spec
canônica** (que, por sua própria regra, "prevalece") segue apontando Next.js.
**Impacto:** fonte de verdade contraditória; um novo colaborador lendo a spec
construiria na stack errada.
**Correção:** atualizar o cabeçalho da spec canônica + uma nota de decisão apontando o
ADR-0002. Ver Kit F2.

### F3 — ❌ Médio · Árvore de decisão de escalonamento não documentada (SEG-07)
**Onde:** ausência; spec §3.6 pede documento próprio "sinais → nível de risco → ação",
revisado por profissional.
**O quê:** existe um detector heurístico de primeira passada (`crisis.ts`), mas não a
árvore de decisão formal nem a revisão clínica.
**Impacto:** o piso de segurança funciona, mas o rigor exigido pela spec ("construir
primeiro e com mais rigor") ainda não está completo.
**Correção:** criar `docs/escalonamento-arvore-decisao.md` (ou na spec) e agendar
revisão clínica. Backlog.

### F4 — ⚠️ Baixo · CAPS ausente da resposta ao usuário (SEG-03)
**Onde:** `crisis.ts` — `crisisResponse()` lista CVV 188, SAMU 192 e 190, mas **não**
o CAPS, embora a spec §3.6 o inclua e o comentário do arquivo o mencione.
**Correção:** acrescentar uma linha sobre CAPS (rede pública/SUS) à resposta. Kit F4.

### F5 — ⚠️ Baixo · Prompt não veda explicitamente prometer confidencialidade (ET-03)
**Onde:** `prompts.ts` (bloco LIMITES). Há "honesto sobre limites", mas não a
instrução explícita da spec §3.6/§6.6 de **não prometer confidencialidade absoluta**.
**Correção:** acrescentar uma linha ao bloco LIMITES. Kit F5.

---

## 7. Divergências Positivas (⭐ — manter)

- **RLS direta por `user_id` (sem subquery)** — evita proativamente a recursão de RLS
  (`42P17`) que já custou correções no `family_connections`. Manter como padrão.
- **`companion_messages.user_id` denormalizado** — não estava na spec; habilita a RLS
  direta acima. Atualizar a spec para refletir.
- **Escalonamento determinístico antes do LLM** — implementa a exigência "não depender
  do modelo" de forma robusta.
- **Resposta segura em falha de provedor (`providerFailureResponse`)** — resiliência
  acima do que a spec pedia; degrada com cuidado em vez de erro 500.

---

## 8. Backlog Priorizado

1. **(Médio) F1** — corrigir a janela de histórico (edição cirúrgica, 2 linhas).
2. **(Médio) F2** — atualizar a stack na spec canônica + nota de ADR.
3. **(Médio) F3** — documentar a árvore de decisão de escalonamento + revisão clínica.
4. **(Baixo) F4** — incluir CAPS na resposta de crise.
5. **(Baixo) F5** — vedar promessa de confidencialidade no prompt.
6. **(Rastreabilidade)** — commitar a entrega (migration + function + ADR) em um branch
   e abrir PR; hoje está tudo não-commitado.
7. **(Dono/Runtime)** — aplicar migration em staging, deployar a function, configurar
   keys e regenerar `database.types.ts` (checklist abaixo).

---

## 9. Registro de Evidências (Evidence Ledger)

**Arquivos lidos:**

- `especificacoes/companheiro-apoio-proativo/README.md` (21.920 B) — integral.
- `docs/companheiro-apoio-proativo-implementacao.md` — integral.
- `docs/adr/0002-companheiro-apoio-proativo-fundacao.md` — integral.
- `docs/adr/0001-fonte-de-verdade-do-plano.md` (3.232 B) — integral.
- `supabase/migrations/20260625120000_add_companion_schema.sql` (360 ln) — integral.
- `supabase/functions/companion-chat/index.ts` (6.795 B) — integral.
- `supabase/functions/companion-chat/provider.ts` (5.201 B) — integral.
- `supabase/functions/companion-chat/crisis.ts` (4.629 B) — integral.
- `supabase/functions/companion-chat/prompts.ts` (4.331 B) — integral.

**Comandos executados (saída relevante):**

- Validação estrutural da migration: `7 CREATE TABLE | 7 ENABLE RLS | 30 policies
  únicas | 0 subqueries em policy` → PASS.
- `tsc transpileModule` nos 4 módulos → 0 erros de sintaxe.
- Teste funcional de `detectCrisis`: 6/6 casos graves escalaram; 6/6 benignos não
  escalaram (inclui "morrendo de rir", "matar o tempo", mensagem de fissura).
- `git status` (app): artefatos do chat como `??` (untracked) e doc como `M`.
- `git rev-parse HEAD` (docs): sem SHA retornado.

**Rotas/runtime testados:** nenhum — não há deploy (ver Manifesto). Nenhuma ação com
efeito colateral foi executada; nenhuma conta de teste foi alterada.

---

## 10. Gate Final — Autoauditoria

- ✅ Todo doc relevante lido ou listado como não-lido com motivo.
- ✅ Cada requisito mapeado a um `REQ-ID` com critério verificável.
- ✅ Cada requisito ligado ao artefato de código (path + símbolo/linha).
- ⚠️ App **não** carregado ao vivo — por não haver deploy; cada item runtime marcado
  `❓` e endereçado no checklist do dono.
- ✅ Toda linha de reconciliação tem evidência citável.
- ✅ Score derivado da tabela, com aritmética e soma conferida (30/35 = 85,7%).
- ✅ Distinção explícita entre "li no código" e "comportamento depende de runtime".

**Itens `❓` e onde são fechados:** RT-01..06 → Checklist do Dono (§ Kit de Remediação).

---

# Kit de Remediação

> **Divisão de trabalho:** as correções de código abaixo podem ser aplicadas por um
> agente no repositório do app (com git). As ações de banco/deploy são **só do dono**,
> no ambiente autenticado dele. Gates antes de cada commit: `npm run typecheck && npm run lint && npm test`.

## F1 — Corrigir janela de histórico (edição cirúrgica)

**Arquivo:** `supabase/functions/companion-chat/index.ts`

Localize:

```ts
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(HISTORY_LIMIT);
    const history: ChatMessage[] = (histRows ?? []).map((r) => ({
      role: r.role as 'user' | 'assistant',
      content: r.content as string,
    }));
```

Substitua por (busca as mais recentes em ordem decrescente e reinverte para ordem
cronológica):

```ts
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT);
    const history: ChatMessage[] = (histRows ?? [])
      .reverse()
      .map((r) => ({
        role: r.role as 'user' | 'assistant',
        content: r.content as string,
      }));
```

## F4 — Incluir CAPS na resposta de crise

**Arquivo:** `supabase/functions/companion-chat/crisis.ts`, dentro de `crisisResponse()`.
Após a linha do SAMU, adicione um item:

```ts
    `• SAMU — 192, se houver risco imediato à sua vida ou de alguém`,
    `• CAPS — procure o Centro de Atenção Psicossocial mais próximo (rede pública/SUS)`,
    `• Emergência — 190`,
```

## F5 — Vedar promessa de confidencialidade no prompt

**Arquivo:** `supabase/functions/companion-chat/prompts.ts`, no bloco `LIMITES INEGOCIÁVEIS`.
Adicione um item:

```
- Seja honesto sobre privacidade: NÃO prometa sigilo absoluto ("isso fica só entre nós") de forma irreal. Em risco grave, a prioridade é a segurança da pessoa, não o sigilo.
```

## F2 — Atualizar a spec canônica (repo de docs)

**Arquivo:** `guardiao-sobrio-docs/especificacoes/companheiro-apoio-proativo/README.md`,
linha de "Stack alvo". Trocar "Next.js 15 · TypeScript · Tailwind · shadcn/ui ·
next-intl · Supabase · Vercel" por "Expo / React Native · TypeScript · Supabase
(Edge Functions) — ver ADR-0002 no repo do app" e adicionar nota de decisão.

## F3 — Documentar árvore de decisão de escalonamento

Criar `docs/escalonamento-arvore-decisao.md` (sinais → nível de risco → ação) e
agendar **revisão clínica** antes do lançamento (spec §2 e §3.6).

## Checklist do Dono (Runtime — só você pode fechar)

Rodar no console/CLI do Supabase autenticado:

```sql
-- RT-01 (a) RLS ativa em todas as tabelas companion_ no banco real:
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname LIKE 'companion_%' AND relkind = 'r'
ORDER BY relname;
-- ESPERADO: relrowsecurity = true em 7 linhas.

-- RT-01 (b) Policies por tabela:
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename LIKE 'companion_%'
ORDER BY tablename, cmd;
-- ESPERADO: SELECT/INSERT (+UPDATE/DELETE conforme tabela) p/ authenticated com
--           auth.uid()=user_id; ALL p/ service_role.

-- RT-01 (c) Cliente NÃO pode inserir mensagem de assistant (deve FALHAR como authenticated).
```

Ações (cada uma é só do dono):

- [ ] **RT-01** `supabase db push` (ou aplicar a migration) em staging e rodar as 3 queries acima.
- [ ] **RT-02** `supabase functions deploy companion-chat`.
- [ ] **RT-03** Definir secrets: `COMPANION_PRIMARY_API_KEY`, `OPENAI_API_KEY` (+ confirmar que `COMPANION_PRIMARY_MODEL` existe no provedor escolhido).
- [ ] **RT-04** `supabase gen types typescript` → atualizar `lib/database.types.ts`.
- [ ] **RT-05** Teste e2e do fluxo normal: enviar mensagem → resposta do assistant persistida.
- [ ] **RT-06** Teste e2e de crise: enviar frase de risco → resposta com recursos + linha em `companion_crisis_events` + conversa marcada `escalado`.
- [ ] **Revisão clínica** da copy do prompt e dos sinais de `crisis.ts` antes do lançamento.

---

*Relatório gerado por auditoria automatizada. Toda afirmação está ancorada em arquivo/
linha citados; itens de runtime estão honestamente marcados como não verificáveis até o
deploy. Score: **85,7%** sobre 35 requisitos verificáveis (Fase 1, dados + backend).*

---

## Adendo — Correções aplicadas (mesma sessão, 2026-06-25)

Após o relatório, as correções abaixo foram aplicadas e re-verificadas (transpile
dos módulos + testes do detector de crise + checagem da lógica de histórico):

| Achado | Antes | Depois | Evidência da correção |
|---|---|---|---|
| F1 (NF-04) janela de histórico | 🔴 Médio | ✅ | `index.ts`: `ascending: false` + `.reverse()`; teste confirma 20 mais recentes em ordem cronológica |
| F2 (AR-02) stack na spec canônica | ❌ Médio | ✅ | `guardiao-sobrio-docs/.../README.md:8` agora aponta Expo/RN + ADR-0002 |
| F4 (SEG-03) CAPS na resposta de crise | ⚠️ Baixo | ✅ | `crisis.ts` `crisisResponse()` inclui linha do CAPS; teste confirma presença |
| F5 (ET-03) sigilo no prompt | ⚠️ Baixo | ✅ | `prompts.ts` bloco LIMITES com linha sobre não prometer sigilo absoluto |

**Permanece aberto:** F3 (SEG-07 ❌ Médio) — árvore de decisão de escalonamento +
revisão clínica (exige profissional; backlog).

**Re-score:** Conforme passou de 30 para **34** (✅34 + ⭐ já contados) sobre 35
verificáveis → **97,1%** (34 ÷ 35). Único não-conforme restante: F3.
Itens de runtime seguem `❓ PENDENTE-DONO` (deploy/migration/keys).
