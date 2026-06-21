-- =============================================================================
-- Fix: recursão infinita (42P17) em INSERT na family_connections
-- =============================================================================
--
-- Causa-raiz:
--   A policy RESTRICTIVE "Anônimos não podem criar conexões de família" faz
--   NOT EXISTS (SELECT 1 FROM profiles WHERE ...) sem SECURITY DEFINER.
--   Isso dispara as SELECT policies de profiles, que incluem family_select_profile:
--     EXISTS (SELECT 1 FROM family_connections fc WHERE fc.family_user_id = auth.uid() ...)
--   Resultado: family_connections → profiles → family_connections → 42P17.
--
-- Fix:
--   1. Adicionar check de is_anonymous à effective_plan() (já é SECURITY DEFINER,
--      não dispara as RLS policies de profiles → sem recursão).
--   2. Remover a policy "Anônimos não podem criar conexões de família"
--      (effective_plan() agora retorna 'free' para anônimos, bloqueando-os via
--      fc_insert_requires_guardian_plan).
--
-- Comportamento resultante:
--   - Anônimo (is_anonymous=true)        → effective_plan='free'  → INSERT bloqueado ✅
--   - Usuário em trial ativo              → effective_plan='guardian' → INSERT permitido ✅
--   - Usuário pago Guardião               → effective_plan='guardian' → INSERT permitido ✅
--   - Usuário free ou plano inferior      → effective_plan='free'  → INSERT bloqueado ✅
-- =============================================================================

CREATE OR REPLACE FUNCTION public.effective_plan(uid uuid)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.is_anonymous = true              THEN 'free'
    WHEN p.trial_end IS NOT NULL
         AND p.trial_end > NOW()            THEN 'guardian'
    ELSE COALESCE(s.plan, 'free')
  END
  FROM profiles p
  LEFT JOIN subscriptions s
    ON  s.user_id = p.id
    AND s.status  = 'active'
  WHERE p.id = uid;
$$;

GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO authenticated;

-- Remove a policy que causava a recursão
-- (o bloqueio de anônimos agora é tratado dentro de effective_plan())
DROP POLICY IF EXISTS "Anônimos não podem criar conexões de família" ON public.family_connections;
