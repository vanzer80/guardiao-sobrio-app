# ADR-0002 — Fundação Técnica do Companheiro de Apoio Proativo

**Data:** 2026-06-25
**Status:** Aceito (Fase 1 — fundação de dados)
**Contexto:** Implantação do chat conversacional (Companheiro de Apoio Proativo) no app.

- Spec canônica: `guardiao-sobrio-docs/especificacoes/companheiro-apoio-proativo/README.md`
- Doc vivo de implementação: `docs/companheiro-apoio-proativo-implementacao.md`

---

## Contexto

Vamos implantar o **Companheiro de Apoio Proativo**: um chat de apoio para o momento de
fissura (craving) e sua prevenção, baseado em Entrevista Motivacional + Prevenção de
Recaída, com **escalonamento de crise** (CVV 188 / SAMU 192 / CAPS) como prioridade máxima.

Ao iniciar a implementação surgiram quatro decisões que precisam ficar registradas porque
afetam todo o resto da feature e porque o público é vulnerável (custo de errar é alto).

## Decisões

### D1 — Stack alvo: Expo / React Native (e **não** Next.js)

A spec canônica e o doc de implementação citavam "Next.js 15 · shadcn/ui · Vercel". O
produto real onde os usuários vivem é o app **Expo / React Native** (`expo-router`,
Supabase, NativeWind, Zustand). Não existe app web separado.

**Decisão:** implementar o Companheiro dentro do app Expo existente, com mudanças
**aditivas** que não alteram fluxos atuais. O backend conversacional roda como **Supabase
Edge Function** (mesma stack de `create-checkout-session`, `handle-stripe-webhooks` etc.),
não como rota Next.js.

**Racional:** menor delta, zero risco de regressão no app atual, reuso da infra Supabase já
existente. A spec será corrigida no doc vivo (a spec canônica prevalece para *produto*; este
ADR prevalece para *stack de implementação*).

### D2 — LLM: provedor gratuito primário + OpenAI como fallback (abstração de provedor)

A spec deixou o modelo **[EM ABERTO]**.

**Decisão:** introduzir uma camada de abstração de provedor (`ChatProvider`) com:
1. **Primário:** um provedor de LLM com tier gratuito (ex.: Groq / Google Gemini /
   OpenRouter free — a escolher na implementação da edge function).
2. **Fallback:** **OpenAI**, acionado quando o primário falha, atinge rate limit ou degrada.

O provedor concreto fica atrás de uma interface única; trocar de provedor não toca a UI nem
o schema. Chaves de API ficam **apenas** no ambiente da edge function (nunca no cliente).

**Racional:** controla custo no início (gratuito) sem abrir mão de confiabilidade (fallback
pago). A abstração evita lock-in e permite avaliar tom clínico/acolhedor entre provedores.

⚠️ **Restrições que valem para qualquer provedor:** a etapa de extração de memória **não pode
fabricar atributos**; o system-prompt deve impor o tom (acolhedor, não-bajulador, honesto
sobre limites) e o protocolo de escalonamento.

### D3 — Escalonamento de crise é a feature técnica nº 1

Conforme §5 da spec: construir **primeiro** a detecção de sinais de risco grave →
encaminhamento imediato (CVV 188 / SAMU 192 / CAPS). A tabela `companion_crisis_events`
existe desde a Fase 1 para auditoria, mesmo antes do motor proativo.

### D4 — Dados: aditivo, isolado e com RLS versionada desde o dia 1

- **Prefixo `companion_`** em todas as tabelas novas, para isolar a feature e evitar colisão
  (`messages`, `conversations` são nomes genéricos demais).
- **Identidade (Camada 1) em `companion_profiles` (1:1 com o usuário)** em vez de adicionar
  colunas em `profiles`. Mantém a feature autocontida e **não toca a tabela core** — ponto
  decisivo para "não quebrar o estado atual do app".
- **RLS versionada em migration, não só no dashboard** (lição do DRIFT documentado no
  ADR-0001 e nas auditorias).
- **`user_id` denormalizado** em todas as tabelas-filhas, com policies diretas
  `auth.uid() = user_id`. Evita políticas com subquery recursiva — o repo já corrigiu
  recursão de RLS em `family_connections` (migration `20260621170000`).
- **`service_role` full** nas tabelas que a edge function escreve (mensagens do assistant,
  memória extraída, eventos de crise).
- **Consentimento granular** (`companion_consent_records`): memória, geolocalização e
  notificações proativas são consentimentos **separados**.
- **Auditabilidade da memória**: `companion_learned_strategies.source` distingue
  `declarado` de `inferido`; o usuário pode ver e apagar.

## Escopo por fase (alinhado à spec §6)

- **Fase 1 (esta migration):** `companion_profiles`, `companion_consent_records`,
  `companion_conversations`, `companion_messages`, `companion_learned_strategies`,
  `companion_support_network`, `companion_crisis_events` + RLS versionada.
- **Fase 2:** captura passiva auditável + histórico visível + consentimento granular completo.
- **Fase 3 (adiada):** `companion_patterns` (Camada 3) + `companion_proactive_notifications`
  com salvaguardas. **Não criadas agora** de propósito.

## Consequências

- O app passa a ter o esquema de dados do chat sem qualquer alteração nos fluxos atuais.
- Próximos incrementos: (a) edge function com a abstração de provedor (D2) + system-prompt e
  protocolo de escalonamento (D3); (b) tela de chat no app (nova rota, aditiva).
- `lib/database.types.ts` precisará ser regenerado após o apply para tipar as novas tabelas.
- **Pendente-dono:** aplicar a migration em staging e validar as policies RLS (bloco de
  verificação incluído no arquivo da migration).

## Referências

- `supabase/migrations/20260625120000_add_companion_schema.sql`
- `docs/companheiro-apoio-proativo-implementacao.md`
- `guardiao-sobrio-docs/especificacoes/companheiro-apoio-proativo/README.md`
- ADR-0001 (`docs/adr/0001-fonte-de-verdade-do-plano.md`) — lição de RLS versionada
- `supabase/migrations/20260621170000_fix_family_connections_rls_recursion.sql` — recursão RLS
