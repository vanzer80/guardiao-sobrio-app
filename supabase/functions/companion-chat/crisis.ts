/**
 * Companion Chat — Camada de segurança: detecção de crise grave + escalonamento
 *
 * Decisão ADR-0002 (D3) / spec §5.1: o escalonamento é a FEATURE TÉCNICA Nº 1 e
 * NÃO PODE depender do LLM acertar. Esta camada é determinística: roda antes da
 * conversa normal e, diante de sinais de risco grave (ideação suicida,
 * autoagressão, emergência), encaminha direto para recursos humanos/de crise.
 *
 * ⚠️ Heurística de primeira passada — REVISÃO CLÍNICA PENDENTE (spec §2 [EM ABERTO]).
 *    Erra a favor da cautela: na dúvida, mostra recursos. Lista de sinais e copy
 *    devem ser revisadas por profissional de saúde mental antes do lançamento.
 *
 * Recursos (Brasil) — verificar periodicamente que seguem ativos:
 *   CVV  188  — Centro de Valorização da Vida, 24h, ligação gratuita / chat cvv.org.br
 *   SAMU 192  — emergência médica
 *   Emergência 190 — Polícia Militar
 *   CAPS — Centro de Atenção Psicossocial (rede pública / SUS)
 */

export type CrisisSeverity = 'grave' | 'none';

export interface CrisisResult {
  isCrisis: boolean;
  severity: CrisisSeverity;
  matched: string[];
}

/** Normaliza para casar sinais sem depender de acento/caixa/pontuação. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (combining diacritical marks)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sinais de RISCO GRAVE em PT-BR. Mantidos como regex para tolerar variações.
 * NÃO é lista exaustiva nem definitiva — é o piso de segurança.
 */
const HIGH_RISK_PATTERNS: { id: string; re: RegExp }[] = [
  { id: 'ideacao_morrer', re: /\b(quero|vou|penso em|pensando em|prefiro) (morrer|sumir pra sempre|nao acordar)\b/ },
  { id: 'nao_viver', re: /\bnao (quero|aguento|consigo) (mais )?viver\b/ },
  { id: 'tirar_a_vida', re: /\b(tirar (a )?minha vida|acabar com (a )?minha vida|dar fim a (minha )?vida)\b/ },
  { id: 'suicidio', re: /\b(me suicidar|suicidio|me matar|cometer suicidio)\b/ },
  { id: 'autoagressao', re: /\b(me cortar|me machucar|me ferir|me cortando)\b/ },
  { id: 'plano_metodo', re: /\b(tomei (todos os|os) (comprimidos|remedios)|vou me jogar|me enforcar|overdose)\b/ },
  { id: 'sem_saida', re: /\b(nao tem (mais )?saida|nao aguento mais (essa )?dor|melhor (sem mim|eu nao existir))\b/ },
];

/**
 * Idiomatismos benignos que contêm "matar/morrer" mas NÃO são risco.
 * Se a mensagem casar um sinal mas também for claramente idiomática, suprime.
 * (Cobertura parcial — a copy de escalonamento é acolhedora justamente porque
 *  um falso positivo ocasional não machuca; um falso negativo, sim.)
 */
const BENIGN_PATTERNS: RegExp[] = [
  /\bmorrer de (rir|rindo|fome|sono|calor|frio|amor|saudade|tedio|vergonha)\b/,
  /\bmatar (a (saudade|fome|sede)|o tempo|a aula|a charada)\b/,
  /\bde morrer\b/, // "uma dor de morrer", "festa de morrer" (ênfase coloquial)
];

export function detectCrisis(rawText: string): CrisisResult {
  const text = normalize(rawText);
  if (!text) return { isCrisis: false, severity: 'none', matched: [] };

  const matched = HIGH_RISK_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.id);

  if (matched.length === 0) {
    return { isCrisis: false, severity: 'none', matched: [] };
  }

  // Se a única evidência for idiomática, suprime (anti falso-positivo leve).
  const isBenign = BENIGN_PATTERNS.some((re) => re.test(text));
  const onlyWeak = matched.every((id) => id === 'sem_saida'); // sinal mais ambíguo
  if (isBenign && onlyWeak) {
    return { isCrisis: false, severity: 'none', matched: [] };
  }

  return { isCrisis: true, severity: 'grave', matched };
}

/**
 * Resposta de escalonamento. Acolhedora, sem minimizar e sem dramatizar.
 * Apresenta recursos humanos como prioridade e é honesta sobre os limites do app.
 */
export function crisisResponse(displayName?: string | null): string {
  const nome = displayName?.trim() ? `, ${displayName.trim()}` : '';
  return [
    `Obrigado por confiar em mim e dizer isso${nome}. O que você está sentindo importa, e você não precisa atravessar isso sozinho.`,
    ``,
    `Eu sou um apoio dentro do app, mas neste momento o mais importante é falar com uma pessoa preparada para te ajudar agora:`,
    ``,
    `• CVV — ligue 188 (24 horas, gratuito e sigiloso) ou converse em cvv.org.br`,
    `• SAMU — 192, se houver risco imediato à sua vida ou de alguém`,
    `• CAPS — procure o Centro de Atenção Psicossocial mais próximo (rede pública/SUS)`,
    `• Emergência — 190`,
    ``,
    `Se puder, fique perto de alguém de confiança e me conta: você está em segurança agora?`,
  ].join('\n');
}
