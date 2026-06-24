# Companheiro de Apoio Proativo — Referência de Implementação

> **Este documento é o companheiro técnico que vive junto do código.**
> A especificação completa (visão de produto, fundamentação clínica, UX, copy, privacidade e roadmap detalhado) é **canônica** e vive no repositório de docs:
> 📄 **Spec canônica:** `https://github.com/vanzer80/guardiao-sobrio-docs` → `especificacoes/companheiro-apoio-proativo/README.md`
>
> Se houver divergência entre este arquivo e a spec canônica, **a spec canônica prevalece**. Atualize o link acima caso o local no repo de docs seja diferente.

| | |
|---|---|
| **Versão** | 0.1 (rascunho — documento vivo) |
| **Status** | Em definição. Nada fechado; refinável e escalável por fases. |
| **Escopo deste arquivo** | Contrato técnico de implementação (arquitetura + dados + decisões). O "porquê" de produto/clínico está na spec canônica. |
| **Stack** | Next.js 15 · TypeScript · Tailwind · shadcn/ui · next-intl · Supabase · Vercel |

---

## 1. O que estamos construindo (resumo de 1 parágrafo)

Um companheiro de apoio conversacional para o momento de fissura e para a **prevenção** dele. Diferencial: **aprende com o usuário ao longo da jornada** e age de forma **proativa**, antecipando momentos de risco. Tom: acolhedor, sem pressão e **sem ser bajulador** — apoia de verdade e oferece ações concretas. Detalhes de produto e clínicos: ver spec canônica.

---

## 2. Loop do produto (arquitetura de alto nível)

```
Onboarding leve  →  Interação na crise (reativa)  →  Captura de aprendizado
        ↑                                                      ↓
   Validação  ←  Notificação preventiva  ←  Detecção de padrões (proativa)
```

Blocos (detalhados na spec canônica):
1. **Onboarding leve** — 3–5 min, tudo opcional, sem formulário gigante.
2. **Memória em 3 camadas** — (1) identidade, (2) o que funciona, (3) padrões.
3. **Motor de detecção de padrões** — temporais, geográficos/contextuais, situacionais; cada um com nível de confiança.
4. **Proatividade** — notificações preventivas antes da janela de risco.
5. **Validação anti-falso-positivo** — inferência passiva + check-in ativo gentil.
6. **Escalonamento de crise** — prioridade máxima; recursos BR (CVV 188, SAMU 192, CAPS).

---

## 3. Modelo de dados (Supabase) — esboço inicial

**Todas as colunas de perfil são nullable** (nada obrigatório). **RLS obrigatório em todas as tabelas**, no padrão já adotado no Guardião Sóbrio, **versionado em migrations** (ver §4).

```
user_profiles
  user_id (PK, FK auth.users)
  display_name        text null
  age_range           text null
  primary_substance   text null
  created_at, updated_at

conversations            -- cada sessão de conversa
  id (PK)
  user_id (FK)
  started_at, ended_at
  context_time         time null      -- horário (para padrões)
  context_location     text null      -- só se consentido
  trigger_type         text null
  crisis_level         int null       -- escala interna de severidade
  outcome              text null      -- resolvido | escalado | recaída | desconhecido

messages
  id (PK)
  conversation_id (FK)
  role                 text           -- user | assistant | system
  content              text
  created_at

learned_strategies       -- Camada 2: o que funciona
  id (PK)
  user_id (FK)
  type                 text           -- caminhada | ligar | distração | ...
  description          text
  effectiveness_score  numeric        -- atualizado pela validação
  times_used           int
  last_used_at         timestamptz
  source               text           -- declarado | inferido (auditabilidade)

support_network          -- pessoas de apoio (SENSÍVEL)
  id (PK)
  user_id (FK)
  name                 text
  relationship         text null
  can_contact          bool
  notes                text null

patterns                 -- Camada 3: padrões derivados
  id (PK)
  user_id (FK)
  pattern_type         text           -- temporal | local | situacional
  value                jsonb          -- ex.: { "hora": "17:00", "dias": ["sab","dom"] }
  confidence           numeric
  frequency            int
  active               bool           -- usuário pode desativar

proactive_notifications  -- log dos lembretes preventivos
  id (PK)
  user_id (FK)
  pattern_id (FK)
  sent_at
  user_response        text null
  validated_outcome    text null      -- preenchido pela validação ativa
  was_helpful          bool null

crisis_events            -- eventos de risco grave (auditoria + segurança)
  id (PK)
  user_id (FK)
  detected_at
  severity             text
  action_taken         text           -- recurso direcionado
  resolved             bool null

consent_records          -- consentimento granular
  id (PK)
  user_id (FK)
  consent_type         text           -- memoria | geolocalizacao | notif_proativa | ...
  granted              bool
  granted_at, revoked_at
```

---

## 4. Decisões e restrições técnicas

- **RLS versionado em migrations, não só no dashboard.** ⚠️ No histórico do Guardião, políticas aplicadas só pelo dashboard ficaram inauditáveis. Aqui, padronizar RLS em migration desde o dia 1.
- **Consentimento granular** (`consent_records`): memória, geolocalização e notificações proativas são consentimentos **separados**.
- **Captura passiva de memória (Camada 2) deve ser auditável e revisável pelo usuário** — nada de inferir e guardar dado sensível silenciosamente. Coluna `source` distingue `declarado` de `inferido`.
- **Geolocalização** só com opt-in explícito e granular; minimizar coleta.
- **LLM:** definir modelo e estratégia de prompt para (a) condução da conversa e (b) extração estruturada de memória. ⚠️ A extração não pode fabricar atributos.

---

## 5. Segurança técnica (pontos que tocam o código)

1. **Escalonamento de crise = feature técnica nº 1.** Construir primeiro, com detecção de sinais de risco grave → ação imediata de encaminhamento (CVV 188 / SAMU 192 / CAPS). Verificar e manter os recursos atualizados.
2. **Reatividade ao gatilho** ⚠️: o lembrete preventivo, mal calibrado, pode virar o próprio gatilho. Requer validação clínica + testes. A copy foca em *planejar ação positiva*, não em nomear o craving cru. Frequência controlada (anti-fadiga de notificação) e desligável a qualquer momento.
3. **Não fomentar dependência do bot** — é ponte para recuperação e rede humana, não substituto.
4. **Honestidade sobre limites** — não é terapia nem diagnóstico; não prometer confidencialidade absoluta de forma irreal.

---

## 6. Entrega por fases

- **Fase 1 (MVP):** onboarding opcional · chat de crise reativo (MI + Prevenção de Recaída) · **escalonamento** · memória básica · RLS versionado.
- **Fase 2:** captura passiva auditável (Camada 2) · histórico visível · consentimento granular completo.
- **Fase 3:** motor de padrões (Camada 3) · notificações preventivas (com salvaguardas) · validação ativa.
- **Fase 4:** journaling/reflexão · refinamento com dados reais · features avançadas.

---

## 7. Dúvidas técnicas em aberto

- Limiar de confiança inicial para acionar proatividade (N ocorrências / janela de X dias).
- Mix de notificação: push vs. in-app.
- Árvore de decisão detalhada do escalonamento (merece documento próprio na spec canônica).
- Modelo de LLM + estratégia de prompt (condução + extração de memória).
- Requisitos de LGPD para dado de saúde — validar com jurídico/compliance.

---

*Para tudo que for produto, clínica, UX, copy e privacidade em detalhe, consulte a spec canônica no repo de docs. Documento vivo — atualizar versão e changelog a cada revisão.*
