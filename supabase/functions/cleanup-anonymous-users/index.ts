import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: expired, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_anonymous', true)
    .lt('anonymous_created_at', cutoff)

  if (error) return new Response(`error: ${error.message}`, { status: 500 })
  if (!expired?.length) return new Response('noop')

  for (const { id } of expired) {
    // Cascata via FK apaga profiles e dados associados
    await supabase.auth.admin.deleteUser(id)
  }

  return new Response(`deleted ${expired.length} anonymous users`)
})
