/**
 * Programa 30 Dias — O Guardião Sobrio
 *
 * Plano Guardião (exclusive).
 * Cada dia: 1 fundamento (ciclo pelos 13) + 1 protocolo de foco + 1 prompt de reflexão.
 * Conteúdo desbloqueado progressivamente — dia N só aparece se N-1 foi concluído.
 *
 * Fonte de conteúdo: guardiao-sobrio-docs/fundamentos/13-fundamentos.md
 */

import { FUNDAMENTOS, PROMPTS, type Fundamento } from './fundamentos';

export type DiaProgramaStatus = 'locked' | 'available' | 'completed';

export interface DiaPrograma {
  dia: number;
  fundamento: Fundamento;
  protocolo: string;
  prompt: string;
}

// Protocolo de foco por dia — rota pelos 5 passos do protocolo de emergência como
// prática preventiva diária (não de crise). Tom diferente: construção, não emergência.
const PROTOCOLOS_DIARIOS: string[] = [
  'Hoje pratique o PARE: antes de qualquer decisão, pause por 3 segundos. Observe o impulso sem agir automaticamente.',
  'Hoje pratique o RESPIRE: 3 ciclos de respiração 4-4-6 antes de uma refeição. Âncora no corpo, não na urgência.',
  'Hoje pratique o CONTATO: envie uma mensagem de check-in para alguém da sua rede. Sem agenda, só presença.',
  'Hoje pratique o MOVIMENTO: 10 minutos de caminhada intencional. O corpo se move, a mente segue.',
  'Hoje pratique a ESTRUTURA: defina os 3 horários-âncora do seu dia. Estrutura é proteção.',
];

function getProtocoloDoDia(dia: number): string {
  return PROTOCOLOS_DIARIOS[(dia - 1) % PROTOCOLOS_DIARIOS.length];
}

function getPromptDoDia(dia: number, fundamento: Fundamento): string {
  const pillarPrompts = PROMPTS[fundamento.pilar === 'TÁTICA' ? 'TÁTICA' : fundamento.pilar];
  const base = pillarPrompts[(dia - 1) % pillarPrompts.length];
  return base;
}

export function getDiaPrograma(dia: number): DiaPrograma {
  const idx = (dia - 1) % FUNDAMENTOS.length;
  const fundamento = FUNDAMENTOS[idx];
  return {
    dia,
    fundamento,
    protocolo: getProtocoloDoDia(dia),
    prompt: getPromptDoDia(dia, fundamento),
  };
}

export function getDiasPrograma(): DiaPrograma[] {
  return Array.from({ length: 30 }, (_, i) => getDiaPrograma(i + 1));
}

export function getDiaStatus(
  dia: number,
  diasCompletos: Set<number>,
): DiaProgramaStatus {
  if (diasCompletos.has(dia)) return 'completed';
  // Dia 1 sempre disponível; demais exigem o anterior completo
  if (dia === 1 || diasCompletos.has(dia - 1)) return 'available';
  return 'locked';
}

export function calcularProgresso(diasCompletos: Set<number>): {
  completados: number;
  percentual: number;
  certificadoDisponivel: boolean;
} {
  const completados = diasCompletos.size;
  const percentual = Math.round((completados / 30) * 100);
  return {
    completados,
    percentual,
    certificadoDisponivel: completados >= 30,
  };
}
