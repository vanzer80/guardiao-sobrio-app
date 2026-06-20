import { useMemo } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useProfileStore } from '@/hooks/useProfileStore';

const ANONYMOUS_DURATION_DAYS = 5;

export function useAnonymousSession() {
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const profile = useProfileStore((s) => s.profile);

  return useMemo(() => {
    if (!isAnonymous || !profile?.anonymous_created_at) {
      return { isAnonymous: false, daysRemaining: 0, isExpired: false, shouldShowBanner: false };
    }

    const created = new Date(profile.anonymous_created_at).getTime();
    const expiresAt = created + ANONYMOUS_DURATION_DAYS * 24 * 60 * 60 * 1000;
    const msRemaining = expiresAt - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    const isExpired = msRemaining <= 0;

    return { isAnonymous: true, daysRemaining, isExpired, shouldShowBanner: !isExpired };
  }, [isAnonymous, profile?.anonymous_created_at]);
}
