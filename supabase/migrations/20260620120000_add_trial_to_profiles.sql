-- Add trial columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_activated_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ DEFAULT NULL;

-- RPC to activate the 5-day trial (one-shot, server-enforced)
-- SECURITY DEFINER ensures the client can never forge the expiry date.
-- Guards: auth.uid() must match, plan must be 'free', trial_activated_at must be NULL.
CREATE OR REPLACE FUNCTION activate_trial()
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trial_end TIMESTAMPTZ;
BEGIN
  UPDATE profiles
  SET
    trial_activated_at = NOW(),
    trial_end          = NOW() + INTERVAL '5 days',
    updated_at         = NOW()
  WHERE
    id                  = auth.uid()
    AND trial_activated_at IS NULL
    AND plan            = 'free';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'trial_already_used';
  END IF;

  SELECT trial_end INTO v_trial_end
  FROM profiles
  WHERE id = auth.uid();

  RETURN v_trial_end;
END;
$$;

GRANT EXECUTE ON FUNCTION activate_trial() TO authenticated;
