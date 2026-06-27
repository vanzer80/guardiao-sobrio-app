/**
 * Tela: Companheiro de Apoio Proativo (chat)
 *
 * Chat de apoio para momentos de fissura. Consome a Edge Function companion-chat
 * (lib/companion.ts). A detecção/escalonamento de crise é feita no servidor; aqui
 * destacamos o estado de crise com um banner de recursos acionáveis.
 *
 * Disponível a todos os usuários autenticados (decisão de escopo). Aditivo:
 * rota avulsa /companheiro, sem alterar a navegação por abas.
 */
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { sendCompanionMessage } from '@/lib/companion';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INTRO: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  content:
    'Oi. Eu sou seu companheiro de apoio aqui no app — pode falar comigo sobre o que estiver sentindo, sem julgamento. Não sou terapeuta e não substituo ajuda profissional, mas estou aqui pra te ajudar a atravessar o momento. Como você está agora?',
};

const FALLBACK =
  'Tive um problema técnico agora e não consegui responder direito. Se este é um momento difícil, tente algo que costuma te ajudar: respirar fundo, sair do ambiente ou ligar pra alguém de confiança. Se o risco for grande, ligue para o CVV no 188 (24h). Me manda de novo daqui a pouco.';

export default function CompanheiroScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const accessToken = session?.access_token;

  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(0);
  const nextId = () => String(++idRef.current);

  const append = (msg: ChatMessage) => setMessages((prev) => [...prev, msg]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    append({ id: nextId(), role: 'user', content: text });
    setInput('');
    setSending(true);

    try {
      if (!accessToken) throw new Error('Sessão expirada. Entre novamente.');
      const res = await sendCompanionMessage({ message: text, conversationId, accessToken });
      setConversationId(res.conversationId);
      setEscalated(res.escalated);
      append({ id: nextId(), role: 'assistant', content: res.reply });
    } catch {
      append({ id: nextId(), role: 'assistant', content: FALLBACK });
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <Text style={{ fontFamily: 'CormorantGaramond', color: Colors.gold, fontSize: 32 }}>
            Companheiro
          </Text>
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={{ color: Colors.muted, fontSize: 13 }}>← Voltar</Text>
          </Pressable>
        </View>
        <Text style={{ color: Colors.mutedDark, fontSize: 12, paddingHorizontal: 24, marginBottom: 8 }}>
          Apoio complementar — não substitui ajuda profissional.
        </Text>

        {/* Mensagens */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <View
                key={m.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  backgroundColor: isUser ? `${Colors.gold}1f` : Colors.surfaceRaised,
                  borderWidth: 1,
                  borderColor: isUser ? `${Colors.gold}55` : Colors.border,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: Colors.text, fontSize: 15, lineHeight: 22 }}>{m.content}</Text>
              </View>
            );
          })}

          {sending && (
            <View
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: Colors.surfaceRaised,
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <ActivityIndicator size="small" color={Colors.gold} />
              <Text style={{ color: Colors.muted, fontSize: 13 }}>escrevendo…</Text>
            </View>
          )}
        </ScrollView>

        {/* Banner de escalonamento de crise */}
        {escalated && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              backgroundColor: `${Colors.emergency}1a`,
              borderWidth: 1,
              borderColor: `${Colors.emergency}66`,
              borderRadius: 14,
              padding: 14,
              gap: 10,
            }}
          >
            <Text style={{ color: Colors.emergency, fontSize: 13, fontWeight: '700' }}>
              Você não está sozinho. Fale com alguém agora:
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => Linking.openURL('tel:188')}
                accessibilityRole="button"
                accessibilityLabel="Ligar para o CVV, 188"
                style={{
                  flex: 1,
                  backgroundColor: Colors.emergency,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: Colors.bg, fontWeight: '700' }}>CVV 188</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL('tel:192')}
                accessibilityRole="button"
                accessibilityLabel="Ligar para o SAMU, 192"
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: Colors.emergency,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: Colors.emergency, fontWeight: '700' }}>SAMU 192</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            backgroundColor: Colors.surface,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escreva o que está sentindo…"
            placeholderTextColor={Colors.mutedDark}
            multiline
            maxLength={4000}
            style={{
              flex: 1,
              maxHeight: 120,
              color: Colors.text,
              backgroundColor: Colors.surfaceRaised,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 15,
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
            style={{
              backgroundColor: !input.trim() || sending ? Colors.goldDim : Colors.gold,
              borderRadius: 12,
              paddingHorizontal: 18,
              paddingVertical: 12,
              opacity: !input.trim() || sending ? 0.6 : 1,
            }}
          >
            <Text style={{ color: Colors.bg, fontWeight: '700' }}>Enviar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
