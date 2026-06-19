import { create } from 'zustand';
import { PlanType, SubscriptionStatus } from '@/lib/types.monetization';

interface PlanState {
  // Current user's plan
  plan: PlanType;
  stripeCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setPlan: (plan: PlanType) => void;
  setStripeCustomerId: (id: string) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setCurrentPeriodEnd: (date: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Utility
  canAccessFeature: (feature: string) => boolean;
  isSubscriptionActive: () => boolean;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: 'free',
  stripeCustomerId: null,
  subscriptionStatus: null,
  currentPeriodEnd: null,
  isLoading: false,
  error: null,

  setPlan: (plan) => set({ plan }),
  setStripeCustomerId: (id) => set({ stripeCustomerId: id }),
  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  setCurrentPeriodEnd: (date) => set({ currentPeriodEnd: date }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  canAccessFeature: (feature: string) => {
    const state = get();
    const planFeatures = {
      free: ['dailyChecklist', 'sobrietyCounter', 'emergencyProtocol'],
      essential: ['dailyChecklist', 'sobrietyCounter', 'emergencyProtocol', 'diaryPrompts', 'foundamentals', 'triggerMap', 'statistics'],
      guardian: ['dailyChecklist', 'sobrietyCounter', 'emergencyProtocol', 'diaryPrompts', 'foundamentals', 'triggerMap', 'statistics', 'familyModule', 'program30Days', 'community'],
    };

    return planFeatures[state.plan]?.includes(feature) ?? false;
  },

  isSubscriptionActive: () => {
    const state = get();
    return state.subscriptionStatus === 'active';
  },
}));
