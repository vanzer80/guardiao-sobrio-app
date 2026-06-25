/**
 * Edge Function: companion-chat
 *
 * Backend conversacional do Companheiro de Apoio Proativo (ADR-0002).
 * Roda server-side (Deno). As chaves de LLM nunca chegam ao cliente.
 *
 * POST /functions/v1/companion-chat
 * Headers: Authorization: Bearer <access_token>
 * Body: { message: string, conversationId?: string }
 *
 * Resposta: {
 *   conversationId: string,
 *   reply: string,
 *   escalated: boolean,      // true se acionou escalonamento de crise
 *   degraded?: boolean,      // true se todos os provedores de LLM falharam
 *   providerUsed?: string
 * }
 *
 * Ordem de segurança (ADR-0002 D3): a detecção de crise roda ANTES da conversa
 * normal e não depende do LLM.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { generateReply, type ChatMessage } from './provider.ts';
import { buildMessages, providerFailureResponse } from './prompts.ts';
import { crisisResponse, detectCrisis } from './crisis.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_MESSAGE_LEN = 4000;
const HISTORY_LIMIT = 20;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // 1. Autenticação — valida o JWT do usuário chamante
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    // 2. Validar body
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const conversationIdIn = typeof body?.conversationId === 'string' ? body.conversationId : null;

    if (!message) return json({ error: 'Campo "message" é obrigatório.' }, 400);
    if (message.length > MAX_MESSAGE_LEN) {
      return json({ error: `Mensagem muito longa (máx ${MAX_MESSAGE_LEN} caracteres).` }, 400);
    }

    // 3. Cliente service_role para escrever respeitando a auditoria (bypass RLS,
    //    mas SEMPRE filtrando por user.id — o usuário só toca os próprios dados).
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 4. Resolver conversa (validar posse se veio do cliente; senão criar)
    let conversationId = conversationIdIn;
    if (conversationId) {
      const { data: conv } = await admin
        .from('companion_conversations')
        .select('id, user_id')
        .eq('id', conversationId)
        .single();
      if (!conv || conv.user_id !== user.id) {
        return json({ error: 'Conversa não encontrada.' }, 404);
      }
    } else {
      const { data: conv, error: convErr } = await admin
        .from('companion_conversations')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      if (convErr || !conv) return json({ error: 'Falha ao criar conversa.' }, 500);
      conversationId = conv.id as string;
    }

    // 5. Identidade (Camada 1) — opcional
    const { data: profile } = await admin
      .from('companion_profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();
    const displayName = (profile?.display_name as string | null) ?? null;

    // 6. Carregar histórico recente ANTES de inserir a mensagem atual
    //    (evita duplicar a mensagem do usuário no prompt).
    const { data: histRows } = await admin
      .from('companion_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT);
    // Busca as N mais RECENTES (desc) e reinverte para ordem cronológica.
    const history: ChatMessage[] = (histRows ?? [])
      .reverse()
      .map((r) => ({
        role: r.role as 'user' | 'assistant',
        content: r.content as string,
      }));

    // 7. Persistir a mensagem do usuário (durabilidade antes de chamar o LLM)
    await admin.from('companion_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: message,
    });

    // 8. SEGURANÇA PRIMEIRO: detecção determinística de crise grave
    const crisis = detectCrisis(message);
    if (crisis.isCrisis) {
      const reply = crisisResponse(displayName);

      await admin.from('companion_messages').insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: reply,
      });

      await admin.from('companion_crisis_events').insert({
        user_id: user.id,
        conversation_id: conversationId,
        severity: crisis.severity,
        action_taken: 'Encaminhado para CVV 188 / SAMU 192 (resposta determinística)',
        resolved: null,
      });

      await admin
        .from('companion_conversations')
        .update({ crisis_level: 9, outcome: 'escalado' })
        .eq('id', conversationId);

      return json({ conversationId, reply, escalated: true });
    }

    // 9. Conversa normal — chama o LLM (primário → fallback)
    const messages = buildMessages({ displayName, history, userMessage: message });

    let reply: string;
    let providerUsed: string | undefined;
    let degraded = false;
    try {
      const result = await generateReply(messages);
      reply = result.reply;
      providerUsed = result.providerUsed;
    } catch (err) {
      // Todos os provedores falharam → resposta segura (não devolve 500 ao usuário).
      console.error('companion-chat: todos os provedores falharam:', err);
      reply = providerFailureResponse(displayName);
      degraded = true;
    }

    // 10. Persistir a resposta do assistant
    await admin.from('companion_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'assistant',
      content: reply,
    });

    return json({ conversationId, reply, escalated: false, degraded, providerUsed });
  } catch (err) {
    console.error('companion-chat error:', err);
    return json({ error: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
