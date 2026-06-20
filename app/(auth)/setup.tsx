import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/hooks/useProfileStore';
import { Colors } from '@/constants/Colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  registerForPushNotificationsAsync,
  scheduleDailyReminder,
} from '@/lib/notifications';
import { readOnboardingDraft, clearOnboardingDraft } from '@/lib/onboardingStore';

const SUBSTANCE_OPTIONS = [
  { key: 'alcool', label: 'Álcool' },
  { key: 'drogas', label: 'Drogas' },
  { key: 'alcool_drogas', label: 'Álcool e drogas' },
  { key: 'outro', label: 'Outro' },
];

const DEFAULT_CHECKLIST_ITEMS = [
  { title: 'Dormi bem',              category: 'saude',  sort_order: 0 },
  { title: 'Me hidratei',            category: 'saude',  sort_order: 1 },
  { title: 'Me alimentei bem',       category: 'saude',  sort_order: 2 },
  { title: 'Me movimentei',          category: 'saude',  sort_order: 3 },
  { title: 'Tive contato positivo',  category: 'social', sort_order: 4 },
];

function parseDateBR(input: string): string | null {
  const cleaned = input.replace(/\D/g, '');
  if (cleaned.length !== 8) return null;
  const day = Number(cleaned.slice(0, 2));
  const month = Number(cleaned.slice(2, 4));
  const year = Number(cleaned.slice(4, 8));
  if (year < 1900 || year > new Date().getFullYear()) return null;

  // new Date(y, m-1, d) faz rollover silencioso (30/02 → 01/03); validamos
  // reconstruindo a data e checando os componentes.
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  if (date > new Date()) return null;

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Converte a resposta do onboarding "tempo" em uma data pré-preenchida (DD/MM/AAAA).
// '30mais' é deixado em branco: o usuário sabe a data exata melhor do que nós.
function tempoToDateInput(tempo: string): string {
  const offsets: Record<string, number> = { agora: 0, '1a7': 3, '8a30': 14 };
  const daysAgo = offsets[tempo];
  if (daysAgo === undefined) return '';
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const setProfile = useProfileStore((s) => s.setProfile);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dateInput, setDateInput] = useState(() => {
    const { tempo } = readOnboardingDraft();
    return tempo ? tempoToDateInput(tempo) : '';
  });
  const [substance, setSubstance] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');

  const handleDateChange = (text: string) => {
    setDateError('');
    setDateInput(formatDateInput(text));
  };

  const nextStep = () => {
    if (step === 0 && name.trim().length < 2) {
      Alert.alert('Digite seu nome');
      return;
    }
    if (step === 1) {
      const parsed = parseDateBR(dateInput);
      if (!parsed) {
        setDateError('Data inválida. Use DD/MM/AAAA e não pode ser futura.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const finish = async () => {
    const sobrietyDate = parseDateBR(dateInput);
    if (!sobrietyDate) return;

    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      Alert.alert('Sessão expirada. Faça login novamente.');
      router.replace('/(auth)/login');
      return;
    }

    const userId = session.user.id;

    // Salva os dados do perfil (sem marcar onboarding como concluído ainda).
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        sobriety_start_date: sobrietyDate,
        substance_focus: substance,
      })
      .eq('id', userId);

    if (profileError) {
      setLoading(false);
      Alert.alert('Erro ao salvar perfil', profileError.message);
      return;
    }

    // Cria registro de sobriedade ativo.
    const { error: recordError } = await supabase
      .from('sobriety_records')
      .insert({ user_id: userId, start_date: sobrietyDate });

    if (recordError) {
      setLoading(false);
      Alert.alert('Erro ao iniciar seu registro', recordError.message);
      return;
    }

    // Cria os 5 itens padrão do checklist.
    const { error: itemsError } = await supabase
      .from('checklist_items')
      .insert(DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item, user_id: userId })));

    if (itemsError) {
      setLoading(false);
      Alert.alert('Erro ao criar seu checklist', itemsError.message);
      return;
    }

    // Tudo gravado com sucesso — só agora marca o onboarding como concluído
    // e sincroniza o store para o guard liberar as tabs.
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)
      .select()
      .single();
    if (updatedProfile) setProfile(updatedProfile);
    clearOnboardingDraft();

    // Solicita permissão de notificação e agenda lembrete diário (opcional).
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await supabase.from('push_tokens').upsert(
          { user_id: userId, token, platform: Platform.OS },
          { onConflict: 'token' },
        );
      }
      await scheduleDailyReminder(9, 0);
    } catch {
      // Notificação é opcional, não bloqueia o fluxo
    }

    setLoading(false);
    router.replace('/(auth)/ativacao');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Indicador de progresso */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 48, marginTop: 8 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                backgroundColor: i <= step ? Colors.gold : Colors.border,
              }}
            />
          ))}
        </View>

        {/* Passo 0: Nome */}
        {step === 0 && (
          <View style={{ flex: 1, gap: 24 }}>
            <View>
              <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 8 }}>
                VAMOS COMEÇAR
              </Text>
              <Text
                style={{ color: Colors.text, fontSize: 28, fontWeight: '600', marginBottom: 4 }}
              >
                Como posso te chamar?
              </Text>
            </View>
            <Input
              label="Seu nome"
              value={name}
              onChangeText={setName}
              placeholder="Nome ou apelido"
              autoFocus
              autoCapitalize="words"
            />
          </View>
        )}

        {/* Passo 1: Data de sobriedade */}
        {step === 1 && (
          <View style={{ flex: 1, gap: 24 }}>
            <View>
              <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 8 }}>
                SEU MARCO
              </Text>
              <Text
                style={{ color: Colors.text, fontSize: 28, fontWeight: '600', marginBottom: 4 }}
              >
                Quando você decidiu começar de novo?
              </Text>
              <Text style={{ color: Colors.muted, fontSize: 14, marginTop: 8 }}>
                Pode ser hoje. Pode ser uma data passada. Não há resposta errada.
              </Text>
            </View>
            <Input
              label="Data (DD/MM/AAAA)"
              value={dateInput}
              onChangeText={handleDateChange}
              placeholder="01/01/2024"
              keyboardType="numeric"
              error={dateError}
              autoFocus
            />
          </View>
        )}

        {/* Passo 2: Foco */}
        {step === 2 && (
          <View style={{ flex: 1, gap: 24 }}>
            <View>
              <Text style={{ color: Colors.muted, fontSize: 13, marginBottom: 8 }}>
                SEU FOCO
              </Text>
              <Text
                style={{ color: Colors.text, fontSize: 28, fontWeight: '600', marginBottom: 4 }}
              >
                Em que você está trabalhando?
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {SUBSTANCE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setSubstance(opt.key)}
                  style={{
                    height: 52,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: substance === opt.key ? Colors.gold : Colors.border,
                    backgroundColor:
                      substance === opt.key ? `${Colors.gold}18` : Colors.surfaceRaised,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: substance === opt.key ? Colors.gold : Colors.text,
                      fontSize: 16,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Botão de ação */}
        <View style={{ marginTop: 40 }}>
          {step < 2 ? (
            <Button title="Continuar" onPress={nextStep} />
          ) : (
            <Button
              title="Começar minha jornada"
              onPress={finish}
              loading={loading}
              disabled={!substance}
            />
          )}
        </View>

        <Text
          style={{
            color: Colors.muted,
            fontSize: 11,
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
