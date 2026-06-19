import { getMilestoneLabel, MILESTONE_LABELS, FREE_MONTHLY_LIMIT } from '../lib/protocolo';

describe('getMilestoneLabel', () => {
  it('retorna null para null', () => {
    expect(getMilestoneLabel(null)).toBeNull();
  });

  it('retorna null para 0 dias', () => {
    expect(getMilestoneLabel(0)).toBeNull();
  });

  it('retorna label correto para marcos conhecidos', () => {
    expect(getMilestoneLabel(1)).toBe('1 dia');
    expect(getMilestoneLabel(7)).toBe('1 semana');
    expect(getMilestoneLabel(30)).toBe('1 mês');
    expect(getMilestoneLabel(90)).toBe('3 meses');
    expect(getMilestoneLabel(365)).toBe('1 ano');
  });

  it('retorna null para dias que não são marcos', () => {
    expect(getMilestoneLabel(2)).toBeNull();
    expect(getMilestoneLabel(5)).toBeNull();
    expect(getMilestoneLabel(50)).toBeNull();
    expect(getMilestoneLabel(200)).toBeNull();
  });

  it('todos os marcos do MILESTONE_LABELS têm label não-nulo', () => {
    Object.keys(MILESTONE_LABELS).forEach((dayStr) => {
      const day = Number(dayStr);
      expect(getMilestoneLabel(day)).not.toBeNull();
    });
  });
});

describe('FREE_MONTHLY_LIMIT', () => {
  it('é exatamente 3 (conforme regra de negócio)', () => {
    expect(FREE_MONTHLY_LIMIT).toBe(3);
  });
});
