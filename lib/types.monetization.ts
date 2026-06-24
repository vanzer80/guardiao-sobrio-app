/**
 * Monetization types for O Guardião Sobrio
 * Stripe integration + subscription management
 */

export type PlanType = 'free' | 'essential' | 'guardian';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: 'essential' | 'guardian';
  status: SubscriptionStatus;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionAuditLogRow {
  id: string;
  user_id: string;
  action: 'upgraded' | 'downgraded' | 'canceled' | 'renewed' | 'failed';
  old_plan: PlanType | null;
  new_plan: PlanType | null;
  stripe_event_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

/** Plan feature matrix */
export const PLAN_FEATURES: Record<PlanType, Record<string, boolean | number>> = {
  free: {
    dailyChecklist: true,
    sobrietyCounter: true,
    emergencyProtocol: 3, // 3 uses/month
    diaryPrompts: 7, // 7 days
    foundamentals: 3, // First 3 unlocked
    triggerMap: false,
    statistics: false,
    familyModule: false,
    program30Days: false,
    community: false,
  },
  essential: {
    dailyChecklist: true,
    sobrietyCounter: true,
    emergencyProtocol: -1, // Unlimited
    diaryPrompts: -1, // Unlimited
    foundamentals: 13, // All unlocked
    triggerMap: true,
    statistics: true,
    familyModule: false,
    program30Days: false,
    community: false,
  },
  guardian: {
    dailyChecklist: true,
    sobrietyCounter: true,
    emergencyProtocol: -1,
    diaryPrompts: -1,
    foundamentals: 13,
    triggerMap: true,
    statistics: true,
    familyModule: true, // Family sharing
    program30Days: true, // 30-day program
    community: true, // Community shield
  },
};

/** Pricing (in BRL) */
export const PRICING = {
  essential: {
    monthly: 19.9,
    annual: 199.0, // ~17/month when billed annually
    currency: 'BRL',
  },
  guardian: {
    monthly: 39.9,
    annual: 299.0, // ~25/month when billed annually
    currency: 'BRL',
  },
};

/** Stripe configuration (will be loaded from env) */
export interface StripeConfig {
  publishableKey: string;
  merchantId?: string; // For Apple Pay
}
