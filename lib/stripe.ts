/**
 * Stripe configuration & helpers for O Guardião Sobrio
 *
 * Stripe handles payment processing for Essential (R$19,90/mês) and Guardian (R$39,90/mês) plans.
 * Checkout flow uses URL redirect (Stripe Hosted Checkout) — no native SDK components required.
 *
 * Hard rule: Never store sensitive payment data locally. Always use Stripe API.
 */

// Validates that the Stripe publishable key is configured before showing the paywall.
// URL-redirect checkout does not require SDK initialization.
export async function initializeStripe(): Promise<boolean> {
  return validateStripeConfig();
}

/**
 * Create a checkout session via Edge Function
 * Edge Function handles:
 * - Stripe API call with service_role (never exposed to client)
 * - Customer creation/retrieval
 * - Subscription item setup
 * - Success/cancel URL handling
 */
export async function createCheckoutSession(
  userId: string,
  plan: 'essential' | 'guardian',
  accessToken: string
) {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId,
          plan,
          // Success/cancel URLs handled in Edge Function
          // They point to in-app deep links (stripe://redirect/success, etc.)
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Checkout session failed: ${response.statusText}`);
    }

    const { sessionId, url } = await response.json();
    return { sessionId, url };
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook (called from Edge Function, not client)
 * Processes:
 * - payment_intent.succeeded → update user's plan
 * - customer.subscription.updated → handle downgrades
 * - customer.subscription.deleted → revert to free plan
 *
 * Never called from mobile client (webhook signature validation requires secret key)
 */
export const STRIPE_WEBHOOK_EVENTS = {
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  CHARGE_FAILED: 'charge.failed',
} as const;

/**
 * Validate that Stripe config is ready before showing paywall
 */
export async function validateStripeConfig(): Promise<boolean> {
  const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return Boolean(key && key.startsWith('pk_'));
}
