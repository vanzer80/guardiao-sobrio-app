export type Fundamento = {
  id: number;
  titulo: string;
  pilar: 'ESPELHO' | 'TÁTICA' | 'ESCUDO';
  insight: string;
  descricao: string;
  acaoMinima: string;
  armadilha: string;
  fraseAncora: string;
};

// Conteúdo definitivo — fonte: guardiao-sobrio-docs/fundamentos/13-fundamentos.md
export const FUNDAMENTOS: Fundamento[] = [
  {
    id: 1,
    pilar: 'ESPELHO',
    titulo: 'Identidade',
    insight: 'Comportamento segue identidade. Você age de acordo com quem acredita ser.',
    descricao:
      'Antes de mudar o comportamento, mude a narrativa de si mesmo. Nos primeiros 30 dias, isso é mais urgente do que qualquer técnica: se você ainda se vê como "alguém que parou de beber", vai voltar a beber.',
    acaoMinima:
      'Escreva ou diga em voz alta: "Eu sou uma pessoa que não bebe — e isso protege quem eu amo."',
    armadilha: 'Tentar mudar o hábito sem mudar a identidade.',
    fraseAncora: 'Não estou tentando parar. Estou decidindo quem sou.',
  },
  {
    id: 2,
    pilar: 'ESPELHO',
    titulo: 'Consciência',
    insight: 'Você não pode mudar o que não consegue ver.',
    descricao:
      'Nomear o padrão é o primeiro ato de poder sobre ele. Ver o estrago com clareza, sem se destruir, é o que o Guardião chama de olhar no espelho sem desviar o olhar.',
    acaoMinima:
      'Identifique 1 situação recorrente de gatilho e anote o horário em que ela costuma aparecer. Depois, faça 3 respirações lentas como âncora antes de reagir.',
    armadilha: 'Confundir consciência com julgamento de si mesmo.',
    fraseAncora: 'Nomear o monstro é o primeiro passo para não ser devorado por ele.',
  },
  {
    id: 3,
    pilar: 'ESCUDO',
    titulo: 'Perímetro',
    insight: 'Sem fronteiras, tudo invade.',
    descricao:
      'O perímetro protege o espaço entre o estímulo e a resposta. Fronteiras não são muros — são as regras do jogo que você define para proteger a si mesmo e a quem está perto de você.',
    acaoMinima:
      'Escolha 1 situação concreta que vai ocorrer esta semana e decida agora como vai responder. Escreva a frase exata que vai usar.',
    armadilha: 'Justificar demais o "não". Proteção: frase curta, sem debate.',
    fraseAncora: 'Meu "não" respeita meu "sim".',
  },
  {
    id: 4,
    pilar: 'TÁTICA',
    titulo: 'Gatilhos',
    insight: 'Todo comportamento compulsivo tem um gatilho identificável.',
    descricao:
      'Conhecer seus gatilhos é ter vantagem estratégica. Nos primeiros 30 dias, o mapa de gatilhos é o documento mais importante que você vai escrever. Final da tarde, cansaço, brigas, insegurança — cada um precisa ter um plano de resposta.',
    acaoMinima:
      'Liste 3 situações que antecedem o impulso, anotando horário, lugar e emoção presente. Inclua pelo menos 1 gatilho do final da tarde ou noite.',
    armadilha: 'Evitar os gatilhos indefinidamente em vez de desenvolver resposta a eles.',
    fraseAncora: 'Quem conhece o gatilho, escolhe a resposta.',
  },
  {
    id: 5,
    pilar: 'ESCUDO',
    titulo: 'Ambiente',
    insight: 'O ambiente é mais poderoso que a força de vontade.',
    descricao:
      'Reorganize o ambiente antes de confiar na disciplina. O ambiente inclui pessoas, rotinas e objetos. Nos primeiros 30 dias, a força de vontade é um recurso escasso — o design do ambiente compensa essa escassez.',
    acaoMinima:
      'Remova ou mova 1 item físico que facilita o comportamento. Combine com alguém da família 1 ajuste concreto no ambiente da casa.',
    armadilha: 'Acreditar que força de vontade substitui design de ambiente.',
    fraseAncora: 'Não confie na vontade. Design o ambiente.',
  },
  {
    id: 6,
    pilar: 'ESCUDO',
    titulo: 'Comunidade',
    insight: 'Somos produto das 5 pessoas com quem mais convivemos.',
    descricao:
      'O isolamento é um dos maiores aceleradores de recaída. Comunidade não é só "grupo de apoio formal" — é o cônjuge que sabe o que está acontecendo, o amigo que não oferece bebida, o terapeuta que conhece o histórico.',
    acaoMinima:
      '1 interação genuína (mensagem, ligação, conversa presencial) com alguém que apoia sua sobriedade — pode ser cônjuge, terapeuta ou outro em recuperação.',
    armadilha: 'Buscar comunidade perfeita em vez de comunidade real.',
    fraseAncora: 'Você não precisa fazer isso sozinho. Mas precisa escolher com quem faz.',
  },
  {
    id: 7,
    pilar: 'ESPELHO',
    titulo: 'Propósito',
    insight: 'Dor sem significado é insuportável. Dor com propósito é combustível.',
    descricao:
      'Conectar a sobriedade a algo maior que a abstinência. Nos primeiros 30 dias, o propósito não precisa ser grandioso — pode ser "estar presente para o meu filho hoje".',
    acaoMinima:
      'Complete a frase: "Estou sóbrio para..." — e inclua pelo menos 1 pessoa real pelo nome. Releia ao final da tarde, quando o impulso costuma ser mais forte.',
    armadilha: 'Usar o propósito como pressão em vez de bússola.',
    fraseAncora: 'Não estou parando por mim. Estou construindo por nós.',
  },
  {
    id: 8,
    pilar: 'TÁTICA',
    titulo: 'Corpo',
    insight: 'O corpo guarda o score. Trauma, tensão e ansiedade vivem no físico.',
    descricao:
      'Cuidar do corpo é parte do protocolo de recuperação, não bônus. Nos primeiros 30 dias, o corpo ainda está processando a ausência do álcool — ansiedade, insônia e irritabilidade são físicos, não só mentais.',
    acaoMinima:
      '10 minutos de movimento físico intencional (caminhada, alongamento). Em crise: 5 respirações lentas com exalação prolongada (inspirar 4s, expirar 8s).',
    armadilha: 'Tratar o corpo como ferramenta e não como parceiro.',
    fraseAncora: 'Seu corpo não é o inimigo. É o primeiro aliado.',
  },
  {
    id: 9,
    pilar: 'ESPELHO',
    titulo: 'Emoção',
    insight: 'Emoções não processadas buscam saída. Geralmente a pior saída.',
    descricao:
      'O que não é sentido, é anestesiado. Emoções reprimidas não somem — vazam nas relações: irritação excessiva, distanciamento, explosões. Sentir com consciência é uma prática, não um estado permanente.',
    acaoMinima:
      'Pare por 2 minutos, feche os olhos e nomeie 1 emoção que está evitando sentir. Sem julgar. Apenas observe e respire.',
    armadilha: 'Confundir expressão emocional com fraqueza.',
    fraseAncora: 'O que você não sente, você bebe.',
  },
  {
    id: 10,
    pilar: 'TÁTICA',
    titulo: 'Ciclos',
    insight: 'O cérebro funciona em ciclos; cobrança excessiva ativa medo e bloqueia aprendizado.',
    descricao:
      'Cobrar como máquina vira gatilho de recaída. Nos primeiros 30 dias, a sensação de "não estou rendendo nada" é normal — o cérebro está se reorganizando. Descanso planejado não é abandono da disciplina — é parte do método.',
    acaoMinima:
      'Planeje 1 momento de recuperação esta semana (descanso, caminhada leve, atividade prazerosa sem risco). Coloque na agenda como compromisso.',
    armadilha: 'Usar os ciclos como desculpa para abandonar a disciplina; ou ignorar o descanso e explodir.',
    fraseAncora: 'Descansar não é desistir. É estratégia.',
  },
  {
    id: 11,
    pilar: 'ESCUDO',
    titulo: 'Expressão',
    insight: 'Emoção guardada acumula e vira sintoma.',
    descricao:
      'Emoção reprimida vira gatilho para busca de escape. Expressar o que está acontecendo — para o cônjuge, para o terapeuta, para si mesmo em voz alta — é também proteger a relação. Quem não fala, explode.',
    acaoMinima:
      'Expressar 1 coisa difícil com honestidade — para você mesmo no diário, ou para alguém de confiança.',
    armadilha: 'Explodir. Proteção: expressar com firmeza e baixo volume.',
    fraseAncora: 'Sentir é sagrado; expressar é libertador.',
  },
  {
    id: 12,
    pilar: 'TÁTICA',
    titulo: 'Consistência',
    insight: 'Motivação é consequência do progresso, não o contrário.',
    descricao:
      'Esperar motivação para agir é uma brecha. Nos primeiros 30 dias, a consistência não é heroísmo — é aparecer para as pequenas ações mesmo sem vontade. Cada dia sóbrio reconstrói a autoestima junto com a identidade.',
    acaoMinima:
      'Escolha 1 hábito mínimo de "pessoa sóbria" e faça hoje, independente de como se sente. Não negocie o básico.',
    armadilha: 'Aguardar inspiração para começar.',
    fraseAncora: 'Motivação é consequência — não combustível.',
  },
  {
    id: 13,
    pilar: 'TÁTICA',
    titulo: 'Repetição',
    insight: 'Mudança sustentável vem da repetição, não da intensidade.',
    descricao:
      'A identidade sóbria nasce da repetição visível. Cada ação repetida envia um sinal para você mesmo — e para quem convive com você. A família reconstrói a confiança vendo consistência, não ouvindo promessas.',
    acaoMinima:
      'Um hábito de "pessoa sóbria" (ex: sono regular, hidratação, honestidade diária) — faça hoje e marque no calendário.',
    armadilha: 'Desistir por falta de sentimento imediato.',
    fraseAncora: 'A identidade sóbria nasce da repetição, não da intensidade.',
  },
];

// Prompts por pilar — alinhados com os fundamentos reais
export const PROMPTS: Record<'ESPELHO' | 'TÁTICA' | 'ESCUDO' | 'LIVRE', string[]> = {
  ESPELHO: [
    'O que você observou sobre si mesmo hoje que ainda não nomeou?',
    'Qual narrativa sobre quem você é ainda precisa ser revisada?',
    'Complete: "Estou sóbrio para..." — inclua pelo menos 1 pessoa real pelo nome.',
    'O que você está evitando sentir? Apenas observe, sem julgamento.',
  ],
  TÁTICA: [
    'Que situação de risco você antecipa nos próximos dias? Qual é seu plano exato?',
    'Qual gatilho apareceu recentemente? Qual foi sua resposta — e o que mudaria?',
    'Que ação mínima de "pessoa sóbria" você vai fazer hoje, independente de como se sente?',
    'Como está seu corpo? Sono, alimentação, movimento — nomeie 1 que precisa de atenção.',
  ],
  ESCUDO: [
    'Com quem você tem mantido conexão genuína esta semana?',
    'Que limite você precisou colocar — ou deveria ter colocado — recentemente?',
    'O que você está guardando em vez de expressar? Para quem poderia dizer?',
    'Planeje 1 momento de recuperação para esta semana. Coloque na agenda agora.',
  ],
  LIVRE: [
    'O que você quer registrar deste dia, sem análise nem agenda?',
    'Escolha um pilar (ESPELHO, TÁTICA ou ESCUDO) e escreva livremente sobre ele.',
    'O que foi mais difícil esta semana? O que foi mais fácil?',
    'Escreva uma mensagem para você mesmo daqui a 30 dias.',
  ],
};

// Mapeamento dia da semana → pilar
const PILAR_BY_WEEKDAY: Record<number, 'ESPELHO' | 'TÁTICA' | 'ESCUDO' | 'LIVRE'> = {
  0: 'LIVRE',   // Dom
  1: 'ESPELHO', // Seg
  2: 'TÁTICA',  // Ter
  3: 'ESCUDO',  // Qua
  4: 'ESPELHO', // Qui
  5: 'TÁTICA',  // Sex
  6: 'ESCUDO',  // Sáb
};

export function getPilarHoje(): 'ESPELHO' | 'TÁTICA' | 'ESCUDO' | 'LIVRE' {
  return PILAR_BY_WEEKDAY[new Date().getDay()];
}

export function getPromptHoje(seed = 0): string {
  const pilar = getPilarHoje();
  const prompts = PROMPTS[pilar];
  return prompts[seed % prompts.length];
}

export function getFundamentoDodia(daysSober: number): Fundamento {
  return FUNDAMENTOS[daysSober % FUNDAMENTOS.length];
}

// Plano free: apenas os 3 primeiros fundamentos liberados
export const FREE_FUNDAMENTOS_LIMIT = 3;

export function isFundamentoLocked(id: number, isPremium: boolean): boolean {
  return !isPremium && id > FREE_FUNDAMENTOS_LIMIT;
}
