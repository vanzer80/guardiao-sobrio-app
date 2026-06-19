import {
  FUNDAMENTOS,
  isFundamentoLocked,
  getFundamentoDodia,
  FREE_FUNDAMENTOS_LIMIT,
} from '../lib/fundamentos';

describe('FUNDAMENTOS dataset', () => {
  it('tem exatamente 13 fundamentos', () => {
    expect(FUNDAMENTOS).toHaveLength(13);
  });

  it('IDs são sequenciais de 1 a 13', () => {
    FUNDAMENTOS.forEach((f, i) => {
      expect(f.id).toBe(i + 1);
    });
  });

  it('todos têm título, insight, acaoMinima e fraseAncora não-vazios', () => {
    FUNDAMENTOS.forEach((f) => {
      expect(f.titulo.trim()).not.toBe('');
      expect(f.insight.trim()).not.toBe('');
      expect(f.acaoMinima.trim()).not.toBe('');
      expect(f.fraseAncora.trim()).not.toBe('');
    });
  });

  it('cada fundamento pertence a um pilar válido', () => {
    const pilares = ['ESPELHO', 'TÁTICA', 'ESCUDO'];
    FUNDAMENTOS.forEach((f) => {
      expect(pilares).toContain(f.pilar);
    });
  });
});

describe('isFundamentoLocked', () => {
  it('plano free: fundamentos 1-3 desbloqueados', () => {
    for (let id = 1; id <= FREE_FUNDAMENTOS_LIMIT; id++) {
      expect(isFundamentoLocked(id, false)).toBe(false);
    }
  });

  it('plano free: fundamentos 4-13 bloqueados', () => {
    for (let id = FREE_FUNDAMENTOS_LIMIT + 1; id <= 13; id++) {
      expect(isFundamentoLocked(id, false)).toBe(true);
    }
  });

  it('plano premium: todos os 13 fundamentos desbloqueados', () => {
    for (let id = 1; id <= 13; id++) {
      expect(isFundamentoLocked(id, true)).toBe(false);
    }
  });

  it('FREE_FUNDAMENTOS_LIMIT é 3 (conforme regra de negócio)', () => {
    expect(FREE_FUNDAMENTOS_LIMIT).toBe(3);
  });
});

describe('getFundamentoDodia', () => {
  it('retorna fundamento do dia para 0 dias', () => {
    const f = getFundamentoDodia(0);
    expect(f).toBeDefined();
    expect(f.id).toBeGreaterThanOrEqual(1);
  });

  it('cicla corretamente — dia 13 e dia 26 retornam o mesmo fundamento', () => {
    const f13 = getFundamentoDodia(13);
    const f26 = getFundamentoDodia(26);
    expect(f13.id).toBe(f26.id);
  });

  it('dia 0 e dia 13 retornam o mesmo fundamento (ciclo completo)', () => {
    const f0 = getFundamentoDodia(0);
    const f13 = getFundamentoDodia(13);
    expect(f0.id).toBe(f13.id);
  });

  it('dias diferentes dentro do ciclo retornam fundamentos diferentes', () => {
    const ids = Array.from({ length: 13 }, (_, i) => getFundamentoDodia(i).id);
    const unique = new Set(ids);
    expect(unique.size).toBe(13);
  });

  it('retorna sempre um fundamento válido para qualquer número de dias', () => {
    [0, 1, 13, 99, 365, 1000].forEach((days) => {
      const f = getFundamentoDodia(days);
      expect(f).toBeDefined();
      expect(FUNDAMENTOS.some((x) => x.id === f.id)).toBe(true);
    });
  });
});
