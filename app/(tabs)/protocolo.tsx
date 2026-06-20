import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  Animated,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { countSosThisMonth, saveSosActivation, FREE_MONTHLY_LIMIT } from '@/lib/protocolo';

type Step = 'idle' | 'pare' | 'respire' | 'contato' | 'movimento' | 'estrutura';

const BREATH_PHASES = [
  { label: 'INSPIRE', secs: 4, toValue: 1 },
  { label: 'SEGURE', secs: 4, toValue: 1 },
  { label: 'EXPIRE', secs: 6, toValue: 0 },
] as const;

const TOTAL_CYCLES = 3;

export default function ProtocoloScreen() {
  const [step, setStep] = useState<Step>('idle');
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [cravingLevel, setCravingLevel] = useState(5);

  // Breathing state
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathCycle, setBreathCycle] = useState(0);
  const [phaseCountdown, setPhaseCountdown] = useState(4);
  const [circleAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      countSosThisMonth(session.user.id).then(setUsageCount);
    });
  }, []);

  const reset = useCallback(() => {
    circleAnim.stopAnimation();
    circleAnim.setValue(0);
    setStep('idle');
    setBreathPhase(0);
    setBreathCycle(0);
    setPhaseCountdown(4);
  }, [circleAnim]);

  const startProtocol = useCallback(() => {
    if (userId) {
      saveSosActivation(userId, cravingLevel);
      setUsageCount((prev) => (prev !== null ? prev + 1 : 1));
    }
    setStep('pare');
  }, [userId, cravingLevel]);

  // Auto-advance PARE → RESPIRE after 4 seconds; resets breath state in the callback
  // (setState in setTimeout callback is allowed — not a synchronous effect body call)
  useEffect(() => {
    if (step !== 'pare') return;
    const t = setTimeout(() => {
      circleAnim.setValue(0);
      setBreathPhase(0);
      setBreathCycle(0);
      setPhaseCountdown(BREATH_PHASES[0].secs);
      setStep('respire');
    }, 4000);
    return () => clearTimeout(t);
  }, [step, circleAnim]);

  // Breathing animation loop — entered with state already reset by the PARE effect
  useEffect(() => {
    if (step !== 'respire') return;

    let phase = 0;
    let cycle = 0;
    let secs: number = BREATH_PHASES[0].secs;

    Animated.timing(circleAnim, {
      toValue: BREATH_PHASES[0].toValue,
      duration: BREATH_PHASES[0].secs * 1000,
      useNativeDriver: false,
    }).start();

    const tick = setInterval(() => {
      secs -= 1;

      if (secs <= 0) {
        phase = (phase + 1) % 3;

        if (phase === 0) {
          cycle += 1;
          setBreathCycle(cycle);
          if (cycle >= TOTAL_CYCLES) {
            clearInterval(tick);
            setStep('contato');
            return;
          }
        }

        const next = BREATH_PHASES[phase];
        setBreathPhase(phase);
        secs = next.secs;

        circleAnim.stopAnimation();
        Animated.timing(circleAnim, {
          toValue: next.toValue,
          duration: next.secs * 1000,
          useNativeDriver: false,
        }).start();
      }

      setPhaseCountdown(secs);
    }, 1000);

    return () => clearInterval(tick);
  }, [step, circleAnim]);

  const circleSize = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 200],
  });

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (step === 'idle') {
    const overLimit = usageCount !== null && usageCount >= FREE_MONTHLY_LIMIT;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView contentContainerStyle={styles.centerPad}>
          <Text style={styles.screenTitle}>Protocolo de Emergência</Text>
          <Text style={styles.screenSub}>
            Para momentos de crise, fissura intensa ou recaída iminente.
          </Text>

          {overLimit && (
            <View style={styles.limitBox}>
              <Text style={{ color: Colors.emergency, fontWeight: '600', fontSize: 13 }}>
                Você usou {usageCount}/{FREE_MONTHLY_LIMIT} protocolos gratuitos este mês.
              </Text>
              <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                O protocolo jamais é bloqueado durante uma crise.
              </Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>NÍVEL DE FISSURA AGORA</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <Pressable
                key={n}
                onPress={() => setCravingLevel(n)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: cravingLevel === n ? Colors.emergency : Colors.surface,
                  borderWidth: 1,
                  borderColor: cravingLevel === n ? Colors.emergency : Colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: cravingLevel === n ? '#fff' : Colors.muted,
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.sosLaunchButton} onPress={startProtocol}>
            <Text style={styles.sosLaunchText}>INICIAR PROTOCOLO</Text>
          </Pressable>

          <View style={styles.cvvBox}>
            <Text style={{ color: Colors.gold, fontWeight: '600', fontSize: 13 }}>
              Em perigo imediato? CVV 188 (24h, gratuito, sigiloso)
            </Text>
            <Pressable onPress={() => Linking.openURL('tel:188')}>
              <Text style={{ color: Colors.emergency, fontSize: 13, marginTop: 6 }}>
                Ligar agora para o CVV
              </Text>
            </Pressable>
            <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 4 }}>
              CAPS — caps.ms/onde-buscar-ajuda
            </Text>
          </View>

          <Text style={styles.disclaimer}>
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PARE ────────────────────────────────────────────────────────────────────
  if (step === 'pare') {
    return (
      <SafeAreaView style={[styles.fullCenter, { backgroundColor: Colors.bg }]}>
        <Text style={styles.stepLabel}>PASSO 1 DE 5</Text>
        <Text style={[styles.bigWord, { color: Colors.emergency }]}>PARE.</Text>
        <Text style={styles.stepInstruction}>
          Interrompa o que está fazendo agora.{'\n'}
          Sente ou deite em um lugar seguro.
        </Text>
        <Text style={{ color: Colors.border, fontSize: 13, marginTop: 32 }}>
          Avançando automaticamente…
        </Text>
        <Text style={styles.disclaimer}>
          Este app não substitui profissional de saúde.
        </Text>
      </SafeAreaView>
    );
  }

  // ── RESPIRE ─────────────────────────────────────────────────────────────────
  if (step === 'respire') {
    const phase = BREATH_PHASES[breathPhase];
    return (
      <SafeAreaView style={[styles.fullCenter, { backgroundColor: Colors.bg }]}>
        <Text style={styles.stepLabel}>
          PASSO 2 DE 5 · Ciclo {breathCycle + 1}/{TOTAL_CYCLES}
        </Text>
        <Text style={[styles.bigWord, { color: Colors.gold }]}>{phase.label}</Text>

        <Animated.View
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: 100,
            backgroundColor: `${Colors.gold}1a`,
            borderWidth: 2,
            borderColor: Colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 32,
          }}
        >
          <Text
            style={{
              color: Colors.gold,
              fontSize: 40,
              fontFamily: 'CormorantGaramond',
            }}
          >
            {phaseCountdown}
          </Text>
        </Animated.View>

        <Text style={styles.stepInstruction}>
          Inspire 4s · Segure 4s · Expire 6s
        </Text>

        <Pressable
          style={styles.skipButton}
          onPress={() => {
            circleAnim.stopAnimation();
            setStep('contato');
          }}
        >
          <Text style={{ color: Colors.muted, fontSize: 13 }}>Pular esta etapa</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Este app não substitui profissional de saúde.
        </Text>
      </SafeAreaView>
    );
  }

  // ── CONTATO ─────────────────────────────────────────────────────────────────
  if (step === 'contato') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView contentContainerStyle={styles.scrollPad}>
          <Text style={styles.stepLabel}>PASSO 3 DE 5</Text>
          <Text style={[styles.bigWord, { color: Colors.text }]}>CONTATO</Text>
          <Text style={styles.stepInstruction}>
            Traga-se para o presente. Nomeie:
          </Text>

          {[
            { n: 5, sense: 'coisas que você VEJA agora' },
            { n: 4, sense: 'coisas que você SINTA (textura, temperatura)' },
            { n: 3, sense: 'sons que você OUÇA' },
            { n: 2, sense: 'cheiros que você PERCEBA' },
            { n: 1, sense: 'sabor que você SINTA' },
          ].map(({ n, sense }) => (
            <View key={n} style={styles.listRow}>
              <Text style={{ color: Colors.gold, fontSize: 22, fontWeight: '700', width: 36 }}>
                {n}
              </Text>
              <Text style={{ color: Colors.text, fontSize: 15, flex: 1, lineHeight: 22 }}>
                {sense}
              </Text>
            </View>
          ))}

          <Pressable style={[styles.nextButton, { marginTop: 28 }]} onPress={() => setStep('movimento')}>
            <Text style={styles.nextButtonText}>Fiz isso → continuar</Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MOVIMENTO ───────────────────────────────────────────────────────────────
  if (step === 'movimento') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView contentContainerStyle={styles.scrollPad}>
          <Text style={styles.stepLabel}>PASSO 4 DE 5</Text>
          <Text style={[styles.bigWord, { color: Colors.text }]}>MOVIMENTO</Text>
          <Text style={styles.stepInstruction}>
            Movimente o corpo para interromper o ciclo de fissura:
          </Text>

          {[
            'Caminhe por 2 minutos (mesmo dentro de casa)',
            'Faça 10 agachamentos ou polichinelos',
            'Suba e desça escadas 2 vezes',
            'Faça alongamentos por 2 minutos',
          ].map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={{ color: Colors.emergency, fontSize: 18, width: 28 }}>→</Text>
              <Text style={{ color: Colors.text, fontSize: 15, flex: 1, lineHeight: 22 }}>
                {item}
              </Text>
            </View>
          ))}

          <Text
            style={{ color: Colors.muted, fontSize: 13, marginTop: 16, textAlign: 'center' }}
          >
            Escolha qualquer uma. Qualquer movimento conta.
          </Text>

          <Pressable style={[styles.nextButton, { marginTop: 28 }]} onPress={() => setStep('estrutura')}>
            <Text style={styles.nextButtonText}>Fiz isso → continuar</Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── ESTRUTURA 72h ───────────────────────────────────────────────────────────
  if (step === 'estrutura') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <ScrollView contentContainerStyle={styles.scrollPad}>
          <Text style={styles.stepLabel}>PASSO 5 DE 5</Text>
          <Text style={[styles.bigWord, { color: Colors.text }]}>ESTRUTURA 72h</Text>
          <Text style={styles.stepInstruction}>
            Organize as próximas 72 horas para se manter seguro:
          </Text>

          {[
            'Ligue para alguém de confiança agora',
            'Evite o ambiente ou situação que desencadeou a crise',
            'Planeje cada refeição das próximas 24 horas',
            'Durma e acorde em horário fixo esta noite',
            'Marque uma consulta se não tiver psicólogo ainda',
          ].map((item, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={{ color: Colors.gold, fontSize: 16, width: 28 }}>✓</Text>
              <Text style={{ color: Colors.text, fontSize: 15, flex: 1, lineHeight: 22 }}>
                {item}
              </Text>
            </View>
          ))}

          <View style={styles.cvvBox}>
            <Text style={{ color: Colors.gold, fontWeight: '600', fontSize: 14 }}>
              CVV — 188 (24h, gratuito, sigiloso)
            </Text>
            <Pressable onPress={() => Linking.openURL('tel:188')} style={{ marginTop: 4 }}>
              <Text style={{ color: Colors.emergency, fontSize: 13 }}>Ligar para o CVV</Text>
            </Pressable>
            <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 4 }}>
              CAPS — caps.ms/onde-buscar-ajuda
            </Text>
          </View>

          <Text style={styles.disclaimer}>
            Este app não substitui psiquiatra, psicólogo ou grupos de apoio.
          </Text>

          <Pressable style={[styles.nextButton, { marginTop: 8 }]} onPress={reset}>
            <Text style={styles.nextButtonText}>Protocolo concluído</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  centerPad: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollPad: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  screenTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  screenSub: {
    color: Colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  fieldLabel: {
    color: Colors.muted,
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  limitBox: {
    backgroundColor: `${Colors.emergency}1a`,
    borderWidth: 1,
    borderColor: Colors.emergency,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
  },
  stepLabel: {
    color: Colors.emergency,
    fontFamily: 'JetBrainsMono',
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 12,
    textAlign: 'center',
  },
  bigWord: {
    fontWeight: '700',
    fontSize: 64,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepInstruction: {
    color: Colors.mutedLight,
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 32,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 24,
    padding: 8,
  },
  sosLaunchButton: {
    backgroundColor: Colors.emergency,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  sosLaunchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cvvBox: {
    backgroundColor: `${Colors.gold}11`,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  disclaimer: {
    color: Colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
