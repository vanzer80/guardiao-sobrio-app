/**
 * Companion Chat — Abstração de provedor de LLM
 *
 * Decisão ADR-0002 (D2): provedor PRIMÁRIO gratuito + OpenAI como FALLBACK.
 *
 * Toda a lógica de provedor fica atrás da interface `ChatProvider`. A
 * implementação concreta usa a API "chat completions" no formato OpenAI, que é
 * compatível com a maioria dos provedores gratuitos (Groq, OpenRouter, Together,
 * e o endpoint OpenAI-compatible do Gemini). Trocar de provedor = trocar env,
 * sem tocar no handler nem na UI.
 *
 * Chaves de API vêm SOMENTE de Deno.env (nunca do cliente).
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatProvider {
  readonly name: string;
  complete(messages: ChatMessage[], opts?: CompletionOpts): Promise<string>;
}

export interface CompletionOpts {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

const DEFAULTS = {
  temperature: 0.6,
  maxTokens: 600,
  timeoutMs: 20_000,
};

/**
 * Provedor genérico para qualquer API no formato OpenAI Chat Completions.
 */
export class OpenAICompatProvider implements ChatProvider {
  readonly name: string;
  #baseUrl: string;
  #apiKey: string;
  #model: string;

  constructor(params: { name: string; baseUrl: string; apiKey: string; model: string }) {
    this.name = params.name;
    // normaliza: remove barra final para evitar `//chat/completions`
    this.#baseUrl = params.baseUrl.replace(/\/+$/, '');
    this.#apiKey = params.apiKey;
    this.#model = params.model;
  }

  async complete(messages: ChatMessage[], opts: CompletionOpts = {}): Promise<string> {
    const { temperature, maxTokens, timeoutMs } = { ...DEFAULTS, ...opts };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.#baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.#apiKey}`,
        },
        body: JSON.stringify({
          model: this.#model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`[${this.name}] HTTP ${res.status}: ${detail.slice(0, 300)}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || content.trim() === '') {
        throw new Error(`[${this.name}] resposta vazia ou em formato inesperado`);
      }
      return content.trim();
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Monta a cadeia de provedores a partir do ambiente, na ordem de tentativa.
 *
 * Primário (gratuito) — configurável; default Groq (OpenAI-compatible):
 *   COMPANION_PRIMARY_BASE_URL  (default https://api.groq.com/openai/v1)
 *   COMPANION_PRIMARY_API_KEY
 *   COMPANION_PRIMARY_MODEL     (default llama-3.3-70b-versatile)
 *
 * Fallback (OpenAI):
 *   OPENAI_API_KEY
 *   OPENAI_BASE_URL  (default https://api.openai.com/v1)
 *   OPENAI_MODEL     (default gpt-4o-mini)
 *
 * Um provedor só entra na cadeia se tiver API key configurada.
 */
export function buildProviders(): ChatProvider[] {
  const providers: ChatProvider[] = [];

  const primaryKey = Deno.env.get('COMPANION_PRIMARY_API_KEY');
  if (primaryKey) {
    providers.push(
      new OpenAICompatProvider({
        name: 'primary',
        baseUrl: Deno.env.get('COMPANION_PRIMARY_BASE_URL') ?? 'https://api.groq.com/openai/v1',
        apiKey: primaryKey,
        model: Deno.env.get('COMPANION_PRIMARY_MODEL') ?? 'llama-3.3-70b-versatile',
      }),
    );
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (openaiKey) {
    providers.push(
      new OpenAICompatProvider({
        name: 'openai-fallback',
        baseUrl: Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1',
        apiKey: openaiKey,
        model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      }),
    );
  }

  return providers;
}

export interface GenerateResult {
  reply: string;
  providerUsed: string;
}

/**
 * Tenta cada provedor na ordem (primário → fallback). Retorna a primeira
 * resposta bem-sucedida. Lança se nenhum provedor estiver configurado ou se
 * todos falharem (o handler trata isso com uma resposta segura de fallback).
 */
export async function generateReply(
  messages: ChatMessage[],
  opts?: CompletionOpts,
): Promise<GenerateResult> {
  const providers = buildProviders();
  if (providers.length === 0) {
    throw new Error('Nenhum provedor de LLM configurado (defina COMPANION_PRIMARY_API_KEY e/ou OPENAI_API_KEY).');
  }

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const reply = await provider.complete(messages, opts);
      return { reply, providerUsed: provider.name };
    } catch (err) {
      console.error(`Provedor ${provider.name} falhou:`, err);
      errors.push(`${provider.name}: ${String(err)}`);
    }
  }

  throw new Error(`Todos os provedores falharam → ${errors.join(' | ')}`);
}
