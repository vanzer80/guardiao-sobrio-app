import { supabase } from '@/lib/supabase';

interface GuestOnboardingData {
  motivo: string;
  tempo: string;
  desafio: string;
}

export async function signInAsGuest(data: GuestOnboardingData): Promise<void> {
  const { data: authData, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;

  const userId = authData.session?.user.id;
  if (!userId) throw new Error('anonymous session missing user id');

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      is_anonymous: true,
      anonymous_created_at: new Date().toISOString(),
      onboarding_completed: true,
      onboarding_motivo: data.motivo,
      onboarding_tempo: data.tempo,
      onboarding_desafio: data.desafio,
      full_name: 'Visitante',
      plan: 'free',
    });

  if (profileError) throw profileError;
}
