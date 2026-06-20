-- Colunas opcionais que capturam o contexto inicial do usuário durante o
-- fluxo pré-cadastro (motivo, tempo na jornada, maior desafio).
-- Adicionadas com IF NOT EXISTS para ser idempotente.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_motivo  TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_tempo   TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_desafio TEXT;
