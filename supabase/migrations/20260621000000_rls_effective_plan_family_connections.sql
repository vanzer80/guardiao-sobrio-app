-- =============================================================================
-- Patch RLS family_connections — effective_plan + defense-in-depth
-- Rodada 3 de diagnóstico — 2026-06-21
-- =============================================================================
--
-- Contexto
-- --------
-- Achado 1 da auditoria: INSERT em family_connections falhava com "column
-- invitation_expires_at does not exist" porque a migration 20260619210313
-- foi registrada em schema_migrations mas nunca executada no banco.
-- A coluna foi adicionada diretamente via API após diagnóstico.
--
-- Esta migration adiciona:
--   1. effective_plan(uid) — resolve plano levando em conta trial ativo
--      (profiles.trial_end) e plano de assinatura real (subscriptions.plan).
--      NOTA: profiles.plan NÃO existe; o plano vive em subscriptions.plan.
--   2. Policy RESTRICTIVE de INSERT em family_connections para defense-in-depth:
--      bloqueia no DB usuários sem plano guardian (inclui trial) mesmo que o
--      cliente tente burlar o paywall.
--
-- Uso em políticas futuras
-- ------------------------
-- Qualquer futura policy que precise filtrar por plano deve usar
-- public.effective_plan(auth.uid()) em vez de checar subscriptions.plan
-- diretamente, para honrar o trial automaticamente.
-- =============================================================================

-- 1. Função que resolve plano efetivo (trial tem precedência sobre plan)
CREATE OR REPLACE FUNCTION public.effective_plan(uid uuid)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.trial_end IS NOT NULL AND p.trial_end > NOW() THEN 'guardian'
    ELSE COALESCE(s.plan, 'free')
  END
  FROM profiles p
  LEFT JOIN subscriptions s
    ON s.user_id = p.id
   AND s.status  = 'active'
  WHERE p.id = uid;
$$;

GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO authenticated;

-- 2. INSERT RESTRICTIVE: AND-ada com permissive, exige plano efetivo guardian
DROP POLICY IF EXISTS "fc_insert_requires_guardian_plan" ON public.family_connections;
CREATE POLICY "fc_insert_requires_guardian_plan" ON public.family_connections
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.effective_plan(auth.uid()) = 'guardian');

-- =============================================================================
-- Verificação pós-apply (rodar manualmente):
--
--   SELECT public.effective_plan('<uid-em-trial>'::uuid);
--   -- Esperado: 'guardian'
--
--   SELECT policyname, cmd, permissive, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'family_connections'
--   ORDER BY permissive DESC, cmd;
--   -- Esperado: fc_insert_requires_guardian_plan como RESTRICTIVE
-- =============================================================================
