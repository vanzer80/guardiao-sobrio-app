-- =============================================================================
-- Companheiro de Apoio Proativo — Fundação de dados (Fase 1 / MVP)
-- ADR-0002 — 2026-06-25
-- =============================================================================
--
-- Contexto
-- --------
-- Esquema de dados do chat conversacional (Companheiro de Apoio Proativo).
-- Decisões registradas em docs/adr/0002-companheiro-apoio-proativo-fundacao.md
-- e spec canônica em guardiao-sobrio-docs/especificacoes/companheiro-apoio-proativo.
--
-- Princípios desta migration (todos por decisão de ADR):
--   * 100% ADITIVA — não altera nenhuma tabela ou fluxo existente.
--   * Prefixo `companion_` em tudo, para isolar a feature.
--   * Identidade (Camada 1) em companion_profiles (1:1), sem tocar em `profiles`.
--   * RLS habilitado em TODAS as tabelas, versionado aqui (não só no dashboard).
--   * `user_id` denormalizado em todas as tabelas-filhas → policies diretas
--     `auth.uid() = user_id`, SEM subquery (evita a recursão de RLS já vista em
--     family_connections, migration 20260621170000).
--   * service_role full nas tabelas que a edge function escreve.
--   * Idempotente: IF NOT EXISTS nas tabelas/índices; DROP POLICY IF EXISTS +
--     CREATE nas policies.
--
-- Fora de escopo (Fase 3, NÃO criadas de propósito):
--   companion_patterns, companion_proactive_notifications.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Função utilitária: touch updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.companion_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 1. companion_profiles — Camada 1 (identidade). TUDO nullable (nada obrigatório).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companion_profiles (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT,                 -- como a pessoa quer ser chamada
  age_range         TEXT,                 -- faixa etária (menos invasivo que idade exata)
  primary_substance TEXT,                 -- álcool / outra
  onboarding_done   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.companion_profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_companion_profiles_touch ON public.companion_profiles;
CREATE TRIGGER trg_companion_profiles_touch
  BEFORE UPDATE ON public.companion_profiles
  FOR EACH ROW EXECUTE FUNCTION public.companion_touch_updated_at();

DROP POLICY IF EXISTS "cp_select_own" ON public.companion_profiles;
CREATE POLICY "cp_select_own" ON public.companion_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cp_insert_own" ON public.companion_profiles;
CREATE POLICY "cp_insert_own" ON public.companion_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cp_update_own" ON public.companion_profiles;
CREATE POLICY "cp_update_own" ON public.companion_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cp_delete_own" ON public.companion_profiles;
CREATE POLICY "cp_delete_own" ON public.companion_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cp_service_all" ON public.companion_profiles;
CREATE POLICY "cp_service_all" ON public.companion_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 2. companion_consent_records — consentimento granular (memória / geo / notif)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companion_consent_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL
               CHECK (consent_type IN ('memoria','geolocalizacao','notif_proativa')),
  granted      BOOLEAN NOT NULL,
  granted_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_companion_consent_user
  ON public.companion_consent_records(user_id);

ALTER TABLE public.companion_consent_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ccr_select_own" ON public.companion_consent_records;
CREATE POLICY "ccr_select_own" ON public.companion_consent_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ccr_insert_own" ON public.companion_consent_records;
CREATE POLICY "ccr_insert_own" ON public.companion_consent_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ccr_update_own" ON public.companion_consent_records;
CREATE POLICY "ccr_update_own" ON public.companion_consent_records
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ccr_service_all" ON public.companion_consent_records;
CREATE POLICY "ccr_service_all" ON public.companion_consent_records
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 3. companion_conversations — cada sessão de conversa
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companion_conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  context_time     TIME,                  -- horário (sinal para padrões — Fase 3)
  context_location TEXT,                  -- SÓ se consentido (geolocalizacao)
  trigger_type     TEXT,
  crisis_level     INT,                   -- escala interna de severidade
  outcome          TEXT
                   CHECK (outcome IS NULL OR outcome IN
                         ('resolvido','escalado','recaida','desconhecido')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_conversations_user
  ON public.companion_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_conversations_user_started
  ON public.companion_conversations(user_id, started_at DESC);

ALTER TABLE public.companion_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cc_select_own" ON public.companion_conversations;
CREATE POLICY "cc_select_own" ON public.companion_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cc_insert_own" ON public.companion_conversations;
CREATE POLICY "cc_insert_own" ON public.companion_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cc_update_own" ON public.companion_conversations;
CREATE POLICY "cc_update_own" ON public.companion_conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cc_delete_own" ON public.companion_conversations;
CREATE POLICY "cc_delete_own" ON public.companion_conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cc_service_all" ON public.companion_conversations;
CREATE POLICY "cc_service_all" ON public.companion_conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 4. companion_messages — mensagens (user_id denormalizado p/ RLS direto)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companion_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.companion_conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_messages_conversation
  ON public.companion_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_companion_messages_user
  ON public.companion_messages(user_id);

ALTER TABLE public.companion_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário lê suas mensagens. INSERT direto pelo usuário só para role 'user'
-- (mensagens de assistant/system são escritas pela edge function via service_role).
DROP POLICY IF EXISTS "cm_select_own" ON public.companion_messages;
CREATE POLICY "cm_select_own" ON public.companion_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cm_insert_own_user_role" ON public.companion_messages;
CREATE POLICY "cm_insert_own_user_role" ON public.companion_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'user');

DROP POLICY IF EXISTS "cm_delete_own" ON public.companion_messages;
CREATE POLICY "cm_delete_own" ON public.companion_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cm_service_all" ON public.companion_messages;
CREATE POLICY "cm_service_all" ON public.companion_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 5. companion_learned_strategies — Camada 2 (o que funciona). Auditável.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companion_learned_strategies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                TEXT,                -- caminhada | ligar | distracao | ...
  description         TEXT,
  effectiveness_score NUMERIC,            -- atualizado pela validação
  times_used          INT NOT NULL DEFAULT 0,
  last_used_at        TIMESTAMPTZ,
  source              TEXT NOT NULL DEFAULT 'declarado'
                      CHECK (source IN ('declarado','inferido')),  -- auditabilidade
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_strategies_user
  ON public.companion_learned_strategies(user_id);

ALTER TABLE public.companion_learned_strategies ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_companion_strategies_touch ON public.companion_learned_strategies;
CREATE TRIGGER trg_companion_strategies_touch
  BEFORE UPDATE ON public.companion_learned_strategies
  FOR EACH ROW EXECUTE FUNCTION public.companion_touch_updated_at();

-- Usuário pode VER, EDITAR e APAGAR tudo que foi aprendido sobre ele (revisável).
DROP POLICY IF EXISTS "cls_select_own" ON public.companion_learned_strategies;
CREATE POLICY "cls_select_own" ON public.companion_learned_strategies
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cls_insert_own" ON public.companion_learned_strategies;
CREATE POLICY "cls_insert_own" ON public.companion_learned_strategies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cls_update_own" ON public.companion_learned_strategies;
CREATE POLICY "cls_update_own" ON public.companion_learned_strategies
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cls_delete_own" ON public.companion_learned_strategies;
CREATE POLICY "cls_delete_own" ON public.companion_learned_strategies
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cls_service_all" ON public.companion_learned_strategies;
CREATE POLICY "cls_service_all" ON public.companion_learned_strategies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 6. companion_support_network — rede de apoio (DADO SENSÍVEL)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companion_support_network (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  relationship TEXT,
  can_contact  BOOLEAN NOT NULL DEFAULT FALSE,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_support_user
  ON public.companion_support_network(user_id);

ALTER TABLE public.companion_support_network ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_companion_support_touch ON public.companion_support_network;
CREATE TRIGGER trg_companion_support_touch
  BEFORE UPDATE ON public.companion_support_network
  FOR EACH ROW EXECUTE FUNCTION public.companion_touch_updated_at();

DROP POLICY IF EXISTS "csn_select_own" ON public.companion_support_network;
CREATE POLICY "csn_select_own" ON public.companion_support_network
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "csn_insert_own" ON public.companion_support_network;
CREATE POLICY "csn_insert_own" ON public.companion_support_network
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "csn_update_own" ON public.companion_support_network;
CREATE POLICY "csn_update_own" ON public.companion_support_network
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "csn_delete_own" ON public.companion_support_network;
CREATE POLICY "csn_delete_own" ON public.companion_support_network
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "csn_service_all" ON public.companion_support_network;
CREATE POLICY "csn_service_all" ON public.companion_support_network
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 7. companion_crisis_events — escalonamento (FEATURE TÉCNICA Nº 1 / auditoria)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companion_crisis_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.companion_conversations(id) ON DELETE SET NULL,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity        TEXT,
  action_taken    TEXT,                   -- recurso direcionado (CVV 188 / SAMU 192 / CAPS)
  resolved        BOOLEAN,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_crisis_user
  ON public.companion_crisis_events(user_id);
CREATE INDEX IF NOT EXISTS idx_companion_crisis_detected
  ON public.companion_crisis_events(detected_at DESC);

ALTER TABLE public.companion_crisis_events ENABLE ROW LEVEL SECURITY;

-- Usuário lê seus próprios eventos; a edge function (service_role) detecta e grava.
DROP POLICY IF EXISTS "cce_select_own" ON public.companion_crisis_events;
CREATE POLICY "cce_select_own" ON public.companion_crisis_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cce_service_all" ON public.companion_crisis_events;
CREATE POLICY "cce_service_all" ON public.companion_crisis_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- GRANTs — expor à Data API (RLS continua sendo a barreira de autorização)
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_profiles            TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.companion_consent_records     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_conversations       TO authenticated;
GRANT SELECT, INSERT, DELETE         ON public.companion_messages            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_learned_strategies  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_support_network     TO authenticated;
GRANT SELECT                         ON public.companion_crisis_events       TO authenticated;

-- =============================================================================
-- Verificação pós-apply (rodar manualmente em staging — PENDENTE-DONO):
--
--   -- (a) Toda tabela companion_ tem RLS habilitado:
--   SELECT relname, relrowsecurity
--   FROM pg_class
--   WHERE relname LIKE 'companion_%' AND relkind = 'r'
--   ORDER BY relname;
--   -- Esperado: relrowsecurity = true em todas.
--
--   -- (b) Policies por tabela:
--   SELECT tablename, policyname, cmd, roles
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename LIKE 'companion_%'
--   ORDER BY tablename, cmd;
--   -- Esperado: SELECT/INSERT (+UPDATE/DELETE conforme tabela) p/ authenticated
--   --           usando auth.uid() = user_id; e ALL p/ service_role.
--
--   -- (c) Nenhuma escrita de mensagem assistant/system pelo cliente:
--   --     tentar INSERT com role='assistant' como authenticated → deve FALHAR.
-- =============================================================================
