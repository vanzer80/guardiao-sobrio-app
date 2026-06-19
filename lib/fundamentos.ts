// Conteúdo dos 13 Fundamentos do Método O Guardião Sóbrio.
// Substitua os textos abaixo pelo conteúdo definitivo do docs.
export type Fundamento = {
  id: number;
  titulo: string;
  descricao: string;
  pilar: 'ESPELHO' | 'TÁTICA' | 'ESCUDO';
};

export const FUNDAMENTOS: Fundamento[] = [
  {
    id: 1,
    pilar: 'ESPELHO',
    titulo: 'Um dia de cada vez',
    descricao:
      'A sobriedade não se constrói no futuro. Ela existe apenas hoje. Cada manhã é um novo ponto de partida — independente do que aconteceu ontem.',
  },
  {
    id: 2,
    pilar: 'ESPELHO',
    titulo: 'Honestidade radical',
    descricao:
      'A negação é o maior aliado da dependência. Olhar para si mesmo com honestidade — sem julgamento, mas sem ilusão — é o primeiro ato de cuidado.',
  },
  {
    id: 3,
    pilar: 'ESPELHO',
    titulo: 'Conhecer seus gatilhos',
    descricao:
      'Gatilhos não são fraquezas — são informações. Identificar o que antecede a fissura é a base de qualquer estratégia de proteção.',
  },
  {
    id: 4,
    pilar: 'ESPELHO',
    titulo: 'Aceitar o que não posso mudar',
    descricao:
      'Parte da energia gasta em resistência pode ser redirecionada para adaptação. Aceitar não é desistir — é parar de lutar contra a realidade.',
  },
  {
    id: 5,
    pilar: 'TÁTICA',
    titulo: 'Planejamento de risco',
    descricao:
      'Situações de risco previsíveis precisam de planos concretos. "O que faço se..." é uma pergunta que salva antes da crise chegar.',
  },
  {
    id: 6,
    pilar: 'TÁTICA',
    titulo: 'Pausa antes de agir',
    descricao:
      'Entre o impulso e a ação existe um espaço. Aprender a usar esse espaço — respirar, pausar, escolher — é uma habilidade que se treina.',
  },
  {
    id: 7,
    pilar: 'TÁTICA',
    titulo: 'Pedir ajuda antes de precisar',
    descricao:
      'Pedir ajuda no auge da crise é difícil. Construir o hábito de comunicar quando ainda está bem é o que torna a rede de apoio real.',
  },
  {
    id: 8,
    pilar: 'TÁTICA',
    titulo: 'Celebrar o progresso real',
    descricao:
      'Progresso não é perfeição. Cada dia guardado, cada fissura superada, cada pedido de ajuda feito — esses são atos de coragem que merecem reconhecimento.',
  },
  {
    id: 9,
    pilar: 'ESCUDO',
    titulo: 'Rotina como proteção',
    descricao:
      'Estrutura previsível reduz a exposição a situações de risco. Uma rotina sólida não limita — liberta da energia gasta em decisões desnecessárias.',
  },
  {
    id: 10,
    pilar: 'ESCUDO',
    titulo: 'Cuidar do corpo',
    descricao:
      'Sono, alimentação e movimento não são luxos — são a base fisiológica da regulação emocional. Um corpo negligenciado amplifica a vulnerabilidade.',
  },
  {
    id: 11,
    pilar: 'ESCUDO',
    titulo: 'Conexão real',
    descricao:
      'Isolamento alimenta a dependência. Conexões autênticas — mesmo imperfeitas — são um dos fatores protetores mais estudados na recuperação.',
  },
  {
    id: 12,
    pilar: 'ESCUDO',
    titulo: 'Limites saudáveis',
    descricao:
      'Dizer não a situações, pessoas e ambientes que aumentam o risco não é egoísmo — é autocuidado estratégico.',
  },
  {
    id: 13,
    pilar: 'ESCUDO',
    titulo: 'Propósito além da sobriedade',
    descricao:
      'A sobriedade abre espaço para algo. Saber para quê — uma relação, um projeto, uma versão de si mesmo — dá substância ao esforço diário.',
  },
];

// Prompts diários por pilar — rotativos dentro do pilar da semana
export const PROMPTS: Record<'ESPELHO' | 'TÁTICA' | 'ESCUDO' | 'LIVRE', string[]> = {
  ESPELHO: [
    'O que você observou sobre si mesmo hoje que merece atenção?',
    'Qual padrão você está reconhecendo nesta semana?',
    'O que está funcionando na sua rotina atual?',
    'O que você mudaria se pudesse recomeçar ontem?',
  ],
  TÁTICA: [
    'Que situação de risco você antecipa para os próximos dias? Qual é o seu plano?',
    'Qual foi a última vez que você pediu ajuda antes de precisar urgentemente?',
    'Que estratégia funcionou recentemente e você quer repetir?',
    'O que você faria diferente na última vez que sentiu fissura?',
  ],
  ESCUDO: [
    'Como está sua rotina de sono, alimentação e movimento esta semana?',
    'Com quem você tem mantido conexão real ultimamente?',
    'Que limite você precisou colocar — ou deveria ter colocado — recentemente?',
    'Para quê você está guardando este dia?',
  ],
  LIVRE: [
    'O que você quer registrar deste dia, sem agenda ou análise?',
  ],
};

// Mapeamento do dia da semana para o pilar
const PILAR_BY_WEEKDAY: Record<number, 'ESPELHO' | 'TÁTICA' | 'ESCUDO' | 'LIVRE'> = {
  0: 'LIVRE',   // Domingo
  1: 'ESPELHO', // Segunda
  2: 'TÁTICA',  // Terça
  3: 'ESCUDO',  // Quarta
  4: 'ESPELHO', // Quinta
  5: 'TÁTICA',  // Sexta
  6: 'ESCUDO',  // Sábado
};

export function getPilarHoje(): 'ESPELHO' | 'TÁTICA' | 'ESCUDO' | 'LIVRE' {
  return PILAR_BY_WEEKDAY[new Date().getDay()];
}

export function getPromptHoje(weekSeed = 0): string {
  const pilar = getPilarHoje();
  const prompts = PROMPTS[pilar];
  return prompts[weekSeed % prompts.length];
}

export function getFundamentoDodia(daysSober: number): Fundamento {
  return FUNDAMENTOS[daysSober % FUNDAMENTOS.length];
}
