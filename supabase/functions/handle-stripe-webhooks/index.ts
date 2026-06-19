/**
 * Edge Function: handle-stripe-webhooks
 *
 * Recebe eventos do Stripe e atualiza o plano do usuário no Supabase.
 * Valida assinatura HMAC do webhook (STRIPE_WEBHOOK_SECRET) antes de processar.
 *
 * POST /functions/v1/handle-stripe-webhooks
 * Headers: stripe-signature: <signature>  (adicionado pelo Stripe automaticamente)
 *
 * Eventos tratados:
 * - checkout.session.completed     → ativa o plano (upgrade)
 * - customer.subscription.updated  → atualiza plano/status (mudança de tier)
 * - customer.subscription.deleted  → reverte para free (cancel/expire)
 * - invoice.payment_failed         → atualiza status para past_due
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  // 1. Validar assinatura Stripe (previne replay attacks e forjamento)
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, 400);
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return json({ error: 'Invalid webhook signature' }, 400);
  }

  // 2. Cliente admin para atualizar profiles + subscriptions
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, stripe, session, event.id);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, sub, event.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, sub, event.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice, event.id);
        break;
      }

      default:
        // Eventos não tratados: ignorar silenciosamente (Stripe exige 200)
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true });
  } catch (err) {
    console.error(`Error processing event ${event.type}:`, err);
    // Retorna 500 para Stripe tentar novamente (retry automático por 72h)
    return json({ error: String(err) }, 500);
  }
});

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventId: string,
) {
  const userId = session.metadata?.supabase_user_id;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    throw new Error(`Missing metadata in checkout session: ${session.id}`);
  }

  // Buscar subscription ativa da session
  let stripeSubscriptionId = session.subscription as string | null;
  let currentPeriodStart: Date | null = null;
  let currentPeriodEnd: Date | null = null;

  if (stripeSubscriptionId) {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    currentPeriodStart = new Date(sub.current_period_start * 1000);
    currentPeriodEnd = new Date(sub.current_period_end * 1000);
  }

  // Buscar plano anterior para audit log
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const oldPlan = profile?.plan ?? 'free';

  // Atualizar plano do usuário
  await supabase
    .from('profiles')
    .update({ plan })
    .eq('id', userId);

  // Upsert na tabela subscriptions
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan,
      status: 'active',
      stripe_subscription_id: stripeSubscriptionId,
      current_period_start: currentPeriodStart?.toISOString() ?? null,
      current_period_end: currentPeriodEnd?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  // Registrar no audit log
  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: userId,
      action: 'upgraded',
      old_plan: oldPlan,
      new_plan: plan,
      stripe_event_id: eventId,
      details: { session_id: session.id, stripe_subscription_id: stripeSubscriptionId },
    });

  console.log(`Upgraded user ${userId}: ${oldPlan} → ${plan}`);
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
  eventId: string,
) {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) {
    console.warn('No supabase_user_id in subscription metadata:', sub.id);
    return;
  }

  const plan = sub.metadata?.plan ?? 'free';
  const status = sub.status === 'active' ? 'active'
    : sub.status === 'canceled' ? 'canceled'
    : 'past_due';

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const oldPlan = profile?.plan ?? 'free';

  await supabase
    .from('profiles')
    .update({ plan: status === 'active' ? plan : 'free' })
    .eq('id', userId);

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan,
      status,
      stripe_subscription_id: sub.id,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: userId,
      action: oldPlan !== plan ? 'downgraded' : 'renewed',
      old_plan: oldPlan,
      new_plan: status === 'active' ? plan : 'free',
      stripe_event_id: eventId,
      details: { stripe_subscription_id: sub.id, status: sub.status },
    });

  console.log(`Updated subscription for user ${userId}: plan=${plan}, status=${status}`);
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
  eventId: string,
) {
  const userId = sub.metadata?.supabase_user_id;
  if (!userId) {
    console.warn('No supabase_user_id in subscription metadata:', sub.id);
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const oldPlan = profile?.plan ?? 'free';

  // Revogar plano — usuário volta para free
  await supabase
    .from('profiles')
    .update({ plan: 'free' })
    .eq('id', userId);

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', sub.id);

  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: userId,
      action: 'canceled',
      old_plan: oldPlan,
      new_plan: 'free',
      stripe_event_id: eventId,
      details: { stripe_subscription_id: sub.id },
    });

  console.log(`Canceled subscription for user ${userId}: ${oldPlan} → free`);
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice,
  eventId: string,
) {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  // Buscar usuário pelo stripe_customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.warn('No profile found for Stripe customer:', customerId);
    return;
  }

  // Marcar subscription como past_due (não cancela imediatamente — Stripe tenta mais vezes)
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('user_id', profile.id);

  await supabase
    .from('subscription_audit_log')
    .insert({
      user_id: profile.id,
      action: 'failed',
      old_plan: profile.plan,
      new_plan: profile.plan, // Mantém plano por enquanto; Stripe tentará de novo
      stripe_event_id: eventId,
      details: { invoice_id: invoice.id, amount_due: invoice.amount_due },
    });

  console.log(`Payment failed for user ${profile.id}, subscription marked as past_due`);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
