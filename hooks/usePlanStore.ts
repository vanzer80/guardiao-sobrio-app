import { create } from 'zustand';
import { PlanType, SubscriptionStatus } from '@/lib/types.monetization';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';

const FEATURE_MAP: Record<PlanType, string[]> = {
  free: ['dailyChecklist', 'sobrietyCounter', 'emergencyProtocol'],
  essential: [
    'dailyChecklist', 'sobrietyCounter', 'emergencyProtocol',
    'diaryPrompts', 'foundamentals', 'triggerMap', 'statistics',
  ],
  guardian: [
    'dailyChecklist', 'sobrietyCounter', 'emergencyProtocol',
    'diaryPrompts', 'foundamentals', 'triggerMap', 'statistics',
    'familyModule', 'program30Days', 'community',
  ],
};

interface PlanState {
  plan: PlanType;
  stripeCustomerId: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  trialActivatedAt: string | null;
  isLoading: boolean;
  error: string | null;

  setPlan: (plan: PlanType) => void;
  setStripeCustomerId: (id: string) => void;
  setSubscriptionStatus: (status: SubscriptionStatus) => void;
  setCurrentPeriodEnd: (date: string | null) => void;
  setTrialEnd: (date: string | null) => void;
  setTrialActivatedAt: (date: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  /** One-shot trial activation — throws if already used or not on free plan. */
  activateTrial: () => Promise<string>;

  /** Returns true while trial_end is in the future. Computed fresh each call. */
  isInTrial: () => boolean;
  /** Returns 'guardian' during an active trial, otherwise the real plan. */
  getEffectivePlan: () => PlanType;
  canAccessFeature: (feature: string) => boolean;
  isSubscriptionActive: () => boolean;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: 'free',
  stripeCustomerId: null,
  subscriptionStatus: null,
  currentPeriodEnd: null,
  trialEnd: null,
  trialActivatedAt: null,
  isLoading: false,
  error: null,

  setPlan: (plan) => set({ plan }),
  setStripeCustomerId: (id) => set({ stripeCustomerId: id }),
  setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
  setCurrentPeriodEnd: (date) => set({ currentPeriodEnd: date }),
  setTrialEnd: (date) => set({ trialEnd: date }),
  setTrialActivatedAt: (date) => set({ trialActivatedAt: date }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  activateTrial: async () => {
    const { data, error } = await supabase.rpc('activate_trial');
    if (error) throw error;
    const trialEnd = data as string;
    set({ trialEnd, trialActivatedAt: new Date().toISOString() });
    return trialEnd;
  },

  isInTrial: () => {
    const { trialEnd } = get();
    return trialEnd !== null && new Date(trialEnd) > new Date();
  },

  getEffectivePlan: () => {
    const state = get();
    const { isAnonymous } = useAuthStore.getState();
    if (isAnonymous) return 'guardian';
    return state.isInTrial() ? 'guardian' : state.plan;
  },

  canAccessFeature: (feature: string) => {
    const effectivePlan = get().getEffectivePlan();
    return FEATURE_MAP[effectivePlan]?.includes(feature) ?? false;
  },

  isSubscriptionActive: () => {
    const state = get();
    return state.subscriptionStatus === 'active';
  },
}));
