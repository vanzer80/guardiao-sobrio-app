import { PLAN_FEATURES, PRICING, type PlanType } from '../lib/types.monetization';

const PLANS: PlanType[] = ['free', 'essential', 'guardian'];

describe('PLAN_FEATURES', () => {
  it('todos os planos têm checklist e contador', () => {
    PLANS.forEach((plan) => {
      expect(PLAN_FEATURES[plan].dailyChecklist).toBe(true);
      expect(PLAN_FEATURES[plan].sobrietyCounter).toBe(true);
    });
  });

  it('plano free: SOS limitado a 3/mês', () => {
    expect(PLAN_FEATURES.free.emergencyProtocol).toBe(3);
  });

  it('planos pagos: SOS ilimitado', () => {
    expect(PLAN_FEATURES.essential.emergencyProtocol).toBe(-1);
    expect(PLAN_FEATURES.guardian.emergencyProtocol).toBe(-1);
  });

  it('plano free: diário limitado a 7 dias', () => {
    expect(PLAN_FEATURES.free.diaryPrompts).toBe(7);
  });

  it('planos pagos: diário ilimitado', () => {
    expect(PLAN_FEATURES.essential.diaryPrompts).toBe(-1);
    expect(PLAN_FEATURES.guardian.diaryPrompts).toBe(-1);
  });

  it('plano free: apenas 3 fundamentos', () => {
    expect(PLAN_FEATURES.free.foundamentals).toBe(3);
  });

  it('planos pagos: todos os 13 fundamentos', () => {
    expect(PLAN_FEATURES.essential.foundamentals).toBe(13);
    expect(PLAN_FEATURES.guardian.foundamentals).toBe(13);
  });

  it('mapa de gatilhos: apenas essential e guardian', () => {
    expect(PLAN_FEATURES.free.triggerMap).toBe(false);
    expect(PLAN_FEATURES.essential.triggerMap).toBe(true);
    expect(PLAN_FEATURES.guardian.triggerMap).toBe(true);
  });

  it('estatísticas: apenas essential e guardian', () => {
    expect(PLAN_FEATURES.free.statistics).toBe(false);
    expect(PLAN_FEATURES.essential.statistics).toBe(true);
    expect(PLAN_FEATURES.guardian.statistics).toBe(true);
  });

  it('módulo familiar: apenas guardian (hard rule: nunca expor dados sem consentimento)', () => {
    expect(PLAN_FEATURES.free.familyModule).toBe(false);
    expect(PLAN_FEATURES.essential.familyModule).toBe(false);
    expect(PLAN_FEATURES.guardian.familyModule).toBe(true);
  });

  it('programa 30 dias: apenas guardian', () => {
    expect(PLAN_FEATURES.free.program30Days).toBe(false);
    expect(PLAN_FEATURES.essential.program30Days).toBe(false);
    expect(PLAN_FEATURES.guardian.program30Days).toBe(true);
  });

  it('comunidade: apenas guardian', () => {
    expect(PLAN_FEATURES.free.community).toBe(false);
    expect(PLAN_FEATURES.essential.community).toBe(false);
    expect(PLAN_FEATURES.guardian.community).toBe(true);
  });
});

describe('PRICING', () => {
  it('Essential mensal é R$19,90', () => {
    expect(PRICING.essential.monthly).toBe(19.9);
  });

  it('Guardião mensal é R$39,90', () => {
    expect(PRICING.guardian.monthly).toBe(39.9);
  });

  it('plano anual é mais barato que 12x mensal (Essential)', () => {
    expect(PRICING.essential.annual).toBeLessThan(PRICING.essential.monthly * 12);
  });

  it('plano anual é mais barato que 12x mensal (Guardian)', () => {
    expect(PRICING.guardian.annual).toBeLessThan(PRICING.guardian.monthly * 12);
  });

  it('moeda é BRL', () => {
    expect(PRICING.essential.currency).toBe('BRL');
    expect(PRICING.guardian.currency).toBe('BRL');
  });
});
