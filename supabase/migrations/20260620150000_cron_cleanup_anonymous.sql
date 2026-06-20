CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

SELECT cron.schedule(
  'cleanup-anonymous-users',
  '0 3 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://huumwjwndsefdmgezohb.supabase.co/functions/v1/cleanup-anonymous-users',
      headers := '{"Content-Type": "application/json"}'::jsonb
    ) AS request_id;
  $$
);
