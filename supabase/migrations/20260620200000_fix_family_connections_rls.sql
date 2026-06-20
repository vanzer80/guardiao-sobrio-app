-- Garante RLS ativo na tabela (pode já estar, IF NOT EXISTS é safe)
ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;

-- Owner: acesso completo às próprias conexões
CREATE POLICY IF NOT EXISTS "owner_all_family_connections"
ON public.family_connections
FOR ALL
TO authenticated
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Familiar: pode ver conexão da qual faz parte (status aceito)
CREATE POLICY IF NOT EXISTS "member_view_family_connection"
ON public.family_connections
FOR SELECT
TO authenticated
USING (family_user_id = auth.uid());

-- Familiar: pode aceitar convite pendente pelo token
-- USING: qualquer authenticated pode ler linhas pending (necessário para lookup por token)
-- WITH CHECK: só pode escrever a si mesmo como family_user_id
CREATE POLICY IF NOT EXISTS "member_accept_pending_invite"
ON public.family_connections
FOR SELECT
TO authenticated
USING (invitation_status = 'pending' AND invitation_token IS NOT NULL);

CREATE POLICY IF NOT EXISTS "member_update_to_accept"
ON public.family_connections
FOR UPDATE
TO authenticated
USING  (invitation_status = 'pending' AND invitation_token IS NOT NULL)
WITH CHECK (family_user_id = auth.uid() AND invitation_status = 'accepted');
