-- Add expiry to family_connections invitation tokens
-- Código de convite expira em 48h conforme regra de negócio (guardiao-sobrio-docs §5)
ALTER TABLE family_connections
  ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;

-- Index for efficiently finding valid (non-expired) tokens
CREATE INDEX IF NOT EXISTS idx_family_connections_token
  ON family_connections(invitation_token)
  WHERE invitation_token IS NOT NULL;
