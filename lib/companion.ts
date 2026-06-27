/**
 * Cliente do Companheiro de Apoio Proativo.
 *
 * Conversa com a Edge Function `companion-chat` (server-side: conduz o LLM,
 * detecta crise e persiste tudo respeitando RLS). As chaves de LLM nunca chegam
 * ao cliente. Segue o mesmo padrão de chamada usado em lib/stripe.ts.
 */

export interface CompanionReply {
  conversationId: string;
  reply: string;
  /** true quando a function acionou o protocolo de escalonamento de crise. */
  escalated: boolean;
  /** true quando todos os provedores de LLM falharam (resposta de contingência). */
  degraded?: boolean;
  providerUsed?: string;
}

export interface SendCompanionMessageArgs {
  message: string;
  /** Continua uma conversa existente; omita para iniciar uma nova. */
  conversationId?: string | null;
  /** JWT do usuário (session.access_token). */
  accessToken: string;
}

/**
 * Envia uma mensagem ao Companheiro e retorna a resposta.
 * Lança em caso de falha de rede/HTTP — a tela trata exibindo um fallback seguro.
 */
export async function sendCompanionMessage(
  { message, conversationId, accessToken }: SendCompanionMessageArgs,
): Promise<CompanionReply> {
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!baseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurado.');

  const response = await fetch(`${baseUrl}/functions/v1/companion-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message,
      conversationId: conversationId ?? undefined,
    }),
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? ` — ${body.error}` : '';
    } catch {
      // corpo não-JSON; ignora
    }
    throw new Error(`companion-chat falhou (HTTP ${response.status})${detail}`);
  }

  return (await response.json()) as CompanionReply;
}
