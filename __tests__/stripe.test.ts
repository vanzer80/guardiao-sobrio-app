import { STRIPE_WEBHOOK_EVENTS } from '../lib/stripe';

// validateStripeConfig lê process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
// que no Expo é substituído em compile-time pelo Babel — não é testável via
// manipulação de process.env em runtime. Testamos apenas as constantes.

describe('STRIPE_WEBHOOK_EVENTS', () => {
  it('contém os 4 eventos críticos de assinatura', () => {
    expect(STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED).toBe('payment_intent.succeeded');
    expect(STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED).toBe('customer.subscription.updated');
    expect(STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_DELETED).toBe('customer.subscription.deleted');
    expect(STRIPE_WEBHOOK_EVENTS.CHARGE_FAILED).toBe('charge.failed');
  });

  it('é um objeto readonly (const assertion)', () => {
    expect(typeof STRIPE_WEBHOOK_EVENTS).toBe('object');
    expect(Object.isFrozen(STRIPE_WEBHOOK_EVENTS)).toBe(false); // as const não congela — só infere tipo literal
    expect(Object.keys(STRIPE_WEBHOOK_EVENTS)).toHaveLength(4);
  });
});
