-- =============================================================================
-- HOTFIX: activate_trial() — undefined column "plan" + void return type
-- =============================================================================
-- Migration : 20260620130000
-- Ticket     : BUG-001 / QA-20260620
-- Severity   : Critical — feature completely inoperative in production
-- Author     : QA / Backend (Claude, 2026-06-20)
--
-- Root cause
-- ----------
-- The original migration (20260620120000_add_trial_to_profiles.sql) created
-- activate_trial() with two defects:
--
--   1. WHERE clause referenced column "plan" which does not exist in the
--      profiles table (PostgreSQL error 42703 undefined_column).
--      The authoritative plan field is stored in Stripe/subscription data,
--      not as a plain column on profiles.
--
--   2. An intermediate manual hotfix (applied directly to production on
--      2026-06-20T13:03 UTC) removed the invalid WHERE clause but
--      accidentally changed the return type to void. The frontend
--      usePlanStore.activateTrial() expected a timestamptz value and
--      used the returned date to update the Zustand store in-session.
--      With void/null the store set trialEnd = null, isInTrial() returned
--      false, and all paywalled features remained locked until page reload.
--
-- Fix applied
-- -----------
-- Drop and recreate activate_trial() to:
--   Remove the invalid AND plan = 'free' guard
--   Restore RETURNS TIMESTAMPTZ (original intent)
--   Raise a named exception when trial has already been used
--   Re-grant EXECUTE to authenticated role
--
-- Idempotency
-- -----------
-- Safe to run multiple times. DROP IF EXISTS prevents failure on a
-- fresh database that never had the broken version.
-- =============================================================================

-- Step 1: remove any existing version (return type change requires DROP)
DROP FUNCTION IF EXISTS public.activate_trial();

-- Step 2: recreate with correct signature and guard logic
CREATE FUNCTION public.activate_trial()
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
  WHERE id                  = auth.uid()
    AND trial_activated_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'trial_already_used'
      USING HINT = 'This account has already consumed its free trial.';
  END IF;

  SELECT trial_end
  INTO   v_trial_end
  FROM   profiles
  WHERE  id = auth.uid();

  RETURN v_trial_end;
END;
$$;

-- Step 3: restore execute permission
GRANT EXECUTE ON FUNCTION public.activate_trial() TO authenticated;

-- =============================================================================
-- Verification query (run manually after applying migration):
--
--   SELECT proname, pg_get_function_result(oid) AS returns
--   FROM   pg_proc
--   WHERE  proname = 'activate_trial';
--
-- Expected: activate_trial | timestamp with time zone
-- =============================================================================
