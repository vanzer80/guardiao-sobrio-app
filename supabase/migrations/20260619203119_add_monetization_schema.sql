-- Add monetization columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'essential', 'guardian')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Add stripe_subscription_id to subscriptions table if it doesn't exist
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- Ensure RLS is enabled on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions if they don't exist
CREATE POLICY IF NOT EXISTS "Users view own subscription" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Service role manages subscriptions" ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index on stripe_subscription_id if not exists
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Create audit log for subscription changes (compliance + debugging)
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_plan TEXT,
  new_plan TEXT,
  stripe_event_id TEXT UNIQUE,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_audit_user_id ON subscription_audit_log(user_id);
CREATE INDEX idx_subscription_audit_stripe_event ON subscription_audit_log(stripe_event_id);

-- Enable RLS on audit log
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users view their own audit log (authenticated)
CREATE POLICY "Users view own audit log" ON subscription_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role writes audit events
CREATE POLICY "Service role writes audit log" ON subscription_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Expose both tables to Data API (with RLS protection)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON subscriptions TO anon, authenticated;
GRANT SELECT ON subscription_audit_log TO anon, authenticated;
