ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_anonymous         boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous_created_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_anonymous_cleanup
  ON public.profiles (is_anonymous, anonymous_created_at)
  WHERE is_anonymous = true;

COMMENT ON COLUMN public.profiles.is_anonymous IS
  'true = sessão visitante criada por signInAnonymously()';
COMMENT ON COLUMN public.profiles.anonymous_created_at IS
  'Timestamp de criação — usado para calcular expiração e cleanup';
