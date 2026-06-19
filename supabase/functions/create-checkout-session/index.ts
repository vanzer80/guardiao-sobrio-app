/**
 * Edge Function: create-checkout-session
 *
 * Cria uma Stripe Checkout Session para o usuário autenticado.
 * Roda server-side (Deno) — stripe_secret_key nunca chega ao cliente.
 *
 * POST /functions/v1/create-checkout-session
 * Body: { plan: 'essential' | 'guardian' }
 * Headers: Authorization: Bearer <access_token>
 *
 * Resposta: { sessionId, url }
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Preços Stripe — IDs dos Price objects (criar no Stripe Dashboard e colocar aqui)
// Exemplo: pk_live_... para produção, pk_test_... para testes
const STRIPE_PRICE_IDS: Record<string, string> = {
  essential_monthly: Deno.env.get('STRIPE_PRICE_ESSENTIAL_MONTHLY') ?? '',
  guardian_monthly: Deno.env.get('STRIPE_PRICE_GUARDIAN_MONTHLY') ?? '',
  essential_annual: Deno.env.get('STRIPE_PRICE_ESSENTIAL_ANNUAL') ?? '',
  guardian_annual: Deno.env.get('STRIPE_PRICE_GUARDIAN_ANNUAL') ?? '',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // 2. Validar body
    const body = await req.json().catch(() => ({}));
    const plan = body?.plan as string;
    const billing = (body?.billing ?? 'monthly') as string;

    if (!plan || !['essential', 'guardian'].includes(plan)) {
      return json({ error: 'Invalid plan. Must be "essential" or "guardian".' }, 400);
    }
    if (!['monthly', 'annual'].includes(billing)) {
      return json({ error: 'Invalid billing. Must be "monthly" or "annual".' }, 400);
    }

    const priceKey = `${plan}_${billing}`;
    const priceId = STRIPE_PRICE_IDS[priceKey];
    if (!priceId) {
      return json({ error: `Price not configured for ${priceKey}` }, 500);
    }

    // 3. Cliente service_role para ler/escrever profiles
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 4. Buscar ou criar Stripe Customer
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .single();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');

    let stripeCustomerId = profile?.stripe_customer_id as string | null;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      // Salvar customer_id imediatamente (não aguardar webhook)
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);
    }

    // 5. Criar Checkout Session
    // success_url e cancel_url usam deep links do app (Expo)
    const appScheme = Deno.env.get('APP_SCHEME') ?? 'guardiao';
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appScheme}://plans/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appScheme}://plans/cancel`,
      metadata: {
        supabase_user_id: user.id,
        plan,
        billing,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan,
        },
      },
    });

    return json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
